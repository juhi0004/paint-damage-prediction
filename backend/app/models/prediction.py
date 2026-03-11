from pydantic import BaseModel, Field
from typing import List, Literal
from datetime import datetime

class PredictionRequest(BaseModel):
    date: str = Field(..., description="ISO format datetime")
    dealer_code: int = Field(..., ge=1, le=100, description="Dealer code between 1-100")
    warehouse: Literal["NAG", "MUM", "GOA", "KOL", "PUN"]
    product_code: str = Field(..., min_length=9, max_length=9, description="9-digit product code")
    vehicle: Literal["Autorickshaw", "Vikram", "Minitruck"]
    shipped: int = Field(..., gt=0, description="Number of tins shipped")
    model: str = "xgboost"

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2026-03-11T10:00:00Z",
                "dealer_code": 17,
                "warehouse": "NAG",
                "product_code": "321123678",
                "vehicle": "Minitruck",
                "shipped": 25,
                "model": "xgboost"
            }
        }

class Recommendation(BaseModel):
    priority: str
    category: str
    message: str
    impact: str

class PredictionResponse(BaseModel):
    predicted_damage_rate: float
    predicted_returned: int
    estimated_loss: float
    risk_category: str
    confidence_score: float
    loading_ratio: float
    is_overloaded: bool
    recommendations: List[Recommendation]
    dealer_historical_risk: str
    warehouse_historical_risk: str
    model_version: str
    prediction_timestamp: str

    class Config:
        json_schema_extra = {
            "example": {
                "predicted_damage_rate": 0.0342,
                "predicted_returned": 1,
                "estimated_loss": 500.0,
                "risk_category": "Low",
                "confidence_score": 0.945,
                "loading_ratio": 0.833,
                "is_overloaded": False,
                "recommendations": [
                    {
                        "priority": "LOW",
                        "category": "Loading",
                        "message": "Loading within safe limits",
                        "impact": "Normal damage rate expected"
                    }
                ],
                "dealer_historical_risk": "Medium",
                "warehouse_historical_risk": "Medium",
                "model_version": "xgboost_v2.1",
                "prediction_timestamp": "2026-03-11T10:00:00Z"
            }
        }
