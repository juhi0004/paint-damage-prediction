"""
Pydantic models for analytics endpoints
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class AnalyticsSummary(BaseModel):
    """Overall analytics summary"""
    total_shipments: int
    total_tins_shipped: int
    total_tins_returned: int
    average_damage_rate: float
    total_estimated_loss: float
    high_risk_shipments: int
    critical_risk_shipments: int
    date_range: Dict[str, datetime]


class DealerRiskProfile(BaseModel):
    """Dealer risk profile"""
    dealer_code: int
    dealer_name: Optional[str] = None
    total_shipments: int
    average_damage_rate: float
    total_loss: float
    risk_category: str
    trend: Optional[str] = None  # "improving", "stable", "deteriorating"


class WarehouseAnalytics(BaseModel):
    """Warehouse analytics"""
    warehouse: str
    total_shipments: int
    average_damage_rate: float
    total_loss: float
    most_common_vehicle: str
    overload_frequency: float


class VehicleAnalytics(BaseModel):
    """Vehicle analytics"""
    vehicle_type: str
    total_shipments: int
    average_damage_rate: float
    average_loading_ratio: float
    overload_percentage: float


class TrendDataPoint(BaseModel):
    """Single data point in trend"""
    date: datetime
    value: float
    shipments: int


class TrendAnalysis(BaseModel):
    """Trend analysis over time"""
    metric: str
    period: str  # "daily", "weekly", "monthly"
    data_points: List[TrendDataPoint]
    trend_direction: str  # "increasing", "decreasing", "stable"
    change_percentage: float


class TopProblems(BaseModel):
    """Top problem areas identified"""
    top_dealers: List[DealerRiskProfile] = Field(default_factory=list, max_length=20)
    top_warehouses: List[WarehouseAnalytics] = Field(default_factory=list, max_length=10)
    worst_combinations: List[Dict[str, any]] = Field(default_factory=list, max_length=10)


class AnalyticsFilters(BaseModel):
    """Filters for analytics queries"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    dealer_codes: Optional[List[int]] = None
    warehouses: Optional[List[str]] = None
    vehicles: Optional[List[str]] = None
    risk_categories: Optional[List[str]] = None
