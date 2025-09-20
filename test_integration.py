#!/usr/bin/env python3
# Test script for the Water Quality ML Service

import requests
import json
import time

def test_ml_service():
    \"\"\"Test the ML service endpoints\"\"\"
    base_url = \"http://localhost:5001\"
    
    print(\"Testing Water Quality ML Service...\")
    
    # Test health endpoint
    try:
        response = requests.get(f\"{base_url}/health\", timeout=5)
        if response.status_code == 200:
            print(\"Health check passed\")
        else:
            print(f\"Health check failed: {response.status_code}\")
    except requests.exceptions.RequestException as e:
        print(f\"Health check error: {e}\")
        return False
    
    # Test prediction endpoint
    try:
        # Sample water quality data
        test_data = {
            \"features\": [
                7.2,    # pH
                180.0,  # Hardness
                20000,  # Solids
                7.0,    # Chloramines
                300.0,  # Sulfate
                400.0,  # Conductivity
                14.0,   # Organic Carbon
                70.0,   # Trihalomethanes
                3.5     # Turbidity
            ]
        }
        
        response = requests.post(
            f\"{base_url}/predict\", 
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(\"Prediction successful:\")
            print(f\"   Result: {result.get('result', 'N/A')}\")
            print(f\"   Prediction: {result.get('prediction', 'N/A')}\")
            print(f\"   Probability: {result.get('probability', 'N/A'):.3f}\")
            print(f\"   Confidence: {result.get('confidence', 'N/A'):.3f}\")
        else:
            print(f\"Prediction failed: {response.status_code}\")
            print(f\"   Response: {response.text}\")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f\"Prediction error: {e}\")
        return False
    
    return True

def test_backend_service():
    \"\"\"Test the backend service endpoints\"\"\"
    base_url = \"http://localhost:5000\"
    
    print(\"\nTesting Backend Service...\")
    
    # Test health endpoint
    try:
        response = requests.get(f\"{base_url}/health\", timeout=5)
        if response.status_code == 200:
            print(\"Backend health check passed\")
        else:
            print(f\"Backend health check failed: {response.status_code}\")
    except requests.exceptions.RequestException as e:
        print(f\"Backend health check error: {e}\")
        return False
    
    return True

def test_frontend_service():
    \"\"\"Test if frontend is accessible\"\"\"
    base_url = \"http://localhost:3000\"
    
    print(\"\nTesting Frontend Service...\")
    
    try:
        response = requests.get(base_url, timeout=10)
        if response.status_code == 200:
            print(\"Frontend is accessible\")
            return True
        else:
            print(f\"Frontend not accessible: {response.status_code}\")
            return False
    except requests.exceptions.RequestException as e:
        print(f\"Frontend connection error: {e}\")
        return False

if __name__ == \"__main__\":
    print(\"Water Quality System Integration Test\")
    print(\"======================================\")
    
    # Wait a moment for services to be ready
    print(\"Waiting for services to start...\")
    time.sleep(5)
    
    # Run tests
    ml_ok = test_ml_service()
    backend_ok = test_backend_service() 
    frontend_ok = test_frontend_service()
    
    # Summary
    print(\"\nTest Results:\")
    print(f\"   ML Service: {'PASS' if ml_ok else 'FAIL'}\")
    print(f\"   Backend:    {'PASS' if backend_ok else 'FAIL'}\")
    print(f\"   Frontend:   {'PASS' if frontend_ok else 'FAIL'}\")
    
    if ml_ok and backend_ok and frontend_ok:
        print(\"\nAll services are working correctly!\")
        print(\"   You can now access the application at: http://localhost:3000\")
    else:
        print(\"\nSome services have issues. Check the logs for details.\")
        print(\"   Try running: docker-compose logs [service-name]\")