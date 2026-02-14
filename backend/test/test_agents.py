"""
Sidequest Backend — Agent Testing CLI

Run agents from command line with detailed output and data dumping for validation.
Discovery agent results are saved to sources/ directory.
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path

from state.schemas import ItineraryRequest
from agents.coordinator import run_workflow


def create_sources_directory():
    """Create sources/ directory if it doesn't exist."""
    sources_dir = Path("sources")
    sources_dir.mkdir(exist_ok=True)
    return sources_dir


def save_discovery_results(experiences: list, session_id: str, sources_dir: Path):
    """Save discovery agent results to sources/ directory."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"discovery_{session_id[:8]}_{timestamp}.json"
    filepath = sources_dir / filename
    
    data = {
        "session_id": session_id,
        "timestamp": datetime.now().isoformat(),
        "experiences_count": len(experiences),
        "experiences": experiences
    }
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n📁 Discovery results saved to: {filepath}")
    return filepath


def print_separator(title: str = ""):
    """Print a visual separator."""
    if title:
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}\n")
    else:
        print(f"{'─'*60}\n")


def print_experiences(experiences: list):
    """Pretty print discovered experiences."""
    print(f"\n🔍 Discovered {len(experiences)} experiences:\n")
    
    for i, exp in enumerate(experiences, 1):
        print(f"{i}. {exp.get('name', 'Unnamed')}")
        print(f"   Category: {exp.get('category', 'N/A')}")
        print(f"   Location: {exp.get('location', 'N/A')}")
        print(f"   Budget: ₹{exp.get('budget', 0)}")
        print(f"   Solo Friendly: {'✓' if exp.get('solo_friendly') else '✗'}")
        print(f"   Source: {exp.get('source', 'N/A')}")
        print(f"   Description: {exp.get('description', 'N/A')[:100]}...")
        print()


def print_agent_trace(trace: list):
    """Pretty print agent execution trace."""
    print_separator("AGENT EXECUTION TRACE")
    
    for entry in trace:
        agent = entry.get("agent", "unknown")
        status = entry.get("status", "unknown")
        
        status_icon = "✅" if status == "success" else "❌" if status == "error" else "⏳"
        
        print(f"{status_icon} {agent.upper()}: {status}")
        
        if "latency_ms" in entry:
            print(f"   Latency: {entry['latency_ms']:.2f}ms")
        
        if "experiences_found" in entry:
            print(f"   Experiences Found: {entry['experiences_found']}")
        
        if "error" in entry:
            print(f"   Error: {entry['error']}")
        
        print()


def print_narrative(narrative: str):
    """Pretty print narrative itinerary."""
    print_separator("NARRATIVE ITINERARY")
    print(narrative)
    print()


def print_budget(budget: dict):
    """Pretty print budget breakdown."""
    if not budget:
        return
    
    print_separator("BUDGET BREAKDOWN")
    print(f"Total Estimate: ₹{budget.get('total_estimate', 0)}")
    print(f"Within Budget: {'✓' if budget.get('within_budget') else '✗'}")
    
    if budget.get('breakdown'):
        print("\nBreakdown:")
        for item in budget['breakdown']:
            print(f"  • {item.get('item', 'N/A')}: ₹{item.get('cost', 0)}")
    
    if budget.get('deals'):
        print("\nDeals:")
        for deal in budget['deals']:
            print(f"  • {deal}")
    print()


async def test_agents_cli():
    """Run agents with CLI output and save results."""
    print_separator("SIDEQUEST AGENT TESTING")
    
    # Create test request
    test_request = ItineraryRequest(
        query="Solo-friendly pottery workshop and artisan coffee experiences in Bangalore",
        social_media_urls=[],
        city="Bangalore",
        budget_min=500,
        budget_max=3000,
        num_people=1,
        solo_preference=True,
        interest_pods=["craft_explorer", "food_nerd"],
        crowd_preference="relatively_niche",
    )
    
    print("📝 Test Request:")
    print(f"   Query: {test_request.query}")
    print(f"   City: {test_request.city}")
    print(f"   Budget: ₹{test_request.budget_min} - ₹{test_request.budget_max}")
    print(f"   Solo: {test_request.solo_preference}")
    print(f"   Interest Pods: {', '.join(test_request.interest_pods)}")
    
    # Create sources directory
    sources_dir = create_sources_directory()
    
    print("\n⏳ Running agent workflow...\n")
    
    try:
        # Run the workflow
        result = await run_workflow(test_request)
        
        # Save discovery results
        if result.experiences:
            save_discovery_results(
                [exp.dict() if hasattr(exp, 'dict') else exp for exp in result.experiences],
                result.session_id,
                sources_dir
            )
        
        # Print results
        print_experiences([exp.dict() if hasattr(exp, 'dict') else exp for exp in result.experiences])
        print_narrative(result.narrative_itinerary)
        print_budget(result.budget_breakdown.dict() if result.budget_breakdown else {})
        print_agent_trace(result.agent_trace)
        
        # Print summary
        print_separator("SUMMARY")
        print(f"✅ Workflow completed successfully")
        print(f"   Session ID: {result.session_id}")
        print(f"   Experiences: {len(result.experiences)}")
        print(f"   Agents Executed: {len([t for t in result.agent_trace if t.get('status') in ['success', 'error']])}")
        
        if result.agent_trace:
            total_time = next((t.get('total_latency_ms', 0) for t in result.agent_trace if t.get('agent') == 'coordinator' and t.get('status') == 'completed'), 0)
            print(f"   Total Time: {total_time:.2f}ms")
        
        print()
        
    except Exception as e:
        print(f"\n❌ Error running workflow: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n🚀 Starting Sidequest Agent Testing\n")
    asyncio.run(test_agents_cli())
