"""
Quick test script to verify discovery agent is working with enhanced logging.
"""
import sys
import json
from agents.discovery_agent import run_discovery_agent

def test_discovery():
    """Test the discovery agent with a sample query."""
    print("\n" + "="*60)
    print("🧪 TESTING DISCOVERY AGENT")
    print("="*60 + "\n")
    
    # Sample test state
    test_state = {
        "user_query": "I want a solo date idea involving art or crafts, maybe something messy like pottery.",
        "city": "Bangalore",
        "budget_range": "1000-2500"
    }
    
    print("📝 Test Input:")
    print(json.dumps(test_state, indent=2))
    print("\n")
    
    # Run the agent
    result = run_discovery_agent(test_state)
    
    # Display results
    print("\n" + "="*60)
    print("📊 RESULTS")
    print("="*60)
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        return False
    
    experiences = result.get("discovered_experiences", [])
    print(f"\n✅ Found {len(experiences)} experiences\n")
    
    for idx, exp in enumerate(experiences, 1):
        print(f"{idx}. {exp.get('name', 'Unnamed')}")
        print(f"   Category: {exp.get('category', 'N/A')}")
        print(f"   Location: {exp.get('location', 'N/A')}")
        print(f"   Budget: ₹{exp.get('budget', 0)}")
        print(f"   Solo Friendly: {exp.get('solo_friendly', False)}")
        print(f"   Description: {exp.get('description', 'N/A')[:100]}...")
        print()
    
    print("="*60)
    print("✅ TEST COMPLETED SUCCESSFULLY")
    print("="*60)
    return True

if __name__ == "__main__":
    try:
        success = test_discovery()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
