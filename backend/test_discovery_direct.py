"""
Direct test of discovery agent with interest_pods
"""

from agents.discovery_agent import run_discovery_agent

test_state = {
    "user_query": "I want food and drinks experiences",
    "city": "Bangalore",
    "budget_range": (500, 2000),
    "interest_pods": ["food_nerd"]
}

print("Testing Discovery Agent directly...")
result = run_discovery_agent(test_state)

print(f"\nResult: {result.keys()}")
print(f"Experiences: {len(result.get('discovered_experiences', []))}")

for exp in result.get('discovered_experiences', []):
    print(f"  - {exp['name']} ({exp['category']})")
