#!/usr/bin/env python3
"""
Test script to directly test the admin API endpoints
"""

import requests
import json
import sys
import pprint

# API URLs
API_BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
ADMIN_USERS_URL = f"{API_BASE_URL}/admin/users"

def login_admin():
    """Login as admin user and get authentication token"""
    # Credentials as Form data - FastAPI's OAuth2PasswordRequestForm expects this format
    form_data = {
        "username": "8050518293",
        "password": "password123"
    }
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    # Try to log in
    print("Attempting login...")
    try:
        # Try form data approach (which FastAPI's OAuth2PasswordRequestForm expects)
        response = requests.post(LOGIN_URL, data=form_data, headers=headers)
        
        print(f"Login status code: {response.status_code}")
        print(f"Response headers: {response.headers}")
        
        if response.status_code != 200:
            print(f"Failed to login: {response.status_code}")
            print(f"Response text: {response.text}")
            return None
        
        # Extract token from response
        token_data = response.json()
        print("Login response:")
        pprint.pprint(token_data)
        
        access_token = token_data.get("access_token")
        if not access_token:
            print("No access token found in response")
            return None
            
        print(f"Successfully logged in. Token: {access_token[:15]}...")
        return access_token
        
    except Exception as e:
        print(f"Login exception: {str(e)}")
        return None

def test_admin_users_endpoint(token):
    """Test the admin/users endpoint"""
    if not token:
        print("No authentication token available")
        return
    
    # Set authorization header
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Try GET method, which should work for listing users
    try:
        print(f"\nTesting GET on {ADMIN_USERS_URL}")
        print(f"Headers: {headers}")
        response = requests.get(ADMIN_USERS_URL, headers=headers)
        status = response.status_code
        print(f"Status: {status}")
        print(f"Response headers: {response.headers}")
        
        try:
            response_text = response.text
            print(f"Response text: {response_text}")
            
            if status != 404 and response_text:
                try:
                    json_data = response.json()
                    print("JSON response:")
                    pprint.pprint(json_data)
                except:
                    print("Not a valid JSON response")
        except:
            print("Could not get response text")
    except Exception as e:
        print(f"Error: {str(e)}")

def main():
    # Login to get authentication token
    token = login_admin()
    if not token:
        print("Login failed, exiting.")
        sys.exit(1)
    
    # Test admin/users endpoint
    test_admin_users_endpoint(token)

if __name__ == "__main__":
    main() 