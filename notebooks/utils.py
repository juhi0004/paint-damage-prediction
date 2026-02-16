"""
Utility functions for data loading and preprocessing
"""
import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')


def load_shipment_data(filepath, file_type='csv'):
    """
    Load shipment data from CSV or Excel file
    """
    try:
        if file_type == 'csv':
            df = pd.read_csv(filepath)
        elif file_type == 'excel':
            df = pd.read_excel(filepath)
        else:
            raise ValueError("file_type must be 'csv' or 'excel'")
        
        print(f"✓ Data loaded successfully: {df.shape[0]} rows, {df.shape[1]} columns")
        return df
    
    except Exception as e:
        print(f"✗ Error loading data: {str(e)}")
        raise


def standardize_column_names(df):
    """
    Standardize column names to expected format
    """
    column_mapping = {
        'date': 'Date',
        'dealer code': 'Dealer_Code',
        'dealer': 'Dealer_Code',
        'dealer_code': 'Dealer_Code',
        'dealercode': 'Dealer_Code',
        'warehouse': 'Warehouse',
        'product code': 'Product_Code',
        'product': 'Product_Code',
        'product_code': 'Product_Code',
        'productcode': 'Product_Code',
        'vehicle': 'Vehicle',
        'shipped': 'Shipped',
        'quantity': 'Shipped',
        'returned': 'Returned',
        'damaged': 'Returned',
        'damage': 'Returned'
    }
    
    df.columns = df.columns.str.lower().str.strip()
    df = df.rename(columns=column_mapping)
    
    required_columns = [
        'Date', 'Dealer_Code', 'Warehouse',
        'Product_Code', 'Vehicle', 'Shipped', 'Returned'
    ]
    
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        print(f"⚠ Warning: Missing columns: {missing_columns}")
        print(f"Available columns: {df.columns.tolist()}")
    else:
        print("✓ All required columns present")
    
    return df


def parse_dates(df, date_column='Date'):
    """
    Parse date column to datetime format
    Handle multiple date formats (SAFE)
    """
    try:
        # Convert to string to avoid dtype issues
        df[date_column] = df[date_column].astype(str)

        # Use pandas mixed-format parser (fixes 13/1/07 issue)
        df[date_column] = pd.to_datetime(
            df[date_column],
            format="mixed",
            dayfirst=True,
            errors="coerce"
        )

        nat_count = df[date_column].isna().sum()
        if nat_count > 0:
            print(f"⚠ Warning: {nat_count} invalid date(s) converted to NaT")

        print("✓ Dates parsed successfully using mixed format")

        return df

    except Exception as e:
        print(f"✗ Error parsing dates: {str(e)}")
        raise


def get_data_summary(df):
    """
    Generate comprehensive data summary
    """
    print("\n" + "="*80)
    print("DATA SUMMARY")
    print("="*80)
    
    print(f"\nDataset Shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
    
    print(f"\nDate Range: {df['Date'].min().strftime('%Y-%m-%d')} to {df['Date'].max().strftime('%Y-%m-%d')}")
    print(f"Duration: {(df['Date'].max() - df['Date'].min()).days} days")
    
    print(f"\nUnique Values:")
    print(f"  - Dealers: {df['Dealer_Code'].nunique()}")
    print(f"  - Warehouses: {df['Warehouse'].nunique()}")
    print(f"  - Products: {df['Product_Code'].nunique()}")
    print(f"  - Vehicles: {df['Vehicle'].nunique()}")
    
    print(f"\nShipment Statistics:")
    print(f"  - Total Shipments: {len(df):,}")
    print(f"  - Total Tins Shipped: {df['Shipped'].sum():,}")
    print(f"  - Total Tins Returned: {df['Returned'].sum():,}")
    print(f"  - Overall Damage Rate: {(df['Returned'].sum() / df['Shipped'].sum() * 100):.2f}%")
    
    print(f"\nMissing Values:")
    missing = df.isnull().sum()
    if missing.sum() == 0:
        print("  ✓ No missing values")
    else:
        print(missing[missing > 0])
    
    print("\n" + "="*80 + "\n")
