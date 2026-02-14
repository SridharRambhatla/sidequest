"""
Test the backend API endpoint with a sample request.
"""
import requests
import json

def test_api():
    """Test the /api/generate-itinerary endpoint."""
    
    url = "http://localhost:8000/api/generate-itinerary"
    
    payload = {
        "query": "I want a solo date idea involving art or crafts, maybe something messy like pottery.",
        "city": "Bangalore",
        "budget_min": 1000,
        "budget_max": 2500,
        "num_people": 1,
        "solo_preference": True,
        "interest_pods": ["art", "craft"],
        "crowd_preference": "relatively_niche",
        "social_media_urls": [],
        "start_date": None,
        "end_date": None
    }
    
    print("\n" + "="*60)
    print("🧪 TESTING API ENDPOINT")
    print("="*60)
    print(f"\nURL: {url}")
    print("\nPayload:")
    print(json.dumps(payload, indent=2))
    print("\n" + "="*60)
    print("📡 Sending request...")
    print("="*60 + "\n")
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS!")
            print("\n📊 Response Summary:")
            print(f"  - Experiences found: {len(result.get('experiences', []))}")
            print(f"  - Narrative length: {len(result.get('narrative_itinerary', ''))} chars")
            print(f"  - Session ID: {result.get('session_id', 'N/A')}")
            
            print("\n🎯 Experiences:")
            for idx, exp in enumerate(result.get('experiences', []), 1):
                print(f"  {idx}. {exp.get('name', 'Unnamed')} ({exp.get('category', 'N/A')})")
            
            print("\n" + "="*60)
            print("✅ API TEST COMPLETED SUCCESSFULLY")
            print("="*60)
            return True
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server is not running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_api()
