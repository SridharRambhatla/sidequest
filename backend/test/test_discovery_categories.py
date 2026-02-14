"""
Test script to debug Discovery Agent category filtering issue.
Tests if different queries return appropriately different results.
"""

import json
from agents.discovery_agent import run_discovery_agent

def test_query(query_description, user_query):
    """Test a specific query and print results."""
    print("\n" + "="*80)
    print(f"TEST: {query_description}")
    print("="*80)
    
    test_state = {
        "user_query": user_query,
        "city": "Bangalore",
        "budget_range": (500, 2000)
    }
    
    result = run_discovery_agent(test_state)
    
    if "error" in result:
        print(f"❌ ERROR: {result['error']}")
        return
    
    experiences = result.get('discovered_experiences', [])
    print(f"\n✅ Found {len(experiences)} experiences")
    print("\nExperiences by category:")
    
    # Group by category
    categories = {}
    for exp in experiences:
        cat = exp.get('category', 'unknown')
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(exp.get('name', 'Unnamed'))
    
    for cat, names in categories.items():
        print(f"\n  {cat.upper()} ({len(names)}):")
        for name in names:
            print(f"    - {name}")
    
    return result

if __name__ == "__main__":
    # Test 1: Pottery/Craft query
    result1 = test_query(
        "Pottery and Craft Activities",
        "I want pottery workshops and craft activities for a solo traveler"
    )
    
    # Test 2: Food and Drinks query
    result2 = test_query(
        "Food and Drinks Experiences",
        "I want food and drinks experiences, cafes, restaurants, and culinary tours"
    )
    
    # Test 3: Heritage walks
    result3 = test_query(
        "Heritage Walks",
        "I want heritage walks and historical tours in old Bangalore"
    )
    
    # Compare results
    print("\n" + "="*80)
    print("COMPARISON ANALYSIS")
    print("="*80)
    
    if result1 and result2:
        exp1_names = {exp['name'] for exp in result1.get('discovered_experiences', [])}
        exp2_names = {exp['name'] for exp in result2.get('discovered_experiences', [])}
        
        overlap = exp1_names.intersection(exp2_names)
        
        print(f"\nQuery 1 experiences: {len(exp1_names)}")
        print(f"Query 2 experiences: {len(exp2_names)}")
        print(f"Overlapping experiences: {len(overlap)}")
        
        if overlap:
            print("\n⚠️  DUPLICATE EXPERIENCES FOUND:")
            for name in overlap:
                print(f"  - {name}")
        else:
            print("\n✅ No duplicate experiences - queries return different results")
