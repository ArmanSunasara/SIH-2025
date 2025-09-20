"""
Data validation utilities for ML service
"""
import numpy as np
import pandas as pd
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

def validate_training_data(data: pd.DataFrame, expected_features: List[str]) -> None:
    """
    Validate training data format and content
    
    Args:
        data: Training data DataFrame
        expected_features: List of expected feature names
        
    Raises:
        ValueError: If validation fails
    """
    # Check if DataFrame is empty
    if data.empty:
        raise ValueError("Training data is empty")
    
    # Check required columns
    required_columns = expected_features + ['Potability']
    missing_columns = [col for col in required_columns if col not in data.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")
    
    # Check target column values
    unique_targets = data['Potability'].unique()
    if not all(target in [0, 1] for target in unique_targets):
        raise ValueError("Target column 'Potability' must contain only 0 and 1 values")
    
    # Check for minimum number of samples
    if len(data) < 100:
        raise ValueError("Training data must have at least 100 samples")
    
    # Check class distribution
    class_counts = data['Potability'].value_counts()
    if min(class_counts) < 10:
        raise ValueError("Each class must have at least 10 samples")
    
    # Check feature data types
    for feature in expected_features:
        if not pd.api.types.is_numeric_dtype(data[feature]):
            raise ValueError(f"Feature '{feature}' must be numeric")
    
    # Check for excessive missing values
    for feature in expected_features:
        missing_ratio = data[feature].isnull().sum() / len(data)
        if missing_ratio > 0.5:
            raise ValueError(f"Feature '{feature}' has too many missing values ({missing_ratio:.2%})")
    
    # Validate feature ranges
    feature_ranges = {
        'pH': (0, 14),
        'Hardness': (0, float('inf')),
        'Solids': (0, float('inf')),
        'Chloramines': (0, float('inf')),
        'Sulfate': (0, float('inf')),
        'Conductivity': (0, float('inf')),
        'Organic_carbon': (0, float('inf')),
        'Trihalomethanes': (0, float('inf')),
        'Turbidity': (0, float('inf'))
    }
    
    for feature in expected_features:
        if feature in feature_ranges:
            min_val, max_val = feature_ranges[feature]
            feature_data = data[feature].dropna()
            
            if feature_data.min() < min_val:
                raise ValueError(f"Feature '{feature}' has values below minimum ({min_val})")
            
            if max_val != float('inf') and feature_data.max() > max_val:
                raise ValueError(f"Feature '{feature}' has values above maximum ({max_val})")
    
    logger.info("Training data validation passed")

def validate_inference_data(features: np.ndarray, feature_names: List[str]) -> None:
    """
    Validate inference data format and content
    
    Args:
        features: Feature array for inference
        feature_names: List of feature names
        
    Raises:
        ValueError: If validation fails
    """
    # Check array shape
    if features.ndim != 2:
        raise ValueError("Features must be a 2D array")
    
    if features.shape[1] != len(feature_names):
        raise ValueError(f"Expected {len(feature_names)} features, got {features.shape[1]}")
    
    # Check for NaN or infinite values
    if np.any(np.isnan(features)):
        raise ValueError("Features contain NaN values")
    
    if np.any(np.isinf(features)):
        raise ValueError("Features contain infinite values")
    
    # Validate feature ranges
    feature_ranges = {
        0: (0, 14),      # pH
        1: (0, 1000),    # Hardness
        2: (0, 50000),   # Solids
        3: (0, 20),      # Chloramines
        4: (0, 1000),    # Sulfate
        5: (0, 2000),    # Conductivity
        6: (0, 50),      # Organic_carbon
        7: (0, 200),     # Trihalomethanes
        8: (0, 20)       # Turbidity
    }
    
    for i, (min_val, max_val) in feature_ranges.items():
        if i < features.shape[1]:
            feature_values = features[:, i]
            if np.any(feature_values < min_val):
                raise ValueError(f"Feature {feature_names[i]} has values below minimum ({min_val})")
            
            if np.any(feature_values > max_val):
                logger.warning(f"Feature {feature_names[i]} has values above typical maximum ({max_val})")
    
    logger.debug("Inference data validation passed")

def validate_model_output(prediction: np.ndarray, probabilities: np.ndarray) -> None:
    """
    Validate model output format
    
    Args:
        prediction: Model predictions
        probabilities: Model probability outputs
        
    Raises:
        ValueError: If validation fails
    """
    # Check prediction format
    if not isinstance(prediction, np.ndarray):
        raise ValueError("Predictions must be numpy array")
    
    if not all(p in [0, 1] for p in prediction):
        raise ValueError("Predictions must be 0 or 1")
    
    # Check probabilities format
    if not isinstance(probabilities, np.ndarray):
        raise ValueError("Probabilities must be numpy array")
    
    if probabilities.ndim != 2 or probabilities.shape[1] != 2:
        raise ValueError("Probabilities must be 2D array with 2 columns")
    
    # Check probability ranges
    if not np.all((probabilities >= 0) & (probabilities <= 1)):
        raise ValueError("Probabilities must be between 0 and 1")
    
    # Check probability sums
    prob_sums = np.sum(probabilities, axis=1)
    if not np.allclose(prob_sums, 1.0, rtol=1e-5):
        raise ValueError("Probabilities must sum to 1 for each sample")
    
    logger.debug("Model output validation passed")

def check_data_drift(reference_data: np.ndarray, current_data: np.ndarray, 
                    threshold: float = 0.1) -> bool:
    """
    Check for data drift between reference and current data
    
    Args:
        reference_data: Reference dataset
        current_data: Current dataset
        threshold: Drift threshold
        
    Returns:
        True if drift detected
    """
    try:
        from scipy import stats
        
        drift_detected = False
        
        for i in range(min(reference_data.shape[1], current_data.shape[1])):
            ref_feature = reference_data[:, i]
            curr_feature = current_data[:, i]
            
            # Kolmogorov-Smirnov test
            ks_stat, p_value = stats.ks_2samp(ref_feature, curr_feature)
            
            if p_value < threshold:
                drift_detected = True
                logger.warning(f"Data drift detected in feature {i}: p-value = {p_value:.4f}")
        
        return drift_detected
        
    except ImportError:
        logger.warning("scipy not available, skipping drift detection")
        return False
    except Exception as e:
        logger.error(f"Error in drift detection: {e}")
        return False