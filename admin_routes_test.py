#!/usr/bin/env python3
"""
Test script to check if admin routes are properly registered
"""

import sys
import requests
from pprint import pprint

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_api_routes():
    """Test all the API routes to see what's registered"""
    response = requests.get(f"{BASE_URL}/openapi.json")
    if response.status_code != 200:
        print(f"Failed to get API schema: {response.status_code}")
        return
    
    schema = response.json()
    print("Available paths in the API:")
    for path, methods in schema['paths'].items():
        print(f"- {path}")
        for method, details in methods.items():
            print(f"  - {method.upper()}: {details.get('summary', 'No summary')}")
    
    print("\nSearching for admin routes:")
    admin_found = False
    for path in schema['paths']:
        if 'admin' in path:
            admin_found = True
            print(f"Found admin route: {path}")
    
    if not admin_found:
        print("No admin routes found in the API schema!")

if __name__ == "__main__":
    test_api_routes() 