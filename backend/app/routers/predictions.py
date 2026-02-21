"""
API routes for damage predictions
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
import logging

from app.models.prediction import (
    PredictionRequest, PredictionResponse,
    BatchPredictionRequest, BatchPredictionResponse
)
from app.services.prediction_service import PredictionService
from app.core.dependencies import get_prediction_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_damage(
    request: PredictionRequest,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """
    Predict damage rate for a single shipment
    
    Returns damage rate prediction, risk category, and actionable recommendations.
    """
    try:
        # Convert request to dict
        shipment_data = {
            'date': request.date,
            'dealer_code': request.dealer_code,
            'warehouse': request.warehouse,
            'product_code': request.product_code,
            'vehicle': request.vehicle,
            'shipped': request.shipped
        }
        model_name = request.model if request.model else "xgboost"
        
        # Make prediction
        result = prediction_service.predict(shipment_data, model_name="xgboost")
        
        # Format response
        response = PredictionResponse(
            prediction_id=result['prediction_id'],
            timestamp=result['timestamp'],
            input=request,
            predicted_damage_rate=result['predicted_damage_rate'],
            predicted_returned=result['predicted_returned'],
            risk_category=result['risk_category'],
            confidence_score=result['confidence_score'],
            estimated_loss=result['estimated_loss'],
            model_name=result['model_name'],
            feature_importance=result['feature_importance'],
            recommendations=result['recommendations'],
            dealer_historical_risk=result.get('dealer_historical_risk'),
            warehouse_historical_risk=result.get('warehouse_historical_risk'),
            is_overloaded=result['is_overloaded'],
            loading_ratio=result.get('loading_ratio')
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error in predict endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/predict/batch", response_model=BatchPredictionResponse, status_code=status.HTTP_200_OK)
async def predict_batch(
    request: BatchPredictionRequest,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """
    Predict damage rate for multiple shipments in batch
    
    Maximum 100 shipments per request.
    """
    try:
        # Convert requests to list of dicts
        shipments = []
        for req in request.shipments:
            shipments.append({
                'date': req.date,
                'dealer_code': req.dealer_code,
                'warehouse': req.warehouse,
                'product_code': req.product_code,
                'vehicle': req.vehicle,
                'shipped': req.shipped
            })
        
        # Make batch predictions
        result = prediction_service.batch_predict(shipments, model_name="xgboost")
        
        # Format response
        predictions = []
        for pred in result['predictions']:
            if 'error' not in pred:
                predictions.append(PredictionResponse(**pred, input=request.shipments[len(predictions)]))
        
        response = BatchPredictionResponse(
            batch_id=result['batch_id'],
            total_shipments=result['total_shipments'],
            predictions=predictions,
            summary=result['summary']
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error in batch predict endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )


@router.get("/models", status_code=status.HTTP_200_OK)
async def get_available_models(
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get list of available prediction models"""
    try:
        models = list(prediction_service.models.keys())
        return {
            'available_models': models,
            'default_model': 'xgboost',
            'total_features': len(prediction_service.feature_list) if prediction_service.feature_list else 0
        }
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
