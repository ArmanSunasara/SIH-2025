"""
Inference module for water quality prediction
"""
import os
import logging
import joblib
import numpy as np
from typing import Dict, List, Union, Optional
from pydantic import BaseModel, Field, validator

from utils.logger import get_logger
from utils.data_validator import validate_inference_data
from utils.model_evaluator import ModelEvaluator

logger = get_logger(__name__)

class PredictionInput(BaseModel):
    """
    Input data model for prediction
    """
    pH: float = Field(..., ge=0, le=14, description="pH level (0-14)")
    Hardness: float = Field(..., ge=0, description="Water hardness")
    Solids: float = Field(..., ge=0, description="Total dissolved solids")
    Chloramines: float = Field(..., ge=0, description="Chloramines level")
    Sulfate: float = Field(..., ge=0, description="Sulfate level")
    Conductivity: float = Field(..., ge=0, description="Electrical conductivity")
    Organic_carbon: float = Field(..., ge=0, description="Organic carbon level")
    Trihalomethanes: float = Field(..., ge=0, description="Trihalomethanes level")
    Turbidity: float = Field(..., ge=0, description="Water turbidity")

    @validator('pH')
    def validate_ph(cls, v):
        if not 0 <= v <= 14:
            raise ValueError('pH must be between 0 and 14')
        return v

    def to_array(self) -> np.ndarray:
        """Convert to numpy array for prediction"""
        return np.array([
            self.pH, self.Hardness, self.Solids, self.Chloramines,
            self.Sulfate, self.Conductivity, self.Organic_carbon,
            self.Trihalomethanes, self.Turbidity
        ]).reshape(1, -1)

class PredictionOutput(BaseModel):
    """
    Output data model for prediction
    """
    prediction: int = Field(..., description="Prediction result (0: Not Safe, 1: Safe)")
    probability: float = Field(..., ge=0, le=1, description="Probability of safety")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence")
    result: str = Field(..., description="Human-readable result")
    model_version: str = Field(..., description="Model version used")
    features_used: List[str] = Field(..., description="Features used for prediction")

