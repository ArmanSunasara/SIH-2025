# app.py - FastAPI ML Service with Enhanced Security and Logging

import os
import sys
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import uvicorn
from pydantic import BaseModel, Field

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from inference import WaterQualityPredictor, PredictionInput, PredictionOutput
from utils import get_logger, setup_logging

# Initialize logging
setup_logging(level=os.getenv("LOG_LEVEL", "INFO"))
logger = get_logger(__name__)

# Global predictor instance
predictor = None

# Security
security = HTTPBearer(auto_error=False)

# =====================================================
# PYDANTIC MODELS
# =====================================================

class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    message: str
    model_loaded: bool
    model_version: str
    uptime: float

class PredictionRequest(BaseModel):
    """Prediction request model"""
    features: List[float] = Field(..., min_length=9, max_length=9, 
                                 description="Water quality features (9 values)")
    
    class Config:
        schema_extra = {
            "example": {
                "features": [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]
            }
        }

class BatchPredictionRequest(BaseModel):
    """Batch prediction request model"""
    batch: List[List[float]] = Field(..., description="List of feature arrays")
    
    class Config:
        schema_extra = {
            "example": {
                "batch": [
                    [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0],
                    [6.5, 180.0, 18000.0, 6.5, 280.0, 450.0, 14.0, 75.0, 3.5]
                ]
            }
        }

class ErrorResponse(BaseModel):
    """Error response model"""
    status: str = "error"
    message: str
    detail: Optional[str] = None

# =====================================================
# LIFESPAN MANAGEMENT
# =====================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    logger.info("Starting ML Service...")
    global predictor
    try:
        predictor = WaterQualityPredictor()
        logger.info("Predictor initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize predictor: {e}")
        predictor = None
    
    yield
    
    # Shutdown
    logger.info("Shutting down ML Service...")
    predictor = None

# =====================================================
# FASTAPI APPLICATION
# =====================================================

app = FastAPI(
    title="Water Quality ML Service",
    description="Machine Learning service for water quality prediction with enhanced security and logging",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if os.getenv("ENVIRONMENT", "development") == "development" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT", "development") == "development" else None
)

# =====================================================
# MIDDLEWARE
# =====================================================

# Trusted hosts middleware
allowed_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    import time
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - {process_time:.4f}s")
    
    return response

# =====================================================
# SECURITY FUNCTIONS
# =====================================================

def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key (if required)"""
    api_key = os.getenv("API_KEY")
    
    if api_key:  # Only check if API key is set
        if not credentials or credentials.credentials != api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing API key",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    return True

# =====================================================
# EXCEPTION HANDLERS
# =====================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.error(f"HTTP error {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(message=exc.detail).dict()
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle validation errors"""
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(message="Invalid input data", detail=str(exc)).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(message="Internal server error").dict()
    )

# =====================================================
# API ENDPOINTS
# =====================================================

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Water Quality ML Service Running ✅",
        "status": "healthy",
        "version": "2.0.0"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    import time
    
    if predictor is None:
        raise HTTPException(
            status_code=503,
            detail="Predictor not initialized"
        )
    
    model_info = predictor.get_model_info()
    
    return HealthResponse(
        status="healthy",
        message="Service is running",
        model_loaded=model_info["model_loaded"],
        model_version=model_info["model_version"],
        uptime=time.time() - app.state.start_time if hasattr(app.state, 'start_time') else 0.0
    )

@app.post("/predict", response_model=PredictionOutput)
async def predict_water_quality(
    request: PredictionRequest,
    _: bool = Depends(verify_api_key)
):
    """Predict water quality for a single sample"""
    try:
        if predictor is None:
            raise HTTPException(
                status_code=503,
                detail="Predictor not available"
            )
        
        logger.info(f"Prediction request received: {len(request.features)} features")
        
        # Convert to PredictionInput
        prediction_input = PredictionInput(
            pH=request.features[0],
            Hardness=request.features[1],
            Solids=request.features[2],
            Chloramines=request.features[3],
            Sulfate=request.features[4],
            Conductivity=request.features[5],
            Organic_carbon=request.features[6],
            Trihalomethanes=request.features[7],
            Turbidity=request.features[8]
        )
        
        # Make prediction
        result = predictor.predict(prediction_input)
        
        logger.info(f"Prediction completed: {result.result}")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in prediction: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed")

@app.post("/predict/batch", response_model=List[PredictionOutput])
async def predict_batch(
    request: BatchPredictionRequest,
    _: bool = Depends(verify_api_key)
):
    """Predict water quality for multiple samples"""
    try:
        if predictor is None:
            raise HTTPException(
                status_code=503,
                detail="Predictor not available"
            )
        
        if len(request.batch) > 100:  # Limit batch size
            raise HTTPException(
                status_code=400,
                detail="Batch size too large (maximum 100 samples)"
            )
        
        logger.info(f"Batch prediction request: {len(request.batch)} samples")
        
        # Convert to list of features and process with predictor
        results = []
        for features in request.batch:
            if len(features) != 9:
                raise ValueError(f"Each sample must have exactly 9 features, got {len(features)}")
            result = predictor.predict(features)
            results.append(result)
        
        logger.info(f"Batch prediction completed: {len(results)} results")
        return results
        
    except ValueError as e:
        logger.error(f"Validation error in batch prediction: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Batch prediction failed")

@app.get("/model/info", response_model=Dict[str, Any])
async def get_model_info(_: bool = Depends(verify_api_key)):
    """Get model information"""
    if predictor is None:
        raise HTTPException(
            status_code=503,
            detail="Predictor not available"
        )
    
    return predictor.get_model_info()

@app.post("/model/reload")
async def reload_model(_: bool = Depends(verify_api_key)):
    """Reload the model"""
    global predictor
    
    try:
        logger.info("Reloading model...")
        predictor = WaterQualityPredictor()
        logger.info("Model reloaded successfully")
        
        return {"status": "success", "message": "Model reloaded"}
        
    except Exception as e:
        logger.error(f"Error reloading model: {e}")
        raise HTTPException(status_code=500, detail="Model reload failed")

# =====================================================
# APPLICATION STARTUP
# =====================================================

if __name__ == "__main__":
    import time
    app.state.start_time = time.time()
    
    port = int(os.getenv("PORT", 5001))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT", "development") == "development",
        log_level="info",
        access_log=True
    )