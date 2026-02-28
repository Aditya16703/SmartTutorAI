
import sys
import os
import requests
from src.services.supabase_service import supabase_service

def debug_trigger():
    print("Fetching profiles...")
    # Fetch all profiles
    response = supabase_service.client.table("student_profile").select("*").execute()
    
    if not response.data:
        print("No profiles found.")
        return

    # Use first user
    user = response.data[0]
    user_id = user['user_id']
    language = user.get('language', 'unknown')
    
    print(f"Found user: {user_id}, Language: {language}")
    
    # Trigger regeneration if backend is running
    print(f"Triggering regeneration for user {user_id}...")
    try:
        res = requests.post(
            "http://127.0.0.1:7007/api/workflows/regenerate-all",
            json={"user_id": user_id}
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Error triggering: {e}")

if __name__ == "__main__":
    debug_trigger()
