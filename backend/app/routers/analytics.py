"""
API routes for analytics and insights
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Optional
from datetime import datetime
import logging

from app.models.analytics import (
    AnalyticsSummary, DealerRiskProfile, WarehouseAnalytics,
    TrendAnalysis, TopProblems
)
from app.services.analytics_service import AnalyticsService
from app.core.dependencies import get_analytics_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary, status_code=status.HTTP_200_OK)
async def get_analytics_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get overall analytics summary
    
    Returns aggregate statistics including total shipments, damage rates,
    financial losses, and risk distribution.
    """
    try:
        summary = await analytics_service.get_summary_statistics(start_date, end_date)
        return AnalyticsSummary(**summary)
    except Exception as e:
        logger.error(f"Error getting analytics summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/dealers", response_model=list[DealerRiskProfile], status_code=status.HTTP_200_OK)
async def get_dealer_analytics(
    limit: int = Query(20, ge=1, le=100),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get dealer-wise risk profiles
    
    Returns top dealers sorted by total loss with risk categorization.
    """
    try:
        dealers = await analytics_service.get_dealer_analytics(limit)
        return [DealerRiskProfile(**d) for d in dealers]
    except Exception as e:
        logger.error(f"Error getting dealer analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/warehouses", response_model=list[WarehouseAnalytics], status_code=status.HTTP_200_OK)
async def get_warehouse_analytics(
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get warehouse-wise analytics
    
    Returns performance metrics for all warehouses.
    """
    try:
        warehouses = await analytics_service.get_warehouse_analytics()
        return [WarehouseAnalytics(**w) for w in warehouses]
    except Exception as e:
        logger.error(f"Error getting warehouse analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/trends", response_model=TrendAnalysis, status_code=status.HTTP_200_OK)
async def get_trend_analysis(
    metric: str = Query("damage_rate", regex="^(damage_rate|loss_value)$"),
    period: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    days: int = Query(30, ge=7, le=365),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get trend analysis over time
    
    Analyzes trends for specified metric over given time period.
    """
    try:
        trend = await analytics_service.get_trend_analysis(metric, period, days)
        return TrendAnalysis(**trend)
    except Exception as e:
        logger.error(f"Error getting trend analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/problems", response_model=TopProblems, status_code=status.HTTP_200_OK)
async def get_top_problems(
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get top problem areas (Pareto analysis)
    
    Returns the vital few factors causing most damage:
    - Top 20 high-risk dealers
    - Problematic warehouses
    - Worst warehouse-vehicle combinations
    """
    try:
        problems = await analytics_service.get_top_problems()
        return TopProblems(**problems)
    except Exception as e:
        logger.error(f"Error getting top problems: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/dashboard", status_code=status.HTTP_200_OK)
async def get_dashboard_data(
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get comprehensive dashboard data
    
    Returns all key metrics in one call for dashboard visualization.
    """
    try:
        # Get all analytics in parallel
        summary = await analytics_service.get_summary_statistics()
        dealers = await analytics_service.get_dealer_analytics(limit=10)
        warehouses = await analytics_service.get_warehouse_analytics()
        trend = await analytics_service.get_trend_analysis('damage_rate', 'daily', 30)
        problems = await analytics_service.get_top_problems()
        
        return {
            'summary': summary,
            'top_dealers': dealers[:10],
            'warehouses': warehouses,
            'damage_rate_trend': trend,
            'top_problems': problems
        }
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
