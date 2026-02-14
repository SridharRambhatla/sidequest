"""
Test script to verify interest_pods filtering works correctly.
"""

import json
from agents.discovery_agent import run_discovery_agent

def test_with_interest_pods(description, query, interest_pods):
    """Test discovery agent with specific interest pods."""
    print("\n" + "="*80)
    print(f"TEST: {description}")
    print(f"Interest Pods: {interest_pods}")
    print("="*80)
    
    test_state = {
        "user_query": query,
        "city": "Bangalore",
        "budget_range": (500, 2000),
        "interest_pods": interest_pods
    }
    
    result = run_discovery_agent(test_state)
    
    if "error" in result:
        print(f"❌ ERROR: {result['error']}")
        return None
    
    experiences = result.get('discovered_experiences', [])
    print(f"\n✅ Found {len(experiences)} experiences")
    
    # Group by category
    categories = {}
    for exp in experiences:
        cat = exp.get('category', 'unknown')
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(exp.get('name', 'Unnamed'))
    
    print("\nExperiences by category:")
    for cat, names in sorted(categories.items()):
        print(f"  {cat.upper()} ({len(names)}):")
        for name in names:
            print(f"    - {name}")
    
    return result

if __name__ == "__main__":
    print("\n" + "🧪 TESTING INTEREST PODS FILTERING" + "\n")
    
    # Test 1: Food interest pod only
    result1 = test_with_interest_pods(
        "Food & Drinks Interest Only",
        "Show me interesting experiences in Bangalore",
        ["food_nerd"]
    )
    
    # Test 2: Craft interest pod only
    result2 = test_with_interest_pods(
        "Crafts & Workshops Interest Only",
        "Show me interesting experiences in Bangalore",
        ["craft_explorer"]
    )
    
    # Test 3: Heritage interest pod only
    result3 = test_with_interest_pods(
        "Heritage & History Interest Only",
        "Show me interesting experiences in Bangalore",
        ["heritage_walker"]
    )
    
    # Test 4: Multiple interest pods
    result4 = test_with_interest_pods(
        "Multiple Interests (Food + Craft)",
        "Show me interesting experiences in Bangalore",
        ["food_nerd", "craft_explorer"]
    )
    
    # Test 5: No interest pods (should work like before)
    result5 = test_with_interest_pods(
        "No Interest Pods Specified",
        "Show me pottery workshops and food experiences",
        []
    )
    
    # Analysis
    print("\n" + "="*80)
    print("ANALYSIS")
    print("="*80)
    
    if result1 and result2:
        # Check if food query returned mostly food experiences
        food_categories = [exp['category'] for exp in result1.get('discovered_experiences', [])]
        food_count = food_categories.count('food')
        print(f"\n✓ Food interest pod test: {food_count}/{len(food_categories)} food experiences")
        
        # Check if craft query returned mostly craft experiences
        craft_categories = [exp['category'] for exp in result2.get('discovered_experiences', [])]
        craft_count = craft_categories.count('craft')
        print(f"✓ Craft interest pod test: {craft_count}/{len(craft_categories)} craft experiences")
        
        # Check for overlap (should be minimal)
        exp1_names = {exp['name'] for exp in result1.get('discovered_experiences', [])}
        exp2_names = {exp['name'] for exp in result2.get('discovered_experiences', [])}
        overlap = exp1_names.intersection(exp2_names)
        
        print(f"\n✓ Overlap between food and craft results: {len(overlap)} experiences")
        if len(overlap) == 0:
            print("  ✅ PASS: No overlap - interest pods are working correctly!")
        else:
            print(f"  ⚠️  WARNING: Found {len(overlap)} overlapping experiences")
            for name in overlap:
                print(f"    - {name}")
