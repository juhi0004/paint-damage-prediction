"""
API routes for shipment management
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from datetime import datetime
import logging

from app.models.shipment import (
    ShipmentCreate, ShipmentUpdate, ShipmentResponse
)
from app.core.dependencies import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shipments", tags=["shipments"])


@router.post("/", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_shipment(
    shipment: ShipmentCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new shipment record"""
    try:
        shipment_dict = shipment.dict()
        shipment_dict['created_at'] = datetime.now()
        shipment_dict['updated_at'] = datetime.now()
        
        # Calculate damage rate if returned is provided
        if shipment_dict.get('returned') is not None:
            shipment_dict['damage_rate'] = shipment_dict['returned'] / shipment_dict['shipped']
        
        result = await db.shipments.insert_one(shipment_dict)
        
        created_shipment = await db.shipments.find_one({'_id': result.inserted_id})
        created_shipment['_id'] = str(created_shipment['_id'])
        
        return ShipmentResponse(**created_shipment)
        
    except Exception as e:
        logger.error(f"Error creating shipment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/", response_model=List[ShipmentResponse], status_code=status.HTTP_200_OK)
async def get_shipments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    dealer_code: Optional[int] = None,
    warehouse: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get list of shipments with optional filters"""
    try:
        query = {}
        
        if dealer_code:
            query['dealer_code'] = dealer_code
        if warehouse:
            query['warehouse'] = warehouse
        if start_date or end_date:
            query['date'] = {}
            if start_date:
                query['date']['$gte'] = start_date
            if end_date:
                query['date']['$lte'] = end_date
        
        cursor = db.shipments.find(query).skip(skip).limit(limit)
        shipments = await cursor.to_list(length=limit)
        
        for shipment in shipments:
            shipment['_id'] = str(shipment['_id'])
        
        return [ShipmentResponse(**s) for s in shipments]
        
    except Exception as e:
        logger.error(f"Error getting shipments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{shipment_id}", response_model=ShipmentResponse, status_code=status.HTTP_200_OK)
async def get_shipment(
    shipment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a single shipment by ID"""
    try:
        shipment = await db.shipments.find_one({'_id': ObjectId(shipment_id)})
        
        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shipment {shipment_id} not found"
            )
        
        shipment['_id'] = str(shipment['_id'])
        return ShipmentResponse(**shipment)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting shipment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.patch("/{shipment_id}", response_model=ShipmentResponse, status_code=status.HTTP_200_OK)
async def update_shipment(
    shipment_id: str,
    update: ShipmentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update shipment after delivery (set returned count)"""
    try:
        # Find shipment
        shipment = await db.shipments.find_one({'_id': ObjectId(shipment_id)})
        
        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shipment {shipment_id} not found"
            )
        
        # Update
        update_dict = update.dict(exclude_unset=True)
        update_dict['updated_at'] = datetime.now()
        
        # Recalculate damage rate
        if 'returned' in update_dict:
            update_dict['damage_rate'] = update_dict['returned'] / shipment['shipped']
        
        await db.shipments.update_one(
            {'_id': ObjectId(shipment_id)},
            {'$set': update_dict}
        )
        
        updated_shipment = await db.shipments.find_one({'_id': ObjectId(shipment_id)})
        updated_shipment['_id'] = str(updated_shipment['_id'])
        
        return ShipmentResponse(**updated_shipment)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating shipment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{shipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shipment(
    shipment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a shipment"""
    try:
        result = await db.shipments.delete_one({'_id': ObjectId(shipment_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shipment {shipment_id} not found"
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting shipment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
