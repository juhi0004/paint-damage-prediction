"""
Prediction service for damage rate prediction
Handles model loading, inference, and result formatting
"""
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List
import logging
from datetime import datetime
import uuid

from app.services.feature_engineering import FeatureEngineer

logger = logging.getLogger(__name__)


class PredictionService:
    """
    Service for damage rate prediction
    Loads models and performs inference
    """
    
    def __init__(self, models_dir: str = "models"):
        """
        Initialize prediction service
        
        Parameters:
        -----------
        models_dir : str
            Directory containing trained models
        """
        self.models_dir = Path(models_dir)
        self.models = {}
        self.scaler = None
        self.feature_list = None
        self.feature_engineer = None
        self.historical_stats = {}
        
        self._load_models()
        self._load_historical_stats()
        
        # Initialize feature engineer with historical stats
        self.feature_engineer = FeatureEngineer(self.historical_stats)
        
        logger.info("PredictionService initialized successfully")
    
    def _load_models(self):
        """Load trained models"""
        try:
            # Load XGBoost model
            xgb_path = self.models_dir / "xgboost_model.pkl"
            if xgb_path.exists():
                self.models['xgboost'] = joblib.load(xgb_path)
                logger.info("✓ XGBoost model loaded")
            
            # Load feature scaler
            scaler_path = self.models_dir / "scaler.pkl"
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info("✓ Feature scaler loaded")
            
            # Load feature list
            feature_list_path = self.models_dir / "feature_list.pkl"
            if feature_list_path.exists():
                self.feature_list = joblib.load(feature_list_path)
                logger.info(f"✓ Feature list loaded ({len(self.feature_list)} features)")
            
            # Check if deep learning models exist
            try:
                from tensorflow import keras
                
                lstm_path = self.models_dir / "lstm_model.h5"
                if lstm_path.exists():
                    self.models['lstm'] = keras.models.load_model(str(lstm_path))
                    logger.info("✓ LSTM model loaded")
                
                hybrid_path = self.models_dir / "hybrid_model.h5"
                if hybrid_path.exists():
                    self.models['hybrid'] = keras.models.load_model(str(hybrid_path))
                    logger.info("✓ Hybrid model loaded")
            except ImportError:
                logger.warning("TensorFlow not available, deep learning models not loaded")
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise
    
    def _load_historical_stats(self):
        """Load historical statistics for feature engineering"""
        try:
            # Load dealer profiles
            dealer_profile_path = self.models_dir / "dealer_profiles.pkl"
            if dealer_profile_path.exists():
                self.historical_stats['dealer_profiles'] = joblib.load(dealer_profile_path)
                logger.info("✓ Dealer profiles loaded")
            
            # Load warehouse profiles
            warehouse_profile_path = self.models_dir / "warehouse_profiles.pkl"
            if warehouse_profile_path.exists():
                self.historical_stats['warehouse_profiles'] = joblib.load(warehouse_profile_path)
                logger.info("✓ Warehouse profiles loaded")
            
        except Exception as e:
            logger.warning(f"Could not load historical stats: {str(e)}")
    
    def predict(self, shipment_data: Dict[str, Any], model_name: str = "xgboost") -> Dict[str, Any]:
        """
        Make damage rate prediction
        
        Parameters:
        -----------
        shipment_data : dict
            Shipment information
        model_name : str
            Model to use for prediction (default: xgboost)
        
        Returns:
        --------
        dict : Prediction results with recommendations
        """
        try:
            # Generate prediction ID
            prediction_id = f"pred_{uuid.uuid4().hex[:16]}"
            
            # Engineer features
            features = self.feature_engineer.engineer_features(shipment_data)
            
            # Prepare feature vector
            feature_vector = self._prepare_feature_vector(features)
            
            # Make prediction
            if model_name == "xgboost" and "xgboost" in self.models:
                predicted_damage_rate = self._predict_xgboost(feature_vector)
            elif model_name == "ensemble":
                predicted_damage_rate = self._predict_ensemble(feature_vector)
            else:
                # Default to XGBoost
                predicted_damage_rate = self._predict_xgboost(feature_vector)
            
            # Calculate derived metrics
            predicted_returned = int(np.round(predicted_damage_rate * shipment_data['shipped']))
            risk_category = self._categorize_risk(predicted_damage_rate)
            estimated_loss = predicted_returned * features['price_per_tin']
            
            # Get feature importance
            feature_importance = self._get_feature_importance(features)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                predicted_damage_rate=predicted_damage_rate,
                features=features,
                shipment_data=shipment_data
            )
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence(features)
            
            # Prepare response
            response = {
                'prediction_id': prediction_id,
                'timestamp': datetime.now(),
                'predicted_damage_rate': float(predicted_damage_rate),
                'predicted_returned': predicted_returned,
                'risk_category': risk_category,
                'confidence_score': float(confidence_score),
                'estimated_loss': float(estimated_loss),
                'model_name': model_name.upper(),  # Only model_name, not model_used
                'feature_importance': feature_importance,
                'recommendations': recommendations,
                'dealer_historical_risk': self._get_dealer_risk_level(features['dealer_historical_damage_rate']),
                'warehouse_historical_risk': self._get_warehouse_risk_level(features['warehouse_damage_rate']),
                'is_overloaded': bool(features['overloaded']),
                'loading_ratio': float(features['loading_ratio'])
            }
            
            logger.info(f"Prediction completed: {prediction_id}, Risk: {risk_category}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise
    
    def _prepare_feature_vector(self, features: Dict[str, Any]) -> np.ndarray:
        """Prepare feature vector for model input"""
        # Create DataFrame with features
        feature_df = pd.DataFrame([features])
        
        # Select only features used by model
        if self.feature_list:
            # Add missing features with default values
            for feat in self.feature_list:
                if feat not in feature_df.columns:
                    feature_df[feat] = 0
            
            feature_df = feature_df[self.feature_list]
        
        return feature_df.values
    
    def _predict_xgboost(self, feature_vector: np.ndarray) -> float:
        """Make prediction using XGBoost model"""
        prediction = self.models['xgboost'].predict(feature_vector)[0]
        return float(np.clip(prediction, 0, 1))
    
    def _predict_ensemble(self, feature_vector: np.ndarray) -> float:
        """Make ensemble prediction using multiple models"""
        predictions = []
        
        # XGBoost prediction
        if 'xgboost' in self.models:
            xgb_pred = self.models['xgboost'].predict(feature_vector)[0]
            predictions.append(xgb_pred)
        
        # Average predictions
        if predictions:
            ensemble_pred = np.mean(predictions)
            return float(np.clip(ensemble_pred, 0, 1))
        
        return 0.06  # Default fallback
    
    def _categorize_risk(self, damage_rate: float) -> str:
        """Categorize damage rate into risk levels"""
        if damage_rate < 0.05:
            return "Low"
        elif damage_rate < 0.10:
            return "Medium"
        elif damage_rate < 0.15:
            return "High"
        else:
            return "Critical"
    
    def _get_feature_importance(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Get top contributing features"""
        # Simplified feature importance
        importance = {}
        
        if features['loading_ratio'] > 1.0:
            importance['Overloading'] = 0.35
        
        if features['dealer_historical_damage_rate'] > 0.08:
            importance['Dealer Risk'] = 0.28
        
        if features['warehouse_damage_rate'] > 0.07:
            importance['Warehouse Risk'] = 0.20
        
        importance['Vehicle Type'] = 0.15
        
        # Normalize
        total = sum(importance.values())
        if total > 0:
            importance = {k: v/total for k, v in importance.items()}
        
        return importance
    
    def _generate_recommendations(self, predicted_damage_rate: float, 
                                  features: Dict[str, Any], 
                                  shipment_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Overloading recommendations
        if features['loading_ratio'] > 1.5:
            recommendations.append({
                'priority': 'CRITICAL',
                'category': 'Loading',
                'message': f"Severe overloading detected! Current: {features['loading_ratio']:.1%} of capacity. Reduce load by at least {(features['loading_ratio']-1)*100:.0f}%",
                'impact': 'High risk of damage - Expected loss: ₹{:.0f}'.format(
                    features['shipment_value'] * 0.25
                )
            })
        elif features['loading_ratio'] > 1.2:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Loading',
                'message': f"Significant overloading. Reduce load by {(features['loading_ratio']-1)*100:.0f}%",
                'impact': 'Moderate damage risk'
            })
        elif features['loading_ratio'] > 1.0:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Loading',
                'message': f"Vehicle overloaded. Consider reducing load by {(features['loading_ratio']-1)*100:.0f}%",
                'impact': 'Increased damage probability'
            })
        else:
            recommendations.append({
                'priority': 'LOW',
                'category': 'Loading',
                'message': 'Loading within safe limits',
                'impact': 'Normal damage rate expected'
            })
        
        # Vehicle recommendations
        vehicle = shipment_data['vehicle']
        shipped = shipment_data['shipped']
        
        if vehicle == 'Autorickshaw' and shipped > 10:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Vehicle',
                'message': 'Consider using Vikram or Minitruck for this shipment size',
                'impact': 'Better load distribution, reduced damage'
            })
        elif vehicle == 'Vikram' and shipped > 30:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Vehicle',
                'message': 'Consider using Minitruck for this shipment size',
                'impact': 'Safer transport for large quantities'
            })
        
        # Dealer risk recommendations
        if features['dealer_historical_damage_rate'] > 0.12:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Dealer',
                'message': 'High-risk dealer. Use extra protective packaging',
                'impact': 'Reduce damage by 20-30%'
            })
        elif features['dealer_historical_damage_rate'] > 0.08:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Dealer',
                'message': 'Medium-risk dealer. Apply careful handling procedures',
                'impact': 'Maintain lower damage rates'
            })
        
        # Warehouse recommendations
        if features['warehouse_damage_rate'] > 0.08:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Warehouse',
                'message': 'High-risk warehouse. Review loading and dispatch procedures',
                'impact': 'Process improvement needed'
            })
        
        # High predicted damage recommendations
        if predicted_damage_rate >= 0.10:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Packaging',
                'message': 'Use additional protective packaging and cushioning',
                'impact': 'Reduce breakage risk'
            })
            
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Scheduling',
                'message': 'Schedule delivery during off-peak hours',
                'impact': 'More careful handling, less rush'
            })
            
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Labeling',
                'message': "Add 'FRAGILE - HANDLE WITH CARE' labels prominently",
                'impact': 'Increased handler awareness'
            })
        
        # Monsoon season recommendations
        if features.get('is_monsoon', 0) == 1:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Weather',
                'message': 'Monsoon season: Use waterproof covering',
                'impact': 'Protect from weather damage'
            })
        
        # If no specific issues
        if predicted_damage_rate < 0.05 and features['loading_ratio'] <= 1.0:
            recommendations.append({
                'priority': 'LOW',
                'category': 'General',
                'message': 'Shipment appears safe. Proceed with standard procedures',
                'impact': 'Low risk of damage'
            })
        
        return recommendations
    
    def _calculate_confidence(self, features: Dict[str, Any]) -> float:
        """Calculate prediction confidence score"""
        confidence = 0.85  # Base confidence
        
        # Reduce confidence for edge cases
        if features['loading_ratio'] > 2.0:
            confidence -= 0.15
        
        if features['dealer_total_shipments'] < 10:
            confidence -= 0.10
        
        return max(0.5, min(1.0, confidence))
    
    def _get_dealer_risk_level(self, damage_rate: float) -> str:
        """Get dealer risk level description"""
        if damage_rate < 0.05:
            return "Low Risk"
        elif damage_rate < 0.08:
            return "Medium Risk"
        elif damage_rate < 0.12:
            return "High Risk"
        else:
            return "Critical Risk"
    
    def _get_warehouse_risk_level(self, damage_rate: float) -> str:
        """Get warehouse risk level description"""
        if damage_rate < 0.05:
            return "Excellent"
        elif damage_rate < 0.07:
            return "Good"
        elif damage_rate < 0.09:
            return "Fair"
        else:
            return "Poor"
    
    def batch_predict(self, shipments: List[Dict[str, Any]], 
                     model_name: str = "xgboost") -> Dict[str, Any]:
        """
        Make predictions for multiple shipments
        
        Parameters:
        -----------
        shipments : list
            List of shipment data dictionaries
        model_name : str
            Model to use
        
        Returns:
        --------
        dict : Batch prediction results with summary
        """
        batch_id = f"batch_{uuid.uuid4().hex[:16]}"
        predictions = []
        
        for shipment in shipments:
            try:
                pred = self.predict(shipment, model_name)
                predictions.append(pred)
            except Exception as e:
                logger.error(f"Error in batch prediction: {str(e)}")
                # Add error result
                predictions.append({
                    'error': str(e),
                    'shipment_data': shipment
                })
        
        # Calculate summary
        successful_preds = [p for p in predictions if 'error' not in p]
        
        summary = {
            'total_shipments': len(shipments),
            'successful_predictions': len(successful_preds),
            'failed_predictions': len(predictions) - len(successful_preds),
            'average_damage_rate': np.mean([p['predicted_damage_rate'] for p in successful_preds]) if successful_preds else 0,
            'risk_distribution': {
                'Low': sum(1 for p in successful_preds if p['risk_category'] == 'Low'),
                'Medium': sum(1 for p in successful_preds if p['risk_category'] == 'Medium'),
                'High': sum(1 for p in successful_preds if p['risk_category'] == 'High'),
                'Critical': sum(1 for p in successful_preds if p['risk_category'] == 'Critical')
            },
            'total_estimated_loss': sum(p['estimated_loss'] for p in successful_preds),
            'high_risk_shipments': sum(1 for p in successful_preds if p['risk_category'] in ['High', 'Critical'])
        }
        
        return {
            'batch_id': batch_id,
            'total_shipments': len(shipments),
            'predictions': predictions,
            'summary': summary
        }
