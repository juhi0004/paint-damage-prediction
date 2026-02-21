"""
Script to create historical profiles for production use
Run this once after training models to create dealer/warehouse profiles
"""
import pandas as pd
import joblib
from pathlib import Path


def create_profiles():
    """Create historical profiles from training data"""
    
    print("Creating historical profiles for production...")
    
    # Load training data
    df = pd.read_csv('../outputs/engineered_features_dataset.csv', parse_dates=['Date'])
    
    # Dealer profiles
    print("\nCreating dealer profiles...")
    dealer_profiles = {}
    
    for dealer_code in df['Dealer_Code'].unique():
        dealer_data = df[df['Dealer_Code'] == dealer_code]
        
        profile = {
            'damage_rate': dealer_data['Damage_Rate'].mean(),
            'overload_freq': (dealer_data['Overloaded'].sum() / len(dealer_data)),
            'total_shipments': len(dealer_data),
            'avg_shipment_size': dealer_data['Shipped'].mean(),
            'total_loss': dealer_data['Loss_Value'].sum()
        }
        
        # Risk category
        if profile['damage_rate'] < 0.05:
            profile['risk_category'] = 'Low'
        elif profile['damage_rate'] < 0.10:
            profile['risk_category'] = 'Medium'
        elif profile['damage_rate'] < 0.15:
            profile['risk_category'] = 'High'
        else:
            profile['risk_category'] = 'Critical'
        
        dealer_profiles[dealer_code] = profile
    
    # Warehouse profiles
    print("Creating warehouse profiles...")
    warehouse_profiles = {}
    
    for warehouse in df['Warehouse'].unique():
        warehouse_data = df[df['Warehouse'] == warehouse]
        
        profile = {
            'damage_rate': warehouse_data['Damage_Rate'].mean(),
            'overload_pct': (warehouse_data['Overloaded'].sum() / len(warehouse_data)),
            'total_shipments': len(warehouse_data),
            'total_loss': warehouse_data['Loss_Value'].sum()
        }
        
        warehouse_profiles[warehouse] = profile
    
    # Save profiles
    models_dir = Path('../models')
    models_dir.mkdir(exist_ok=True)
    
    dealer_path = models_dir / 'dealer_profiles.pkl'
    warehouse_path = models_dir / 'warehouse_profiles.pkl'
    
    joblib.dump(dealer_profiles, dealer_path)
    joblib.dump(warehouse_profiles, warehouse_path)
    
    print(f"\n✓ Dealer profiles saved: {dealer_path}")
    print(f"✓ Warehouse profiles saved: {warehouse_path}")
    print(f"\nTotal dealers: {len(dealer_profiles)}")
    print(f"Total warehouses: {len(warehouse_profiles)}")
    
    # Display summary
    print("\n" + "="*60)
    print("DEALER RISK DISTRIBUTION")
    print("="*60)
    risk_dist = pd.Series([p['risk_category'] for p in dealer_profiles.values()]).value_counts()
    print(risk_dist)
    
    print("\n" + "="*60)
    print("WAREHOUSE SUMMARY")
    print("="*60)
    for warehouse, profile in warehouse_profiles.items():
        print(f"{warehouse}: Damage Rate = {profile['damage_rate']:.2%}, Shipments = {profile['total_shipments']:,}")
    
    print("\n✓ Historical profiles created successfully!")


if __name__ == "__main__":
    create_profiles()
