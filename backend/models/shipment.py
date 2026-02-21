"""
Pydantic models for shipment data
"""
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional
from enum import Enum


class VehicleType(str, Enum):
    """Vehicle type enum"""
    AUTORICKSHAW = "Autorickshaw"
    VIKRAM = "Vikram"
    MINITRUCK = "Minitruck"


class Warehouse(str, Enum):
    """Warehouse enum"""
    NAG = "NAG"
    MUM = "MUM"
    GOA = "GOA"
    KOL = "KOL"
    PUN = "PUN"


class ShipmentBase(BaseModel):
    """Base shipment model"""
    date: datetime
    dealer_code: int = Field(..., ge=1, le=100, description="Dealer code (1-100)")
    warehouse: Warehouse
    product_code: str = Field(..., min_length=9, max_length=9, description="9-digit product code")
    vehicle: VehicleType
    shipped: int = Field(..., ge=1, description="Number of tins shipped (must be positive)")
    returned: Optional[int] = Field(None, ge=0, description="Number of tins returned")

    @validator('product_code')
    def validate_product_code(cls, v):
        """Validate product code is 9 digits"""
        if not v.isdigit():
            raise ValueError('Product code must contain only digits')
        if len(v) != 9:
            raise ValueError('Product code must be exactly 9 digits')
        return v

    @validator('returned')
    def validate_returned(cls, v, values):
        """Validate returned is not greater than shipped"""
        if v is not None and 'shipped' in values and v > values['shipped']:
            raise ValueError('Returned tins cannot exceed shipped tins')
        return v


class ShipmentCreate(ShipmentBase):
    """Model for creating a new shipment"""
    pass


class ShipmentUpdate(BaseModel):
    """Model for updating shipment (after delivery)"""
    returned: int = Field(..., ge=0, description="Number of tins returned")


class ShipmentResponse(ShipmentBase):
    """Model for shipment response"""
    id: str = Field(..., alias="_id")
    damage_rate: Optional[float] = None
    loss_value: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "date": "2007-01-15T00:00:00",
                "dealer_code": 17,
                "warehouse": "NAG",
                "product_code": "321123678",
                "vehicle": "Minitruck",
                "shipped": 25,
                "returned": 2,
                "damage_rate": 0.08,
                "loss_value": 1600.0,
                "created_at": "2026-02-17T09:00:00",
                "updated_at": "2026-02-17T09:00:00"
            }
        }
