#!/usr/bin/env python3
"""
Test script to verify transaction creation with the new API format
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/jwt/create/"
TRANSACTION_URL = f"{BASE_URL}/api/v1/transactions/create/"

def test_transaction_creation():
    """Test creating a transaction with the new format"""
    
    # Login to get access token
    login_data = {
        "username": "admin",  # Replace with actual admin username
        "password": "admin"   # Replace with actual admin password
    }
    
    print("Logging in...")
    response = requests.post(LOGIN_URL, data=login_data)
    
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return
    
    token_data = response.json()
    access_token = token_data["access_token"]
    
    print("Login successful!")
    
    # Test transaction data
    transaction_data = {
        "type": "lecture",
        "description": "Test lecture transaction",
        "recipients": [
            {
                "username": "student1",
                "bucks": 5,
                "lec": 1
            },
            {
                "username": "student2", 
                "bucks": 3,
                "lec": 1
            }
        ]
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("Creating transaction...")
    print(f"Transaction data: {json.dumps(transaction_data, indent=2)}")
    
    response = requests.post(TRANSACTION_URL, json=transaction_data, headers=headers)
    
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    if response.status_code == 200:
        print("Transaction created successfully!")
    else:
        print("Transaction creation failed!")

if __name__ == "__main__":
    test_transaction_creation() 