class WaterQualityPredictor:
    """
    Water Quality Prediction Engine
    """
    
    def __init__(self, model_dir: str = "ml"):
        """
        Initialize the predictor
        
        Args:
            model_dir: Directory containing trained models
        """
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.model_version = "1.0.0"
        self.is_loaded = False
        
        # Try to load model on initialization
        if not self.load_model():
            logger.warning("No trained model found, using fallback model")
            self._initialize_fallback_model()
    
    def load_model(self) -> bool:
        """
        Load trained model and scaler
        
        Returns:
            Success status
        """
        try:
            model_path = os.path.join(self.model_dir, "model.pkl")
            scaler_path = os.path.join(self.model_dir, "scaler.pkl")
            feature_path = os.path.join(self.model_dir, "features.pkl")
            
            if not all(os.path.exists(p) for p in [model_path, scaler_path]):
                logger.warning(f"Model files not found in {self.model_dir}")
                return False
            
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            
            # Load feature names if available
            if os.path.exists(feature_path):
                self.feature_names = joblib.load(feature_path)
            else:
                self.feature_names = [
                    'pH', 'Hardness', 'Solids', 'Chloramines',
                    'Sulfate', 'Conductivity', 'Organic_carbon',
                    'Trihalomethanes', 'Turbidity'
                ]
            
            self.is_loaded = True
            logger.info("Model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    def _initialize_fallback_model(self):
        """Initialize a simple fallback model for demonstration"""
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler
        
        # Create a simple mock model
        self.model = MockModel()
        self.scaler = MockScaler()
        self.feature_names = [
            'pH', 'Hardness', 'Solids', 'Chloramines',
            'Sulfate', 'Conductivity', 'Organic_carbon',
            'Trihalomethanes', 'Turbidity'
        ]
        self.model_version = "fallback-1.0.0"
        logger.info("Fallback model initialized")
    
    def predict(self, input_data: Union[PredictionInput, Dict, List]) -> PredictionOutput:
        """
        Make prediction on input data
        
        Args:
            input_data: Input data for prediction
            
        Returns:
            Prediction output
        """
        try:
            # Convert input to PredictionInput if needed
            if isinstance(input_data, dict):
                input_data = PredictionInput(**input_data)
            elif isinstance(input_data, list):
                if len(input_data) != 9:
                    raise ValueError("Input list must have exactly 9 features")
                input_data = PredictionInput(
                    pH=input_data[0], Hardness=input_data[1], Solids=input_data[2],
                    Chloramines=input_data[3], Sulfate=input_data[4], 
                    Conductivity=input_data[5], Organic_carbon=input_data[6],
                    Trihalomethanes=input_data[7], Turbidity=input_data[8]
                )
            
            # Validate input
            features = input_data.to_array()
            validate_inference_data(features, self.feature_names)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Make prediction
            prediction = self.model.predict(features_scaled)[0]
            probabilities = self.model.predict_proba(features_scaled)[0]
            
            # Calculate confidence and probability
            probability = probabilities[1] if len(probabilities) > 1 else probabilities[0]
            confidence = max(probabilities) if len(probabilities) > 1 else probabilities[0]
            
            # Determine result
            result = "Safe" if prediction == 1 else "Not Safe"
            
            output = PredictionOutput(
                prediction=int(prediction),
                probability=float(probability),
                confidence=float(confidence),
                result=result,
                model_version=self.model_version,
                features_used=self.feature_names
            )
            
            logger.info(f"Prediction made: {result} (confidence: {confidence:.3f})")
            return output
            
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            raise
    
    def predict_batch(self, input_batch: List[Union[PredictionInput, Dict, List]]) -> List[PredictionOutput]:
        """
        Make predictions on a batch of inputs
        
        Args:
            input_batch: List of input data
            
        Returns:
            List of prediction outputs
        """
        try:
            results = []
            for input_data in input_batch:
                result = self.predict(input_data)
                results.append(result)
            
            logger.info(f"Batch prediction completed for {len(input_batch)} samples")
            return results
            
        except Exception as e:
            logger.error(f"Error in batch prediction: {e}")
            raise
    
    def get_model_info(self) -> Dict:
        """
        Get information about the loaded model
        
        Returns:
            Model information dictionary
        """
        return {
            "model_loaded": self.is_loaded,
            "model_version": self.model_version,
            "feature_names": self.feature_names,
            "model_type": type(self.model).__name__ if self.model else None,
            "scaler_type": type(self.scaler).__name__ if self.scaler else None
        }
    
    def validate_input(self, input_data: Dict) -> bool:
        """
        Validate input data format
        
        Args:
            input_data: Input data to validate
            
        Returns:
            Validation status
        """
        try:
            PredictionInput(**input_data)
            return True
        except Exception as e:
            logger.error(f"Input validation failed: {e}")
            return False

class MockModel:
    """Mock model for fallback purposes"""
    
    def predict(self, X):
        # Simple rule-based prediction
        results = []
        for x in X:
            pH = x[0]
            turbidity = x[8] if len(x) > 8 else 5.0
            
            # Simple rules for water safety
            if 6.5 <= pH <= 8.5 and turbidity <= 5.0:
                results.append(1)  # Safe
            else:
                results.append(0)  # Not safe
        
        return np.array(results)
    
    def predict_proba(self, X):
        # Return probability estimates
        results = []
        for x in X:
            pH = x[0]
            turbidity = x[8] if len(x) > 8 else 5.0
            
            base_prob = 0.5
            if 6.5 <= pH <= 8.5:
                base_prob += 0.25
            if turbidity <= 5.0:
                base_prob += 0.15
            
            safe_prob = min(0.99, max(0.01, base_prob))
            unsafe_prob = 1 - safe_prob
            
            results.append([unsafe_prob, safe_prob])
        
        return np.array(results)

class MockScaler:
    """Mock scaler for fallback purposes"""
    
    def transform(self, X):
        # Simple normalization
        return np.array(X, dtype=float)