"""
Feature engineering service
Replicates the feature engineering from notebooks for production use
"""
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """
    Feature engineering for paint damage prediction
    Transforms raw shipment data into model-ready features
    """
    
    # Constants from analysis
    PRICE_MATRIX = {
        'Cheap': {
            123: 20, 234: 40, 345: 70, 456: 150, 567: 250,
            678: 350, 765: 500, 789: 600, 890: 700, 987: 1000
        },
        'Mid-range': {
            123: 30, 234: 60, 345: 100, 456: 220, 567: 400,
            678: 700, 765: 1000, 789: 1300, 890: 1500, 987: 2000
        },
        'Expensive': {
            123: 40, 234: 80, 345: 140, 456: 250, 567: 500,
            678: 800, 765: 1000, 789: 1200, 890: 1400, 987: 1800
        }
    }
    
    VEHICLE_CAPACITY = {
        'Autorickshaw': 13,
        'Vikram': 22,
        'Minitruck': 40
    }
    
    def __init__(self, historical_stats: Optional[Dict] = None):
        """
        Initialize feature engineer
        
        Parameters:
        -----------
        historical_stats : dict, optional
            Pre-computed historical statistics (dealer profiles, warehouse stats, etc.)
        """
        self.historical_stats = historical_stats or {}
        logger.info("FeatureEngineer initialized")
    
    def parse_product_code(self, product_code: str) -> Dict[str, int]:
        """
        Parse 9-digit product code into components
        
        Returns:
        --------
        dict : paint_type, color, tin_size
        """
        product_str = str(product_code).zfill(9)
        
        return {
            'paint_type': int(product_str[:3]),
            'color': int(product_str[3:6]),
            'tin_size': int(product_str[6:9])
        }
    
    def categorize_paint_type(self, paint_type: int) -> str:
        """Categorize paint type into price segment"""
        cheap_types = [111, 112, 121, 123]
        mid_types = [213, 222, 232]
        expensive_types = [321, 333, 343]
        
        if paint_type in cheap_types:
            return 'Cheap'
        elif paint_type in mid_types:
            return 'Mid-range'
        elif paint_type in expensive_types:
            return 'Expensive'
        else:
            # Default to mid-range for unknown types
            return 'Mid-range'
    
    def get_tin_price(self, paint_category: str, tin_size: int) -> float:
        """Get price per tin"""
        if paint_category not in self.PRICE_MATRIX:
            paint_category = 'Mid-range'
        
        size_price_map = self.PRICE_MATRIX[paint_category]
        
        # Find closest tin size
        if tin_size in size_price_map:
            return size_price_map[tin_size]
        
        available_sizes = sorted(size_price_map.keys())
        closest_size = min(available_sizes, key=lambda x: abs(x - tin_size))
        
        return size_price_map[closest_size]
    
    def get_vehicle_capacity(self, vehicle: str) -> int:
        """Get vehicle capacity"""
        vehicle_normalized = vehicle.strip().title()
        return self.VEHICLE_CAPACITY.get(vehicle_normalized, 22)  # Default to Vikram
    
    def calculate_loading_metrics(self, shipped: int, vehicle: str) -> Dict[str, Any]:
        """Calculate loading-related metrics"""
        capacity = self.get_vehicle_capacity(vehicle)
        loading_ratio = shipped / capacity if capacity > 0 else 1.0
        overloaded = loading_ratio > 1.0
        overload_amount = max(0, shipped - capacity)
        
        return {
            'vehicle_capacity': capacity,
            'loading_ratio': loading_ratio,
            'overloaded': 1 if overloaded else 0,
            'overload_amount': overload_amount,
            'is_extreme_loading': 1 if loading_ratio > 1.5 else 0
        }
    
    def extract_time_features(self, date: datetime) -> Dict[str, Any]:
        """Extract time-based features"""
        return {
            'year': date.year,
            'month': date.month,
            'day': date.day,
            'day_of_week': date.weekday(),
            'week_of_year': date.isocalendar()[1],
            'is_weekend': 1 if date.weekday() >= 5 else 0,
            'is_month_start': 1 if date.day <= 5 else 0,
            'is_month_end': 1 if date.day >= 25 else 0,
            'is_monsoon': 1 if date.month in [6, 7, 8, 9] else 0,
            # Cyclical encoding
            'month_sin': np.sin(2 * np.pi * date.month / 12),
            'month_cos': np.cos(2 * np.pi * date.month / 12),
            'day_of_week_sin': np.sin(2 * np.pi * date.weekday() / 7),
            'day_of_week_cos': np.cos(2 * np.pi * date.weekday() / 7)
        }
    
    def get_dealer_features(self, dealer_code: int) -> Dict[str, Any]:
        """Get historical dealer features"""
        if 'dealer_profiles' in self.historical_stats:
            dealer_profile = self.historical_stats['dealer_profiles'].get(
                dealer_code, 
                {}
            )
            return {
                'dealer_historical_damage_rate': dealer_profile.get('damage_rate', 0.06),
                'dealer_overload_frequency': dealer_profile.get('overload_freq', 0.20),
                'dealer_total_shipments': dealer_profile.get('total_shipments', 100),
                'dealer_risk_category_encoded': self._encode_risk_category(
                    dealer_profile.get('risk_category', 'Medium')
                )
            }
        
        # Default values if no historical data
        return {
            'dealer_historical_damage_rate': 0.06,
            'dealer_overload_frequency': 0.20,
            'dealer_total_shipments': 100,
            'dealer_risk_category_encoded': 1  # Medium
        }
    
    def get_warehouse_features(self, warehouse: str) -> Dict[str, Any]:
        """Get historical warehouse features"""
        if 'warehouse_profiles' in self.historical_stats:
            warehouse_profile = self.historical_stats['warehouse_profiles'].get(
                warehouse,
                {}
            )
            return {
                'warehouse_damage_rate': warehouse_profile.get('damage_rate', 0.06),
                'warehouse_overload_pct': warehouse_profile.get('overload_pct', 0.20)
            }
        
        # Default values
        return {
            'warehouse_damage_rate': 0.06,
            'warehouse_overload_pct': 0.20
        }
    
    def _encode_risk_category(self, risk_category: str) -> int:
        """Encode risk category as integer"""
        mapping = {'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3}
        return mapping.get(risk_category, 1)
    
    def _encode_vehicle(self, vehicle: str) -> int:
        """Encode vehicle type"""
        mapping = {'Autorickshaw': 0, 'Vikram': 1, 'Minitruck': 2}
        return mapping.get(vehicle, 1)
    
    def _encode_warehouse(self, warehouse: str) -> int:
        """Encode warehouse"""
        mapping = {'NAG': 0, 'MUM': 1, 'GOA': 2, 'KOL': 3, 'PUN': 4}
        return mapping.get(warehouse, 0)
    
    def _encode_paint_category(self, category: str) -> int:
        """Encode paint category"""
        mapping = {'Cheap': 0, 'Mid-range': 1, 'Expensive': 2}
        return mapping.get(category, 1)
    
    def engineer_features(self, shipment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Engineer all features for a shipment
        
        Parameters:
        -----------
        shipment_data : dict
            Raw shipment data with keys: date, dealer_code, warehouse, 
            product_code, vehicle, shipped
        
        Returns:
        --------
        dict : Engineered features ready for model
        """
        try:
            features = {}
            
            # Parse product code
            product_parsed = self.parse_product_code(shipment_data['product_code'])
            features.update(product_parsed)
            
            # Paint category and pricing
            paint_category = self.categorize_paint_type(product_parsed['paint_type'])
            features['paint_category'] = paint_category
            
            price_per_tin = self.get_tin_price(paint_category, product_parsed['tin_size'])
            features['price_per_tin'] = price_per_tin
            
            # Financial metrics
            features['shipment_value'] = shipment_data['shipped'] * price_per_tin
            
            # Loading metrics
            loading_metrics = self.calculate_loading_metrics(
                shipment_data['shipped'],
                shipment_data['vehicle']
            )
            features.update(loading_metrics)
            
            # Time features
            time_features = self.extract_time_features(shipment_data['date'])
            features.update(time_features)
            
            # Dealer features
            dealer_features = self.get_dealer_features(shipment_data['dealer_code'])
            features.update(dealer_features)
            
            # Warehouse features
            warehouse_features = self.get_warehouse_features(shipment_data['warehouse'])
            features.update(warehouse_features)
            
            # Interaction features
            features['dealer_warehouse_risk'] = (
                features['dealer_historical_damage_rate'] * 
                features['warehouse_damage_rate']
            )
            
            features['vehicle_loading_risk'] = (
                features['loading_ratio'] * 
                features['dealer_historical_damage_rate']
            )
            
            # Product value index
            avg_price = 500  # Approximate average
            avg_tin_size = 500
            features['product_value_index'] = (
                (price_per_tin / avg_price) * 
                (product_parsed['tin_size'] / avg_tin_size)
            )
            
            # Tin size category
            if product_parsed['tin_size'] <= 300:
                tin_size_cat = 'Small'
            elif product_parsed['tin_size'] <= 600:
                tin_size_cat = 'Medium'
            else:
                tin_size_cat = 'Large'
            
            # Encoded categorical features
            features['vehicle_encoded'] = self._encode_vehicle(shipment_data['vehicle'])
            features['warehouse_encoded'] = self._encode_warehouse(shipment_data['warehouse'])
            features['paint_category_encoded'] = self._encode_paint_category(paint_category)
            features['tin_size_category_encoded'] = {'Small': 0, 'Medium': 1, 'Large': 2}[tin_size_cat]
            
            # Shipped quantity
            features['shipped'] = shipment_data['shipped']
            
            # Dealer code
            features['dealer_code'] = shipment_data['dealer_code']
            
            logger.debug(f"Engineered {len(features)} features for shipment")
            
            return features
            
        except Exception as e:
            logger.error(f"Error engineering features: {str(e)}")
            raise
