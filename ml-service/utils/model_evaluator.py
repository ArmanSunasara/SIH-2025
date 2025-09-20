"""
Model evaluation utilities for ML service
"""
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_auc_score,
    precision_recall_curve, roc_curve
)
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class ModelEvaluator:
    """
    Model evaluation and metrics calculation
    """
    
    def __init__(self):
        """Initialize evaluator"""
        pass
    
    def evaluate_model(self, model, X_train: np.ndarray, X_test: np.ndarray, 
                      y_train: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """
        Comprehensive model evaluation
        
        Args:
            model: Trained model
            X_train: Training features
            X_test: Test features
            y_train: Training targets
            y_test: Test targets
            
        Returns:
            Evaluation metrics dictionary
        """
        try:
            # Predictions
            y_train_pred = model.predict(X_train)
            y_test_pred = model.predict(X_test)
            
            # Probabilities (if available)
            try:
                y_train_proba = model.predict_proba(X_train)[:, 1]
                y_test_proba = model.predict_proba(X_test)[:, 1]
            except:
                y_train_proba = None
                y_test_proba = None
            
            # Calculate metrics
            results = {
                # Training metrics
                'train_accuracy': accuracy_score(y_train, y_train_pred),
                'train_precision': precision_score(y_train, y_train_pred, zero_division=0),
                'train_recall': recall_score(y_train, y_train_pred, zero_division=0),
                'train_f1': f1_score(y_train, y_train_pred, zero_division=0),
                
                # Test metrics
                'accuracy': accuracy_score(y_test, y_test_pred),
                'precision': precision_score(y_test, y_test_pred, zero_division=0),
                'recall': recall_score(y_test, y_test_pred, zero_division=0),
                'f1': f1_score(y_test, y_test_pred, zero_division=0),
                
                # Confusion matrices
                'train_confusion_matrix': confusion_matrix(y_train, y_train_pred).tolist(),
                'test_confusion_matrix': confusion_matrix(y_test, y_test_pred).tolist(),
                
                # Classification reports
                'train_classification_report': classification_report(y_train, y_train_pred, output_dict=True),
                'test_classification_report': classification_report(y_test, y_test_pred, output_dict=True)
            }
            
            # AUC scores (if probabilities available)
            if y_train_proba is not None and y_test_proba is not None:
                try:
                    results['train_auc'] = roc_auc_score(y_train, y_train_proba)
                    results['test_auc'] = roc_auc_score(y_test, y_test_proba)
                except:
                    logger.warning("Could not calculate AUC scores")
            
            # Calculate overfitting indicator
            results['overfitting_score'] = self._calculate_overfitting(results)
            
            logger.info(f"Model evaluation completed. Test F1: {results['f1']:.4f}")
            return results
            
        except Exception as e:
            logger.error(f"Error in model evaluation: {e}")
            raise
    
    def _calculate_overfitting(self, results: Dict[str, Any]) -> float:
        """
        Calculate overfitting score
        
        Args:
            results: Evaluation results
            
        Returns:
            Overfitting score (higher = more overfitting)
        """
        try:
            train_f1 = results.get('train_f1', 0)
            test_f1 = results.get('f1', 0)
            
            if train_f1 == 0:
                return 0.0
            
            overfitting_score = (train_f1 - test_f1) / train_f1
            return max(0.0, overfitting_score)
            
        except:
            return 0.0
    
    def calculate_feature_importance(self, model, feature_names: list) -> Dict[str, float]:
        """
        Calculate feature importance if available
        
        Args:
            model: Trained model
            feature_names: List of feature names
            
        Returns:
            Feature importance dictionary
        """
        try:
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                feature_importance = dict(zip(feature_names, importances))
                
                # Sort by importance
                sorted_importance = dict(
                    sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
                )
                
                logger.info("Feature importance calculated")
                return sorted_importance
            else:
                logger.warning("Model does not support feature importance")
                return {}
                
        except Exception as e:
            logger.error(f"Error calculating feature importance: {e}")
            return {}
    
    def calculate_prediction_intervals(self, model, X: np.ndarray, 
                                     confidence_level: float = 0.95) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculate prediction intervals (for ensemble models)
        
        Args:
            model: Trained ensemble model
            X: Input features
            confidence_level: Confidence level for intervals
            
        Returns:
            Tuple of (lower_bounds, upper_bounds)
        """
        try:
            if hasattr(model, 'estimators_'):
                # For ensemble models, use individual estimator predictions
                predictions = np.array([
                    estimator.predict(X) for estimator in model.estimators_
                ])
                
                alpha = 1 - confidence_level
                lower_percentile = (alpha / 2) * 100
                upper_percentile = (1 - alpha / 2) * 100
                
                lower_bounds = np.percentile(predictions, lower_percentile, axis=0)
                upper_bounds = np.percentile(predictions, upper_percentile, axis=0)
                
                return lower_bounds, upper_bounds
            else:
                logger.warning("Model does not support prediction intervals")
                return np.array([]), np.array([])
                
        except Exception as e:
            logger.error(f"Error calculating prediction intervals: {e}")
            return np.array([]), np.array([])
    
    def calculate_calibration_metrics(self, y_true: np.ndarray, y_proba: np.ndarray, 
                                    n_bins: int = 10) -> Dict[str, Any]:
        """
        Calculate calibration metrics
        
        Args:
            y_true: True labels
            y_proba: Predicted probabilities
            n_bins: Number of bins for calibration curve
            
        Returns:
            Calibration metrics
        """
        try:
            from sklearn.calibration import calibration_curve
            
            fraction_of_positives, mean_predicted_value = calibration_curve(
                y_true, y_proba, n_bins=n_bins
            )
            
            # Calculate Expected Calibration Error (ECE)
            bin_boundaries = np.linspace(0, 1, n_bins + 1)
            bin_lowers = bin_boundaries[:-1]
            bin_uppers = bin_boundaries[1:]
            
            ece = 0
            for bin_lower, bin_upper in zip(bin_lowers, bin_uppers):
                in_bin = (y_proba > bin_lower) & (y_proba <= bin_upper)
                prop_in_bin = in_bin.mean()
                
                if prop_in_bin > 0:
                    accuracy_in_bin = y_true[in_bin].mean()
                    avg_confidence_in_bin = y_proba[in_bin].mean()
                    ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
            
            return {
                'expected_calibration_error': float(ece),
                'fraction_of_positives': fraction_of_positives.tolist(),
                'mean_predicted_value': mean_predicted_value.tolist()
            }
            
        except ImportError:
            logger.warning("sklearn calibration not available")
            return {}
        except Exception as e:
            logger.error(f"Error calculating calibration metrics: {e}")
            return {}
    
    def generate_evaluation_report(self, results: Dict[str, Any], 
                                 feature_importance: Dict[str, float] = None) -> str:
        """
        Generate a comprehensive evaluation report
        
        Args:
            results: Evaluation results
            feature_importance: Feature importance dictionary
            
        Returns:
            Formatted evaluation report
        """
        report = []
        report.append("=" * 60)
        report.append("MODEL EVALUATION REPORT")
        report.append("=" * 60)
        
        # Performance metrics
        report.append("\nPERFORMANCE METRICS:")
        report.append(f"Test Accuracy:  {results.get('accuracy', 0):.4f}")
        report.append(f"Test Precision: {results.get('precision', 0):.4f}")
        report.append(f"Test Recall:    {results.get('recall', 0):.4f}")
        report.append(f"Test F1 Score:  {results.get('f1', 0):.4f}")
        
        if 'test_auc' in results:
            report.append(f"Test AUC:       {results['test_auc']:.4f}")
        
        # Overfitting analysis
        overfitting = results.get('overfitting_score', 0)
        report.append(f"\nOVERFITTING SCORE: {overfitting:.4f}")
        if overfitting > 0.1:
            report.append("WARNING: Model may be overfitting!")
        
        # Feature importance
        if feature_importance:
            report.append("\nTOP 5 IMPORTANT FEATURES:")
            for i, (feature, importance) in enumerate(list(feature_importance.items())[:5]):
                report.append(f"{i+1}. {feature}: {importance:.4f}")
        
        # Cross-validation results
        if 'cv_mean' in results:
            report.append(f"\nCROSS-VALIDATION:")
            report.append(f"Mean F1: {results['cv_mean']:.4f} (+/- {results.get('cv_std', 0)*2:.4f})")
        
        report.append("\n" + "=" * 60)
        
        return "\n".join(report)