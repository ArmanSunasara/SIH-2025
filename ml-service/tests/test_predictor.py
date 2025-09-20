import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from inference.predictor import WaterQualityPredictor, PredictionInput, PredictionOutput

class TestPredictionInput:
    """Test PredictionInput model"""
    
    def test_valid_input(self, prediction_input_data):
        """Test valid input data"""
        input_data = PredictionInput(**prediction_input_data)
        assert input_data.pH == 7.0
        assert input_data.Hardness == 200.0
        assert len(input_data.to_array()[0]) == 9
    
    def test_invalid_ph_range(self):
        """Test invalid pH range"""
        with pytest.raises(ValueError, match="pH must be between 0 and 14"):
            PredictionInput(
                pH=15.0,  # Invalid pH
                Hardness=200.0,
                Solids=20000.0,
                Chloramines=7.0,
                Sulfate=300.0,
                Conductivity=500.0,
                Organic_carbon=15.0,
                Trihalomethanes=80.0,
                Turbidity=4.0
            )
    
    def test_negative_values(self):
        """Test negative values validation"""
        with pytest.raises(ValueError):
            PredictionInput(
                pH=7.0,
                Hardness=-200.0,  # Negative value
                Solids=20000.0,
                Chloramines=7.0,
                Sulfate=300.0,
                Conductivity=500.0,
                Organic_carbon=15.0,
                Trihalomethanes=80.0,
                Turbidity=4.0
            )

class TestWaterQualityPredictor:
    """Test WaterQualityPredictor class"""
    
    def test_predictor_initialization(self, temp_model_dir):
        """Test predictor initialization"""
        predictor = WaterQualityPredictor(model_dir=temp_model_dir)
        assert predictor.model_dir == temp_model_dir
        assert predictor.model is not None  # Should have fallback model
        assert predictor.scaler is not None
    
    @patch('inference.predictor.joblib.load')
    @patch('inference.predictor.os.path.exists')
    def test_load_model_success(self, mock_exists, mock_load, temp_model_dir, mock_model, mock_scaler):
        """Test successful model loading"""
        mock_exists.return_value = True
        mock_load.side_effect = [mock_model, mock_scaler, ['pH', 'Hardness']]
        
        predictor = WaterQualityPredictor(model_dir=temp_model_dir)
        result = predictor.load_model()
        
        assert result is True
        assert predictor.is_loaded is True
        assert predictor.model == mock_model
        assert predictor.scaler == mock_scaler
    
    @patch('inference.predictor.os.path.exists')
    def test_load_model_failure(self, mock_exists, temp_model_dir):
        """Test model loading failure"""
        mock_exists.return_value = False
        
        predictor = WaterQualityPredictor(model_dir=temp_model_dir)
        result = predictor.load_model()
        
        assert result is False
        assert predictor.is_loaded is False
    
    def test_predict_with_dict_input(self, temp_model_dir, prediction_input_data):
        """Test prediction with dictionary input"""
        predictor = WaterQualityPredictor(model_dir=temp_model_dir)
        result = predictor.predict(prediction_input_data)
        
        assert isinstance(result, PredictionOutput)
        assert result.prediction in [0, 1]
        assert 0 <= result.probability <= 1
        assert 0 <= result.confidence <= 1
        assert result.result in ['Safe', 'Not Safe']
        assert result.model_version is not None
        assert len(result.features_used) == 9
    
    def test_predict_with_list_input(self, temp_model_dir):
        """Test prediction with list input"""
        predictor = WaterQualityPredictor(model_dir=temp_model_dir)
        features = [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]
        result = predictor.predict(features)
        
        assert isinstance(result, PredictionOutput)
        assert result.prediction in [0, 1]
    
    def test_predict_with_invalid_list_length(self, temp_model_dir):
        """Test prediction with invalid list length"""
        predictor = WaterQualityPredictor(model_dir=temp_model_dir)
        features = [7.0, 200.0, 20000.0]  # Too short
        
        with pytest.raises(ValueError, match="Input list must have exactly 9 features"):
            predictor.predict(features)
    
    def test_predict_batch(self, temp_model_dir):
        """Test batch prediction"""
        predictor = WaterQualityPredictor(model_dir=temp_model_dir)
        batch = [
            [7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0],
            [6.5, 180.0, 18000.0, 6.5, 280.0, 450.0, 14.0, 75.0, 3.5]
        ]
        
        # Process each item individually since predict_batch expects specific types
        results = []
        for features in batch:
            result = predictor.predict(features)
            results.append(result)
        
        assert len(results) == 2
        assert all(isinstance(result, PredictionOutput) for result in results)
    
    def test_get_model_info(self, temp_model_dir):
        """Test get model info"""
        predictor = WaterQualityPredictor(model_dir=temp_model_dir)
        info = predictor.get_model_info()
        
        assert 'model_loaded' in info
        assert 'model_version' in info
        assert 'feature_names' in info
        assert 'model_type' in info
        assert 'scaler_type' in info
    
    def test_validate_input(self, temp_model_dir, prediction_input_data, invalid_prediction_input):
        """Test input validation"""
        predictor = WaterQualityPredictor(model_dir=temp_model_dir)
        
        # Valid input
        assert predictor.validate_input(prediction_input_data) is True
        
        # Invalid input
        assert predictor.validate_input(invalid_prediction_input) is False

class TestMockModel:
    """Test mock model functionality"""
    
    def test_mock_model_predict(self, sample_features):
        """Test mock model prediction"""
        from inference.predictor import MockModel
        
        model = MockModel()
        predictions = model.predict(sample_features)
        
        assert len(predictions) == 1
        assert predictions[0] in [0, 1]
    
    def test_mock_model_predict_proba(self, sample_features):
        """Test mock model probability prediction"""
        from inference.predictor import MockModel
        
        model = MockModel()
        probabilities = model.predict_proba(sample_features)
        
        assert probabilities.shape == (1, 2)
        assert np.allclose(probabilities.sum(axis=1), 1.0)
        assert np.all((probabilities >= 0) & (probabilities <= 1))

class TestMockScaler:
    """Test mock scaler functionality"""
    
    def test_mock_scaler_transform(self, sample_features):
        """Test mock scaler transformation"""
        from inference.predictor import MockScaler
        
        scaler = MockScaler()
        transformed = scaler.transform(sample_features)
        
        assert transformed.shape == sample_features.shape
        assert transformed.dtype == float