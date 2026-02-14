"""
Quick test to debug the API error
"""
import asyncio
import json
from state.schemas import ItineraryRequest
from agents.coordinator import run_workflow


async def test_workflow():
    """Test the workflow directly"""
    request = ItineraryRequest(
        query="Solo-friendly pottery workshop for complete beginners in Bangalore",
        city="Bangalore",
        budget_min=200,
        budget_max=5000,
        num_people=1,
        solo_preference=True,
        interest_pods=["craft_explorer"],
        crowd_preference="relatively_niche",
    )
    
    print("Starting workflow test...")
    try:
        result = await run_workflow(request)
        print("✅ Workflow completed successfully!")
        print(f"Session ID: {result.session_id}")
        print(f"Narrative length: {len(result.narrative_itinerary)}")
        print(f"Experiences found: {len(result.experiences)}")
        print(f"Agent trace entries: {len(result.agent_trace)}")
        print("\n=== Agent Trace ===")
        for trace in result.agent_trace:
            print(f"  {trace.get('agent', 'unknown')}: {trace.get('status', 'unknown')}")
            if trace.get('error'):
                print(f"    ERROR: {trace['error']}")
        
        if result.errors:
            print("\n=== Errors ===")
            for error in result.errors:
                print(f"  {error.get('agent', 'unknown')}: {error.get('error', 'unknown')}")
                
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_workflow())
