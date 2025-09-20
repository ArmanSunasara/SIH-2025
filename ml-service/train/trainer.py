"""
Training module for water quality prediction model
"""
import os
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Dict, Any

from ..utils.logger import get_logger
from ..utils.data_validator import validate_training_data
from ..utils.model_evaluator import ModelEvaluator

logger = get_logger(__name__)

class WaterQualityTrainer:
    """
    Water Quality Model Trainer
    """
    
    def __init__(self, model_dir: str = "ml"):
        """
        Initialize the trainer
        
        Args:
            model_dir: Directory to save trained models
        """
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.feature_names = [
            'pH', 'Hardness', 'Solids', 'Chloramines', 
            'Sulfate', 'Conductivity', 'Organic_carbon', 
            'Trihalomethanes', 'Turbidity'
        ]
        self.model_evaluator = ModelEvaluator()
        
        # Ensure model directory exists
        os.makedirs(self.model_dir, exist_ok=True)
        logger.info(f"Model directory: {self.model_dir}")
    
    def load_data(self, data_path: str) -> pd.DataFrame:
        """
        Load and validate training data
        
        Args:
            data_path: Path to the CSV data file
            
        Returns:
            Loaded and validated DataFrame
        """
        try:
            logger.info(f"Loading data from {data_path}")
            data = pd.read_csv(data_path)
            
            # Validate data
            validate_training_data(data, self.feature_names)
            
            logger.info(f"Loaded {len(data)} samples with {len(data.columns)} features")
            return data
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def preprocess_data(self, data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess the data for training
        
        Args:
            data: Raw data DataFrame
            
        Returns:
            Tuple of (X, y) preprocessed data
        """
        try:
            logger.info("Preprocessing data...")
            
            # Separate features and target
            X = data[self.feature_names].values
            y = data['Potability'].values
            
            # Handle missing values
            X = self._handle_missing_values(X)
            
            # Initialize and fit scaler
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            
            logger.info(f"Preprocessed data shape: X={X_scaled.shape}, y={y.shape}")
            logger.info(f"Target distribution: {np.bincount(y)}")
            
            return X_scaled, y
            
        except Exception as e:
            logger.error(f"Error preprocessing data: {e}")
            raise
    
    def _handle_missing_values(self, X: np.ndarray) -> np.ndarray:
        """
        Handle missing values in the dataset
        
        Args:
            X: Feature matrix
            
        Returns:
            Feature matrix with handled missing values
        """
        # Fill missing values with median
        for i in range(X.shape[1]):
            col = X[:, i]
            mask = ~np.isnan(col)
            if mask.sum() > 0:
                median_val = np.median(col[mask])
                X[~mask, i] = median_val
        
        return X
    
    def train_model(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """
        Train the model with hyperparameter tuning
        
        Args:
            X: Feature matrix
            y: Target vector
            
        Returns:
            Training results dictionary
        """
        try:
            logger.info("Starting model training...")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Hyperparameter tuning
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
            
            base_model = RandomForestClassifier(random_state=42)
            grid_search = GridSearchCV(
                base_model, 
                param_grid, 
                cv=5, 
                scoring='f1',
                n_jobs=-1,
                verbose=1
            )
            
            logger.info("Performing hyperparameter tuning...")
            grid_search.fit(X_train, y_train)
            
            # Best model
            self.model = grid_search.best_estimator_
            logger.info(f"Best parameters: {grid_search.best_params_}")
            
            # Evaluate model
            results = self.model_evaluator.evaluate_model(
                self.model, X_train, X_test, y_train, y_test
            )
            
            # Cross-validation
            cv_scores = cross_val_score(self.model, X_train, y_train, cv=5, scoring='f1')
            results['cv_scores'] = cv_scores
            results['cv_mean'] = cv_scores.mean()
            results['cv_std'] = cv_scores.std()
            
            logger.info(f"Training completed. F1 Score: {results['f1']:.4f}")
            logger.info(f"Cross-validation F1: {results['cv_mean']:.4f} (+/- {results['cv_std']*2:.4f})")
            
            return results
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            raise
    
    def save_model(self) -> bool:
        """
        Save the trained model and scaler
        
        Returns:
            Success status
        """
        try:
            if self.model is None or self.scaler is None:
                raise ValueError("Model or scaler not trained")
            
            model_path = os.path.join(self.model_dir, "model.pkl")
            scaler_path = os.path.join(self.model_dir, "scaler.pkl")
            
            joblib.dump(self.model, model_path)
            joblib.dump(self.scaler, scaler_path)
            
            logger.info(f"Model saved to {model_path}")
            logger.info(f"Scaler saved to {scaler_path}")
            
            # Save feature names
            feature_path = os.path.join(self.model_dir, "features.pkl")
            joblib.dump(self.feature_names, feature_path)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            return False
    
    def load_model(self) -> bool:
        """
        Load a pre-trained model and scaler
        
        Returns:
            Success status
        """
        try:
            model_path = os.path.join(self.model_dir, "model.pkl")
            scaler_path = os.path.join(self.model_dir, "scaler.pkl")
            
            if not os.path.exists(model_path) or not os.path.exists(scaler_path):
                return False
            
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            
            # Load feature names if available
            feature_path = os.path.join(self.model_dir, "features.pkl")
            if os.path.exists(feature_path):
                self.feature_names = joblib.load(feature_path)
            
            logger.info("Model and scaler loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    def train_from_file(self, data_path: str) -> Dict[str, Any]:
        """
        Complete training pipeline from file
        
        Args:
            data_path: Path to training data CSV
            
        Returns:
            Training results
        """
        try:
            # Load and preprocess data
            data = self.load_data(data_path)
            X, y = self.preprocess_data(data)
            
            # Train model
            results = self.train_model(X, y)
            
            # Save model
            if self.save_model():
                results['model_saved'] = True
                logger.info("Training pipeline completed successfully")
            else:
                results['model_saved'] = False
                logger.warning("Model training completed but saving failed")
            
            return results
            
        except Exception as e:
            logger.error(f"Training pipeline failed: {e}")
            raise