"""
Analytics service for historical data analysis
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Service for analytics and historical data analysis
    """
    
    def __init__(self, db_client):
        """
        Initialize analytics service
        
        Parameters:
        -----------
        db_client : MongoDB client
            Database client for querying historical data
        """
        self.db = db_client
        logger.info("AnalyticsService initialized")
    
    async def get_summary_statistics(self, 
                                     start_date: Optional[datetime] = None,
                                     end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Get overall summary statistics"""
        try:
            # Build query
            query = {}
            if start_date or end_date:
                query['date'] = {}
                if start_date:
                    query['date']['$gte'] = start_date
                if end_date:
                    query['date']['$lte'] = end_date
            
            # Get shipments from database
            shipments = await self.db.shipments.find(query).to_list(length=None)
            
            if not shipments:
                return self._empty_summary()
            
            # Convert to DataFrame for analysis
            df = pd.DataFrame(shipments)
            
            # Calculate statistics
            total_shipments = len(df)
            total_shipped = df['shipped'].sum()
            total_returned = df['returned'].sum() if 'returned' in df.columns else 0
            avg_damage_rate = (total_returned / total_shipped) if total_shipped > 0 else 0
            
            # Estimated loss
            total_loss = 0
            if 'loss_value' in df.columns:
                total_loss = df['loss_value'].sum()
            
            # Risk categories
            high_risk = 0
            critical_risk = 0
            if 'damage_rate' in df.columns:
                high_risk = len(df[df['damage_rate'] >= 0.10])
                critical_risk = len(df[df['damage_rate'] >= 0.15])
            
            summary = {
                'total_shipments': int(total_shipments),
                'total_tins_shipped': int(total_shipped),
                'total_tins_returned': int(total_returned),
                'average_damage_rate': float(avg_damage_rate),
                'total_estimated_loss': float(total_loss),
                'high_risk_shipments': int(high_risk),
                'critical_risk_shipments': int(critical_risk),
                'date_range': {
                    'start': df['date'].min(),
                    'end': df['date'].max()
                }
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting summary statistics: {str(e)}")
            return self._empty_summary()
    
    async def get_dealer_analytics(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get dealer-wise analytics"""
        try:
            # Aggregate dealer statistics
            pipeline = [
                {
                    '$group': {
                        '_id': '$dealer_code',
                        'total_shipments': {'$sum': 1},
                        'total_shipped': {'$sum': '$shipped'},
                        'total_returned': {'$sum': '$returned'},
                        'total_loss': {'$sum': '$loss_value'}
                    }
                },
                {
                    '$addFields': {
                        'average_damage_rate': {
                            '$divide': ['$total_returned', '$total_shipped']
                        }
                    }
                },
                {'$sort': {'total_loss': -1}},
                {'$limit': limit}
            ]
            
            results = await self.db.shipments.aggregate(pipeline).to_list(length=None)
            
            # Format results
            dealer_analytics = []
            for result in results:
                risk_category = self._categorize_risk(result['average_damage_rate'])
                
                dealer_analytics.append({
                    'dealer_code': result['_id'],
                    'total_shipments': result['total_shipments'],
                    'average_damage_rate': result['average_damage_rate'],
                    'total_loss': result['total_loss'],
                    'risk_category': risk_category
                })
            
            return dealer_analytics
            
        except Exception as e:
            logger.error(f"Error getting dealer analytics: {str(e)}")
            return []
    
    async def get_warehouse_analytics(self) -> List[Dict[str, Any]]:
        """Get warehouse-wise analytics"""
        try:
            pipeline = [
                {
                    '$group': {
                        '_id': '$warehouse',
                        'total_shipments': {'$sum': 1},
                        'total_shipped': {'$sum': '$shipped'},
                        'total_returned': {'$sum': '$returned'},
                        'total_loss': {'$sum': '$loss_value'}
                    }
                },
                {
                    '$addFields': {
                        'average_damage_rate': {
                            '$divide': ['$total_returned', '$total_shipped']
                        }
                    }
                },
                {'$sort': {'average_damage_rate': -1}}
            ]
            
            results = await self.db.shipments.aggregate(pipeline).to_list(length=None)
            
            warehouse_analytics = []
            for result in results:
                warehouse_analytics.append({
                    'warehouse': result['_id'],
                    'total_shipments': result['total_shipments'],
                    'average_damage_rate': result['average_damage_rate'],
                    'total_loss': result['total_loss']
                })
            
            return warehouse_analytics
            
        except Exception as e:
            logger.error(f"Error getting warehouse analytics: {str(e)}")
            return []
    
    async def get_trend_analysis(self, 
                                 metric: str = 'damage_rate',
                                 period: str = 'daily',
                                 days: int = 30) -> Dict[str, Any]:
        """Get trend analysis over time"""
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Get shipments
            query = {'date': {'$gte': start_date, '$lte': end_date}}
            shipments = await self.db.shipments.find(query).to_list(length=None)
            
            if not shipments:
                return {'metric': metric, 'period': period, 'data_points': []}
            
            df = pd.DataFrame(shipments)
            df['date'] = pd.to_datetime(df['date'])
            
            # Group by period
            if period == 'daily':
                df['period'] = df['date'].dt.date
            elif period == 'weekly':
                df['period'] = df['date'].dt.to_period('W').dt.start_time
            elif period == 'monthly':
                df['period'] = df['date'].dt.to_period('M').dt.start_time
            
            # Calculate metric
            if metric == 'damage_rate':
                grouped = df.groupby('period').agg({
                    'returned': 'sum',
                    'shipped': 'sum'
                })
                grouped['value'] = grouped['returned'] / grouped['shipped']
                grouped['shipments'] = df.groupby('period').size()
            
            # Format data points
            data_points = []
            for idx, row in grouped.iterrows():
                data_points.append({
                    'date': idx,
                    'value': float(row['value']),
                    'shipments': int(row['shipments'])
                })
            
            # Calculate trend
            if len(data_points) >= 2:
                first_val = data_points[0]['value']
                last_val = data_points[-1]['value']
                change_pct = ((last_val - first_val) / first_val * 100) if first_val > 0 else 0
                
                if change_pct > 5:
                    trend_direction = 'increasing'
                elif change_pct < -5:
                    trend_direction = 'decreasing'
                else:
                    trend_direction = 'stable'
            else:
                change_pct = 0
                trend_direction = 'insufficient_data'
            
            return {
                'metric': metric,
                'period': period,
                'data_points': data_points,
                'trend_direction': trend_direction,
                'change_percentage': float(change_pct)
            }
            
        except Exception as e:
            logger.error(f"Error getting trend analysis: {str(e)}")
            return {'metric': metric, 'period': period, 'data_points': []}
    
    async def get_top_problems(self) -> Dict[str, Any]:
        """Get top problem areas (Pareto analysis)"""
        try:
            # Top dealers by loss
            top_dealers = await self.get_dealer_analytics(limit=20)
            
            # Top warehouses
            top_warehouses = await self.get_warehouse_analytics()
            
            # Worst combinations (warehouse-vehicle)
            pipeline = [
                {
                    '$group': {
                        '_id': {
                            'warehouse': '$warehouse',
                            'vehicle': '$vehicle'
                        },
                        'total_shipments': {'$sum': 1},
                        'total_loss': {'$sum': '$loss_value'},
                        'total_returned': {'$sum': '$returned'},
                        'total_shipped': {'$sum': '$shipped'}
                    }
                },
                {
                    '$addFields': {
                        'damage_rate': {
                            '$divide': ['$total_returned', '$total_shipped']
                        }
                    }
                },
                {'$sort': {'total_loss': -1}},
                {'$limit': 10}
            ]
            
            combinations = await self.db.shipments.aggregate(pipeline).to_list(length=None)
            
            worst_combinations = []
            for comb in combinations:
                worst_combinations.append({
                    'warehouse': comb['_id']['warehouse'],
                    'vehicle': comb['_id']['vehicle'],
                    'total_shipments': comb['total_shipments'],
                    'damage_rate': comb['damage_rate'],
                    'total_loss': comb['total_loss']
                })
            
            return {
                'top_dealers': top_dealers,
                'top_warehouses': top_warehouses,
                'worst_combinations': worst_combinations
            }
            
        except Exception as e:
            logger.error(f"Error getting top problems: {str(e)}")
            return {
                'top_dealers': [],
                'top_warehouses': [],
                'worst_combinations': []
            }
    
    def _categorize_risk(self, damage_rate: float) -> str:
        """Categorize risk level"""
        if damage_rate < 0.05:
            return "Low"
        elif damage_rate < 0.10:
            return "Medium"
        elif damage_rate < 0.15:
            return "High"
        else:
            return "Critical"
    
    def _empty_summary(self) -> Dict[str, Any]:
        """Return empty summary structure"""
        return {
            'total_shipments': 0,
            'total_tins_shipped': 0,
            'total_tins_returned': 0,
            'average_damage_rate': 0.0,
            'total_estimated_loss': 0.0,
            'high_risk_shipments': 0,
            'critical_risk_shipments': 0,
            'date_range': {'start': None, 'end': None}
        }
