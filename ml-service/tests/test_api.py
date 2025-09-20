import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

client = TestClient(app)

class TestAPIEndpoints:
    """Test API endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Water Quality ML Service Running ✅"
        assert data["status"] == "healthy"
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "model_loaded" in data
        assert "model_version" in data
    
    def test_predict_endpoint_valid_data(self):
        """Test prediction endpoint with valid data"""
        payload = {
            "features": [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "prediction" in data
        assert "probability" in data
        assert "result" in data
        assert "confidence" in data
        assert data["prediction"] in [0, 1]
        assert 0 <= data["probability"] <= 1
        assert 0 <= data["confidence"] <= 1
        assert data["result"] in ["Safe", "Not Safe"]
    
    def test_predict_endpoint_invalid_features_count(self):
        """Test prediction endpoint with invalid feature count"""
        payload = {
            "features": [7.0, 200.0, 20000.0]  # Only 3 features instead of 9
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_predict_endpoint_invalid_feature_values(self):
        """Test prediction endpoint with invalid feature values"""
        payload = {
            "features": [15.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]  # pH > 14
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 400
    
    def test_predict_batch_endpoint(self):
        """Test batch prediction endpoint"""
        payload = {
            "batch": [
                [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0],
                [6.5, 180.0, 18000.0, 6.5, 280.0, 450.0, 14.0, 75.0, 3.5]
            ]
        }
        
        response = client.post("/predict/batch", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        
        for result in data:
            assert "prediction" in result
            assert "probability" in result
            assert "result" in result
            assert "confidence" in result
    
    def test_predict_batch_too_large(self):
        """Test batch prediction with too many samples"""
        # Create batch with 101 samples (over the limit of 100)
        large_batch = [[7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]] * 101
        payload = {"batch": large_batch}
        
        response = client.post("/predict/batch", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "too large" in data["message"].lower()
    
    def test_model_info_endpoint(self):
        """Test model info endpoint"""
        response = client.get("/model/info")
        assert response.status_code == 200
        
        data = response.json()
        assert "model_loaded" in data
        assert "model_version" in data
        assert "feature_names" in data
        assert "model_type" in data
        assert "scaler_type" in data
    
    def test_model_reload_endpoint(self):
        """Test model reload endpoint"""
        response = client.post("/model/reload")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert "reloaded" in data["message"].lower()

class TestAPIWithAuthentication:
    """Test API endpoints with authentication enabled"""
    
    @patch.dict(os.environ, {"API_KEY": "test-api-key"})
    def test_predict_with_valid_api_key(self):
        """Test prediction with valid API key"""
        payload = {
            "features": [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]
        }
        headers = {"Authorization": "Bearer test-api-key"}
        
        response = client.post("/predict", json=payload, headers=headers)
        assert response.status_code == 200
    
    @patch.dict(os.environ, {"API_KEY": "test-api-key"})
    def test_predict_with_invalid_api_key(self):
        """Test prediction with invalid API key"""
        payload = {
            "features": [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]
        }
        headers = {"Authorization": "Bearer wrong-api-key"}
        
        response = client.post("/predict", json=payload, headers=headers)
        assert response.status_code == 401
    
    @patch.dict(os.environ, {"API_KEY": "test-api-key"})
    def test_predict_without_api_key(self):
        """Test prediction without API key when required"""
        payload = {
            "features": [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 401

class TestErrorHandling:
    """Test error handling"""
    
    def test_invalid_json(self):
        """Test handling of invalid JSON"""
        response = client.post(
            "/predict",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_missing_features(self):
        """Test handling of missing features field"""
        payload = {"not_features": [7.0, 200.0]}
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 422
    
    def test_non_existent_endpoint(self):
        """Test non-existent endpoint"""
        response = client.get("/non-existent")
        assert response.status_code == 404
    
    @patch('app.predictor', None)
    def test_predictor_not_available(self):
        """Test when predictor is not available"""
        payload = {
            "features": [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 503
        data = response.json()
        assert "not available" in data["message"].lower()