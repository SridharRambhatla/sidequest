"""
Sidequest Backend — Interactive Test Runner

Run agent tests with custom queries from the command line.
"""

import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from test.test_agents_mock import run_mock_workflow


def print_menu():
    """Display test menu."""
    print("\n" + "="*60)
    print("  SIDEQUEST AGENT TEST RUNNER")
    print("="*60)
    print("\n1. Run mock test with default query")
    print("2. Run mock test with custom query")
    print("3. Exit")
    print()


def get_custom_query():
    """Get custom query from user."""
    print("\n" + "─"*60)
    print("Enter your custom test parameters:")
    print("─"*60 + "\n")
    
    query = input("Query (e.g., 'pottery workshop and coffee'): ").strip()
    if not query:
        query = "Solo-friendly pottery workshop and artisan coffee experiences"
    
    city = input("City (default: Bangalore): ").strip() or "Bangalore"
    
    try:
        budget_min = int(input("Min budget in ₹ (default: 500): ").strip() or "500")
        budget_max = int(input("Max budget in ₹ (default: 3000): ").strip() or "3000")
    except ValueError:
        budget_min, budget_max = 500, 3000
    
    return {
        "query": query,
        "city": city,
        "budget_min": budget_min,
        "budget_max": budget_max,
    }


async def run_custom_test(params):
    """Run test with custom parameters."""
    # Import here to avoid circular imports
    from state.schemas import AgentState
    from datetime import datetime
    from test.test_agents_mock import (
        mock_discovery_agent,
        mock_cultural_context_agent,
        mock_community_agent,
        mock_plot_builder_agent,
        mock_budget_agent,
        create_sources_directory,
        save_discovery_results,
    )
    
    print("\n" + "="*60)
    print("  RUNNING CUSTOM TEST")
    print("="*60 + "\n")
    
    # Create initial state with custom params
    state = AgentState(
        user_query=f"{params['query']} in {params['city']}",
        social_media_urls=[],
        city=params['city'],
        budget_range=(params['budget_min'], params['budget_max']),
        num_people=1,
        solo_preference=True,
        interest_pods=["craft_explorer", "food_nerd"],
        crowd_preference="relatively_niche",
        start_date="",
        end_date="",
        discovered_experiences=[],
        cultural_context={},
        narrative_itinerary="",
        budget_breakdown={},
        social_scaffolding={},
        collision_suggestion={},
        agent_trace=[],
        errors=[],
        session_id="custom_" + datetime.now().strftime("%Y%m%d%H%M%S"),
    )
    
    print("📝 Test Query:", state["user_query"])
    print(f"📍 City: {state['city']}")
    print(f"💵 Budget: ₹{state['budget_range'][0]} - ₹{state['budget_range'][1]}\n")
    
    # Create sources directory
    sources_dir = create_sources_directory()
    
    # Run agents
    state = await mock_discovery_agent(state)
    
    # Run cultural context and community in parallel
    results = await asyncio.gather(
        mock_cultural_context_agent(state.copy()),
        mock_community_agent(state.copy())
    )
    state["cultural_context"] = results[0]["cultural_context"]
    state["social_scaffolding"] = results[1]["social_scaffolding"]
    state["agent_trace"].extend(results[0]["agent_trace"][-1:])
    state["agent_trace"].extend(results[1]["agent_trace"][-1:])
    
    state = await mock_plot_builder_agent(state)
    state = await mock_budget_agent(state)
    
    # Save discovery results
    save_discovery_results(state["discovered_experiences"], state["session_id"], sources_dir)
    
    # Print summary
    print("\n" + "="*60)
    print("  RESULTS SUMMARY")
    print("="*60 + "\n")
    
    print(f"✅ Test completed")
    print(f"   Experiences found: {len(state['discovered_experiences'])}")
    print(f"   Total budget: ₹{state['budget_breakdown']['total_estimate']}")
    print(f"   Within budget: {'✅' if state['budget_breakdown']['within_budget'] else '❌'}")
    print(f"   Session ID: {state['session_id']}")
    print()


async def main():
    """Main interactive loop."""
    while True:
        print_menu()
        choice = input("Select option (1-3): ").strip()
        
        if choice == "1":
            print("\n🚀 Running default mock test...\n")
            await run_mock_workflow()
            input("\nPress Enter to continue...")
            
        elif choice == "2":
            params = get_custom_query()
            await run_custom_test(params)
            input("\nPress Enter to continue...")
            
        elif choice == "3":
            print("\n👋 Goodbye!\n")
            break
            
        else:
            print("\n❌ Invalid option. Please select 1-3.\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted. Goodbye!\n")
