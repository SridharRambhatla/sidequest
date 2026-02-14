"""
Simple test to check if the API is working after the interest_pods fix.
"""

import requests
import json

def test_api():
    url = "http://localhost:8000/api/generate-itinerary"
    
    payload = {
        "query": "I want food and drinks experiences",
        "city": "Bangalore",
        "budget_min": 500,
        "budget_max": 2000,
        "num_people": 1,
        "solo_preference": True,
        "interest_pods": ["food_nerd"],
        "crowd_preference": "relatively_niche",
        "social_media_urls": []
    }
    
    print("🧪 Testing API with interest_pods...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("\n" + "="*80)
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS!")
            print(f"Session ID: {result.get('session_id')}")
            print(f"Experiences found: {len(result.get('experiences', []))}")
            print(f"Narrative length: {len(result.get('narrative_itinerary', ''))}")
            
            # Show experiences
            print("\nExperiences:")
            for exp in result.get('experiences', []):
                print(f"  - {exp.get('name')} ({exp.get('category')})")
            
            # Show agent trace
            print("\nAgent Trace:")
            for trace in result.get('agent_trace', []):
                print(f"  {trace.get('agent')}: {trace.get('status')}")
        else:
            print(f"\n❌ ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 60 seconds")
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection error: {e}")
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_api()
