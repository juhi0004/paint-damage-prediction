"""
Pydantic models for damage prediction
"""
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum


class RiskCategory(str, Enum):
    """Risk category enum"""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class PredictionRequest(BaseModel):
    """Request model for damage prediction"""
    date: datetime = Field(default_factory=datetime.now, description="Shipment date")
    dealer_code: int = Field(..., ge=1, le=100)
    warehouse: str = Field(..., min_length=3, max_length=3)
    product_code: str = Field(..., min_length=9, max_length=9)
    vehicle: str = Field(..., description="Vehicle type: Autorickshaw, Vikram, or Minitruck")
    shipped: int = Field(..., ge=1, description="Number of tins to ship")

    @validator('product_code')
    def validate_product_code(cls, v):
        if not v.isdigit():
            raise ValueError('Product code must contain only digits')
        return v

    @validator('warehouse')
    def validate_warehouse(cls, v):
        v = v.upper()
        if v not in ['NAG', 'MUM', 'GOA', 'KOL', 'PUN']:
            raise ValueError('Invalid warehouse code')
        return v

    @validator('vehicle')
    def validate_vehicle(cls, v):
        v = v.title()
        if v not in ['Autorickshaw', 'Vikram', 'Minitruck']:
            raise ValueError('Invalid vehicle type')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2026-02-17T10:00:00",
                "dealer_code": 17,
                "warehouse": "NAG",
                "product_code": "321123678",
                "vehicle": "Minitruck",
                "shipped": 25
            }
        }


class RecommendationItem(BaseModel):
    """Single recommendation"""
    priority: str = Field(..., description="Priority level: CRITICAL, HIGH, MEDIUM, LOW")
    category: str = Field(..., description="Category: Loading, Vehicle, Dealer, Packaging, etc.")
    message: str = Field(..., description="Recommendation message")
    impact: str = Field(..., description="Expected impact")


class PredictionResponse(BaseModel):
    """Response model for damage prediction"""
    prediction_id: str = Field(..., description="Unique prediction ID")
    timestamp: datetime = Field(default_factory=datetime.now)
    
    # Input echo
    input: PredictionRequest
    
    # Predictions
    predicted_damage_rate: float = Field(..., ge=0, le=1, description="Predicted damage rate (0-1)")
    predicted_returned: int = Field(..., ge=0, description="Predicted number of tins returned")
    risk_category: RiskCategory = Field(..., description="Risk category")
    confidence_score: float = Field(..., ge=0, le=1, description="Model confidence (0-1)")
    
    # Financial impact
    estimated_loss: float = Field(..., ge=0, description="Estimated financial loss in INR")
    
    # Model insights
    model_used: str = Field(..., description="Model used for prediction")
    feature_importance: Dict[str, float] = Field(default_factory=dict, description="Top contributing factors")
    
    # Recommendations
    recommendations: List[RecommendationItem] = Field(default_factory=list)
    
    # Additional context
    dealer_historical_risk: Optional[str] = None
    warehouse_historical_risk: Optional[str] = None
    is_overloaded: bool = Field(default=False)
    loading_ratio: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "prediction_id": "pred_507f1f77bcf86cd799439011",
                "timestamp": "2026-02-17T10:05:00",
                "input": {
                    "date": "2026-02-17T10:00:00",
                    "dealer_code": 17,
                    "warehouse": "NAG",
                    "product_code": "321123678",
                    "vehicle": "Minitruck",
                    "shipped": 25
                },
                "predicted_damage_rate": 0.085,
                "predicted_returned": 2,
                "risk_category": "Medium",
                "confidence_score": 0.87,
                "estimated_loss": 1600.0,
                "model_used": "XGBoost Ensemble",
                "feature_importance": {
                    "loading_ratio": 0.35,
                    "dealer_historical_damage": 0.28,
                    "vehicle_type": 0.15
                },
                "recommendations": [
                    {
                        "priority": "MEDIUM",
                        "category": "Loading",
                        "message": "Loading within safe limits",
                        "impact": "Maintains normal damage rate"
                    }
                ],
                "is_overloaded": False,
                "loading_ratio": 0.625
            }
        }


class BatchPredictionRequest(BaseModel):
    """Request for batch predictions"""
    shipments: List[PredictionRequest] = Field(..., max_length=100, description="Max 100 shipments per batch")

    @validator('shipments')
    def validate_batch_size(cls, v):
        if len(v) > 100:
            raise ValueError('Maximum 100 shipments per batch request')
        if len(v) == 0:
            raise ValueError('At least one shipment required')
        return v


class BatchPredictionResponse(BaseModel):
    """Response for batch predictions"""
    batch_id: str
    total_shipments: int
    predictions: List[PredictionResponse]
    summary: Dict[str, any] = Field(default_factory=dict)
