import pytest
import os
import sys
import tempfile
import shutil
from unittest.mock import Mock, patch
import numpy as np
import pandas as pd

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture(scope="session")
def test_data():
    """Generate test data for ML models"""
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'pH': np.random.normal(7.0, 1.0, n_samples),
        'Hardness': np.random.normal(200, 50, n_samples),
        'Solids': np.random.normal(20000, 5000, n_samples),
        'Chloramines': np.random.normal(7.0, 2.0, n_samples),
        'Sulfate': np.random.normal(300, 100, n_samples),
        'Conductivity': np.random.normal(500, 100, n_samples),
        'Organic_carbon': np.random.normal(15, 5, n_samples),
        'Trihalomethanes': np.random.normal(80, 20, n_samples),
        'Turbidity': np.random.normal(4.0, 1.0, n_samples)
    }
    
    # Create target based on simple rules
    df = pd.DataFrame(data)
    df['Potability'] = ((df['pH'] >= 6.5) & (df['pH'] <= 8.5) & 
                       (df['Turbidity'] <= 5.0)).astype(int)
    
    return df

@pytest.fixture
def sample_features():
    """Sample feature array for testing"""
    return np.array([[7.0, 200.0, 20000.0, 7.0, 300.0, 500.0, 15.0, 80.0, 4.0]])

@pytest.fixture
def temp_model_dir():
    """Temporary directory for model files"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

@pytest.fixture
def mock_model():
    """Mock ML model for testing"""
    model = Mock()
    model.predict.return_value = np.array([1])
    model.predict_proba.return_value = np.array([[0.2, 0.8]])
    return model

@pytest.fixture
def mock_scaler():
    """Mock scaler for testing"""
    scaler = Mock()
    scaler.transform.return_value = np.array([[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]])
    return scaler

@pytest.fixture
def prediction_input_data():
    """Valid prediction input data"""
    return {
        "pH": 7.0,
        "Hardness": 200.0,
        "Solids": 20000.0,
        "Chloramines": 7.0,
        "Sulfate": 300.0,
        "Conductivity": 500.0,
        "Organic_carbon": 15.0,
        "Trihalomethanes": 80.0,
        "Turbidity": 4.0
    }

@pytest.fixture
def invalid_prediction_input():
    """Invalid prediction input data"""
    return {
        "pH": -1.0,  # Invalid pH
        "Hardness": 200.0,
        "Solids": 20000.0,
        "Chloramines": 7.0,
        "Sulfate": 300.0,
        "Conductivity": 500.0,
        "Organic_carbon": 15.0,
        "Trihalomethanes": 80.0,
        "Turbidity": 4.0
    }

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables"""
    original_env = os.environ.copy()
    
    # Set test environment variables
    os.environ.update({
        'LOG_LEVEL': 'ERROR',
        'ENVIRONMENT': 'test',
        'API_KEY': 'test-api-key'
    })
    
    yield
    
    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)

@pytest.fixture
def test_csv_file(test_data, temp_model_dir):
    """Create a test CSV file"""
    csv_path = os.path.join(temp_model_dir, 'test_data.csv')
    test_data.to_csv(csv_path, index=False)
    return csv_path