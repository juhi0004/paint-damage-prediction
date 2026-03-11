from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime

from app.models.prediction import PredictionRequest, PredictionResponse
from app.services.prediction_service import prediction_service
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/predictions", response_model=PredictionResponse, tags=["predictions"])
async def create_prediction(
    request: PredictionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate damage prediction for a shipment
    
    - **date**: ISO format datetime of shipment
    - **dealer_code**: Dealer identifier (1-100)
    - **warehouse**: Origin warehouse
    - **product_code**: 9-digit product identifier
    - **vehicle**: Type of transport vehicle
    - **shipped**: Number of paint tins shipped
    
    Returns detailed prediction including damage rate, risk level, and recommendations.
    """
    try:
        # Convert request to dict
        request_data = request.model_dump()
        
        # Get prediction from ML service
        prediction = prediction_service.predict(request_data)
        
        # Return response
        return PredictionResponse(**prediction)
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.get("/predictions/health", tags=["predictions"])
async def prediction_health():
    """Check prediction service health"""
    return {
        "status": "healthy",
        "model_version": "xgboost_v2.1",
        "service": "prediction_service",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/predictions/model-info", tags=["predictions"])
async def model_info():
    """Get information about the prediction model"""
    return {
        "model_type": "XGBoost Regressor",
        "version": "2.1",
        "features": [
            "dealer_code",
            "warehouse",
            "product_code",
            "vehicle_type",
            "shipped_quantity",
            "temporal_features"
        ],
        "accuracy_metrics": {
            "r2_score": 0.94,
            "mae": 0.023,
            "rmse": 0.031
        },
        "training_data_size": 10000,
        "last_updated": "2026-03-01"
    }
