"""
Script to test API endpoints
"""
import requests
import json
from datetime import datetime


BASE_URL = "http://localhost:8000/api/v1"


def test_health():
    """Test health check"""
    print("\n" + "="*60)
    print("Testing Health Check")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_prediction():
    """Test prediction endpoint"""
    print("\n" + "="*60)
    print("Testing Damage Prediction")
    print("="*60)
    
    # Sample shipment data
    shipment = {
        "date": datetime.now().isoformat(),
        "dealer_code": 17,
        "warehouse": "NAG",
        "product_code": "321123678",
        "vehicle": "Minitruck",
        "shipped": 25
    }
    
    print(f"Input: {json.dumps(shipment, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/predictions/predict",
        json=shipment
    )
    
    print(f"\nStatus: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nPrediction ID: {result['prediction_id']}")
        print(f"Predicted Damage Rate: {result['predicted_damage_rate']:.2%}")
        print(f"Risk Category: {result['risk_category']}")
        print(f"Estimated Loss: ₹{result['estimated_loss']:.2f}")
        print(f"Confidence: {result['confidence_score']:.2%}")
        
        print(f"\nRecommendations:")
        for rec in result['recommendations']:
            print(f"  [{rec['priority']}] {rec['category']}: {rec['message']}")
    else:
        print(f"Error: {response.text}")


def test_batch_prediction():
    """Test batch prediction"""
    print("\n" + "="*60)
    print("Testing Batch Prediction")
    print("="*60)
    
    shipments = {
        "shipments": [
            {
                "date": datetime.now().isoformat(),
                "dealer_code": 17,
                "warehouse": "NAG",
                "product_code": "321123678",
                "vehicle": "Minitruck",
                "shipped": 25
            },
            {
                "date": datetime.now().isoformat(),
                "dealer_code": 45,
                "warehouse": "MUM",
                "product_code": "111234567",
                "vehicle": "Vikram",
                "shipped": 30
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/predictions/predict/batch",
        json=shipments
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nBatch ID: {result['batch_id']}")
        print(f"Total Shipments: {result['total_shipments']}")
        print(f"\nSummary:")
        print(f"  Average Damage Rate: {result['summary']['average_damage_rate']:.2%}")
        print(f"  Total Estimated Loss: ₹{result['summary']['total_estimated_loss']:.2f}")
        print(f"  High Risk Shipments: {result['summary']['high_risk_shipments']}")
        print(f"\nRisk Distribution:")
        for risk, count in result['summary']['risk_distribution'].items():
            print(f"  {risk}: {count}")
    else:
        print(f"Error: {response.text}")


def test_models():
    """Test available models endpoint"""
    print("\n" + "="*60)
    print("Testing Available Models")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/predictions/models")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


if __name__ == "__main__":
    print("="*60)
    print("API ENDPOINT TESTING")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print("Make sure the API server is running (python -m app.main)")
    print("="*60)
    
    try:
        test_health()
        test_models()
        test_prediction()
        test_batch_prediction()
        
        print("\n" + "="*60)
        print("✓ ALL TESTS COMPLETED")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Could not connect to API server")
        print("Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
