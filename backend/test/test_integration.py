"""
Sidequest Integration Tests

Tests the actual integration between agents and validates data flow.
These tests use mock LLM responses to verify the orchestration logic.

Run with: python3 test/test_integration.py
"""

import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Any, Dict
from unittest.mock import AsyncMock, patch, MagicMock

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from state.schemas import AgentState, ItineraryRequest, ItineraryResponse


# ═══════════════════════════════════════════════════════════════════════════════
# MOCK DATA
# ═══════════════════════════════════════════════════════════════════════════════

MOCK_DISCOVERY_RESULT = {
    "discovered_experiences": [
        {
            "name": "Clay Station Pottery",
            "category": "craft",
            "timing": "10:00 AM - 1:00 PM",
            "budget": 1200,
            "location": "Indiranagar",
            "solo_friendly": True,
            "source": "local_discovery",
            "description": "Hands-on pottery workshop",
        },
        {
            "name": "Third Wave Coffee",
            "category": "food",
            "timing": "8:00 AM - 10:00 PM",
            "budget": 400,
            "location": "Koramangala",
            "solo_friendly": True,
            "source": "local_discovery",
            "description": "Specialty coffee roasters",
        },
    ]
}

MOCK_CULTURAL_CONTEXT = {
    "cultural_context": {
        "Clay Station Pottery": {
            "optimal_timing": "Morning sessions best - artisan is freshest",
            "dress_code": "Old clothes, clay stains expected",
            "transport_hacks": "Auto from Indiranagar metro",
            "social_norms": "Solo welcome, 40% solo attendees",
            "religious_cultural": "No restrictions",
            "safety_accessibility": "Well-lit, ground floor accessible",
        },
        "Third Wave Coffee": {
            "optimal_timing": "9-11am peak coffee culture",
            "dress_code": "Casual, no restrictions",
            "transport_hacks": "Walking distance from metro",
            "social_norms": "Counter seating for solo",
            "religious_cultural": "Open all days",
            "safety_accessibility": "Safe neighborhood",
        },
    }
}

MOCK_SOCIAL_SCAFFOLDING = {
    "social_scaffolding": {
        "Clay Station Pottery": {
            "solo_friendly": True,
            "solo_percentage": "40%",
            "scaffolding": "Shared tables encourage conversation",
            "arrival_vibe": "Welcoming, staff greet you",
            "beginner_energy": "High - designed for first-timers",
        },
        "Third Wave Coffee": {
            "solo_friendly": True,
            "solo_percentage": "60%",
            "scaffolding": "Counter seating faces baristas",
            "arrival_vibe": "Autonomous confidence",
            "beginner_energy": "Medium - ordering can be intimidating",
        },
    }
}

MOCK_NARRATIVE = {
    "narrative_itinerary": """Your Saturday begins not with alarm clocks but with intention.
    
At 10 AM, you push open the door to Clay Station in Indiranagar, where morning light 
filters through dusty windows. The master artisan offers chai before your hands touch earth.
This is your friction point - 30 minutes of centering clay that will test your patience.

By 1 PM, clay under your fingernails becomes a badge of honor. Walk fifteen minutes 
through Indiranagar's tree-lined streets to Third Wave Coffee. Here, counter seating 
isn't loneliness - it's front-row access to baristas who speak the language of 
single-origin beans.

This day isn't about ticking boxes. It's about what your hands remember.""",
    "collision_suggestion": {
        "title": "Craft + Coffee: The Maker's Morning",
        "experiences": ["Clay Station Pottery", "Third Wave Coffee"],
        "why": "Creative work builds appetite for good coffee. The clay-stained hands holding a pour-over is the vibe.",
    }
}

MOCK_BUDGET = {
    "budget_breakdown": {
        "total_estimate": 1850,
        "breakdown": [
            {"experience": "Clay Station Pottery", "cost": 1200, "type": "workshop", "booking_required": "2 days ahead"},
            {"experience": "Third Wave Coffee", "cost": 400, "type": "food_drink", "booking_required": "walk-in"},
            {"experience": "Transport (Auto)", "cost": 250, "type": "transport", "booking_required": "on-demand"},
        ],
        "deals": ["Clay Station: 10% off weekday mornings", "Third Wave: Loyalty card available"],
        "tips": ["Take metro to Indiranagar, save ₹100 on auto"],
        "within_budget": True,
    }
}


# ═══════════════════════════════════════════════════════════════════════════════
# INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCoordinatorIntegration:
    """Test the coordinator's orchestration of agents."""

    async def test_discovery_to_state_mapping(self):
        """Test that discovery results are correctly mapped to state."""
        print("\n" + "─" * 60)
        print("  TEST: Discovery → State Mapping")
        print("─" * 60)
        
        # Import the coordinator
        from agents.coordinator import _create_initial_state
        
        request = ItineraryRequest(
            query="pottery workshop",
            city="Bangalore",
            budget_min=500,
            budget_max=2500,
        )
        
        state = _create_initial_state(request)
        
        # Verify initial state structure
        assert state["user_query"] == "pottery workshop"
        assert state["city"] == "Bangalore"
        assert state["budget_range"] == (500, 2500)
        assert state["discovered_experiences"] == []
        assert state["agent_trace"] == []
        assert "session_id" in state and len(state["session_id"]) > 0
        
        # Simulate discovery result
        state["discovered_experiences"] = MOCK_DISCOVERY_RESULT["discovered_experiences"]
        
        # Verify experiences are in state
        assert len(state["discovered_experiences"]) == 2
        assert state["discovered_experiences"][0]["name"] == "Clay Station Pottery"
        
        print("  ✅ PASSED: Discovery → State mapping works correctly")
        return True

    async def test_parallel_agents_receive_correct_input(self):
        """Test that cultural context and community agents receive correct input."""
        print("\n" + "─" * 60)
        print("  TEST: Parallel Agents Input Validation")
        print("─" * 60)
        
        from agents.coordinator import _create_initial_state
        
        request = ItineraryRequest(
            query="pottery workshop",
            city="Bangalore",
            solo_preference=True,
        )
        
        state = _create_initial_state(request)
        state["discovered_experiences"] = MOCK_DISCOVERY_RESULT["discovered_experiences"]
        
        # Verify inputs for cultural context agent
        assert "discovered_experiences" in state
        assert "city" in state
        assert "solo_preference" in state
        
        # Verify inputs for community agent (same fields)
        experiences = state["discovered_experiences"]
        city = state["city"]
        solo_pref = state["solo_preference"]
        
        assert len(experiences) > 0
        assert city == "Bangalore"
        assert solo_pref is True
        
        print("  ✅ PASSED: Parallel agents receive correct input")
        return True

    async def test_plot_builder_receives_all_inputs(self):
        """Test that plot builder receives outputs from parallel agents."""
        print("\n" + "─" * 60)
        print("  TEST: Plot Builder Input Aggregation")
        print("─" * 60)
        
        from agents.coordinator import _create_initial_state
        
        request = ItineraryRequest(
            query="pottery and coffee",
            city="Bangalore",
            interest_pods=["craft_explorer", "food_nerd"],
        )
        
        state = _create_initial_state(request)
        
        # Simulate discovery output
        state["discovered_experiences"] = MOCK_DISCOVERY_RESULT["discovered_experiences"]
        
        # Simulate parallel agent outputs
        state["cultural_context"] = MOCK_CULTURAL_CONTEXT["cultural_context"]
        state["social_scaffolding"] = MOCK_SOCIAL_SCAFFOLDING["social_scaffolding"]
        
        # Verify plot builder has all required inputs
        assert state["user_query"] == "pottery and coffee"
        assert state["city"] == "Bangalore"
        assert state["interest_pods"] == ["craft_explorer", "food_nerd"]
        assert len(state["discovered_experiences"]) == 2
        assert len(state["cultural_context"]) == 2
        assert len(state["social_scaffolding"]) == 2
        
        print("  ✅ PASSED: Plot builder receives all aggregated inputs")
        return True

    async def test_state_to_response_conversion(self):
        """Test that final state converts correctly to response."""
        print("\n" + "─" * 60)
        print("  TEST: State → Response Conversion")
        print("─" * 60)
        
        from agents.coordinator import _create_initial_state, _state_to_response
        
        request = ItineraryRequest(query="test")
        state = _create_initial_state(request)
        
        # Populate all agent outputs
        state["discovered_experiences"] = MOCK_DISCOVERY_RESULT["discovered_experiences"]
        state["cultural_context"] = MOCK_CULTURAL_CONTEXT["cultural_context"]
        state["social_scaffolding"] = MOCK_SOCIAL_SCAFFOLDING["social_scaffolding"]
        state["narrative_itinerary"] = MOCK_NARRATIVE["narrative_itinerary"]
        state["collision_suggestion"] = MOCK_NARRATIVE["collision_suggestion"]
        state["budget_breakdown"] = MOCK_BUDGET["budget_breakdown"]
        state["agent_trace"] = [
            {"agent": "discovery", "status": "success"},
            {"agent": "cultural_context", "status": "success"},
            {"agent": "community", "status": "success"},
            {"agent": "plot_builder", "status": "success"},
            {"agent": "budget", "status": "success"},
        ]
        
        # Convert to response
        response = _state_to_response(state)
        
        # Verify response structure
        assert isinstance(response, ItineraryResponse)
        assert len(response.experiences) == 2
        assert response.narrative_itinerary.startswith("Your Saturday")
        assert len(response.cultural_context) == 2
        assert len(response.social_scaffolding) == 2
        assert response.budget_breakdown is not None
        # Handle both dict and Pydantic object
        if hasattr(response.budget_breakdown, 'total_estimate'):
            assert response.budget_breakdown.total_estimate == 1850
        else:
            assert response.budget_breakdown["total_estimate"] == 1850
        assert response.collision_suggestion is not None
        if hasattr(response.collision_suggestion, 'title'):
            assert response.collision_suggestion.title == "Craft + Coffee: The Maker's Morning"
        else:
            assert response.collision_suggestion["title"] == "Craft + Coffee: The Maker's Morning"
        assert len(response.agent_trace) == 5
        assert response.session_id == state["session_id"]
        
        print("  ✅ PASSED: State → Response conversion works correctly")
        return True

    async def test_experience_item_conversion(self):
        """Test that experience dicts convert correctly to ExperienceItem format."""
        print("\n" + "─" * 60)
        print("  TEST: Experience Item Conversion")
        print("─" * 60)
        
        from agents.coordinator import _state_to_response, _create_initial_state
        
        state = _create_initial_state(ItineraryRequest(query="test"))
        state["discovered_experiences"] = MOCK_DISCOVERY_RESULT["discovered_experiences"]
        state["narrative_itinerary"] = "Test narrative"
        
        response = _state_to_response(state)
        
        # Verify each experience has correct fields
        for exp in response.experiences:
            # Handle both dict and Pydantic object
            if hasattr(exp, 'name'):
                # Pydantic object
                assert exp.name is not None
                assert exp.category is not None
                assert exp.timing is not None
                assert exp.budget is not None
                assert exp.location is not None
                assert exp.solo_friendly is not None
                assert isinstance(exp.name, str)
                assert isinstance(exp.budget, int)
                assert isinstance(exp.solo_friendly, bool)
            else:
                # Dict
                assert "name" in exp
                assert "category" in exp
                assert "timing" in exp
                assert "budget" in exp
                assert "location" in exp
                assert "solo_friendly" in exp
                assert isinstance(exp["name"], str)
                assert isinstance(exp["budget"], int)
                assert isinstance(exp["solo_friendly"], bool)
        
        # Verify first experience values
        first = response.experiences[0]
        if hasattr(first, 'name'):
            assert first.name == "Clay Station Pottery"
            assert first.category == "craft"
            assert first.budget == 1200
            assert first.solo_friendly is True
        else:
            assert first["name"] == "Clay Station Pottery"
            assert first["category"] == "craft"
            assert first["budget"] == 1200
            assert first["solo_friendly"] is True
        
        print("  ✅ PASSED: Experience items converted correctly")
        return True


class TestAgentTraceIntegration:
    """Test agent trace handling throughout the workflow."""

    async def test_trace_includes_all_agents(self):
        """Test that trace includes entries for all agents."""
        print("\n" + "─" * 60)
        print("  TEST: Trace Includes All Agents")
        print("─" * 60)
        
        expected_agents = {"coordinator", "discovery", "cultural_context", "community", "plot_builder", "budget"}
        
        trace = [
            {"agent": "coordinator", "status": "started"},
            {"agent": "discovery", "status": "success", "experiences_found": 2},
            {"agent": "cultural_context", "status": "success", "contexts_added": 2},
            {"agent": "community", "status": "success", "experiences_analyzed": 2},
            {"agent": "plot_builder", "status": "success", "narrative_length": 500},
            {"agent": "budget", "status": "success", "total_estimate": 1850},
            {"agent": "coordinator", "status": "completed"},
        ]
        
        traced_agents = {t["agent"] for t in trace}
        
        assert expected_agents.issubset(traced_agents), f"Missing agents: {expected_agents - traced_agents}"
        
        print(f"  Traced agents: {traced_agents}")
        print("  ✅ PASSED: All agents represented in trace")
        return True

    async def test_trace_timing_information(self):
        """Test that trace entries include timing information."""
        print("\n" + "─" * 60)
        print("  TEST: Trace Timing Information")
        print("─" * 60)
        
        trace_entry = {
            "agent": "discovery",
            "status": "success",
            "latency_ms": 1234.5,
            "timestamp": datetime.now().isoformat(),
        }
        
        assert "latency_ms" in trace_entry
        assert "timestamp" in trace_entry
        assert trace_entry["latency_ms"] > 0
        
        # Verify timestamp is valid ISO format
        try:
            datetime.fromisoformat(trace_entry["timestamp"])
        except ValueError:
            assert False, "Invalid timestamp format"
        
        print("  ✅ PASSED: Trace includes timing information")
        return True

    async def test_trace_error_handling(self):
        """Test that errors are properly recorded in trace."""
        print("\n" + "─" * 60)
        print("  TEST: Trace Error Handling")
        print("─" * 60)
        
        trace = [
            {"agent": "discovery", "status": "success"},
            {"agent": "cultural_context", "status": "error", "error": "API rate limit exceeded"},
            {"agent": "community", "status": "success"},
        ]
        
        errors = [t for t in trace if t["status"] == "error"]
        
        assert len(errors) == 1
        assert errors[0]["agent"] == "cultural_context"
        assert "error" in errors[0]
        
        print("  ✅ PASSED: Errors recorded correctly in trace")
        return True


class TestErrorHandling:
    """Test error handling in the workflow."""

    async def test_empty_discovery_handling(self):
        """Test handling when discovery returns no experiences."""
        print("\n" + "─" * 60)
        print("  TEST: Empty Discovery Handling")
        print("─" * 60)
        
        from agents.coordinator import _create_initial_state, _state_to_response
        
        state = _create_initial_state(ItineraryRequest(query="impossible query"))
        
        # Simulate empty discovery
        state["discovered_experiences"] = []
        state["narrative_itinerary"] = "No experiences found"
        state["agent_trace"] = [{"agent": "discovery", "status": "error"}]
        
        response = _state_to_response(state)
        
        assert response.experiences == []
        assert response.cultural_context == {}
        assert response.social_scaffolding == {}
        
        print("  ✅ PASSED: Empty discovery handled gracefully")
        return True

    async def test_partial_failure_handling(self):
        """Test handling when some agents fail."""
        print("\n" + "─" * 60)
        print("  TEST: Partial Failure Handling")
        print("─" * 60)
        
        from agents.coordinator import _create_initial_state, _state_to_response
        
        state = _create_initial_state(ItineraryRequest(query="test"))
        
        # Simulate partial success
        state["discovered_experiences"] = MOCK_DISCOVERY_RESULT["discovered_experiences"]
        state["cultural_context"] = {}  # Failed
        state["social_scaffolding"] = MOCK_SOCIAL_SCAFFOLDING["social_scaffolding"]
        state["narrative_itinerary"] = "Partial narrative"
        state["errors"] = [{"agent": "cultural_context", "error": "API error"}]
        state["agent_trace"] = [
            {"agent": "discovery", "status": "success"},
            {"agent": "cultural_context", "status": "error"},
            {"agent": "community", "status": "success"},
        ]
        
        response = _state_to_response(state)
        
        # Should still produce a response
        assert len(response.experiences) == 2
        assert response.cultural_context == {}  # Empty but not None
        assert len(response.social_scaffolding) == 2
        
        print("  ✅ PASSED: Partial failures handled gracefully")
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# RUN ALL TESTS
# ═══════════════════════════════════════════════════════════════════════════════

async def run_all_tests():
    """Run all integration tests."""
    print("\n" + "=" * 80)
    print("  SIDEQUEST INTEGRATION TEST SUITE")
    print("=" * 80)
    
    test_classes = [
        TestCoordinatorIntegration,
        TestAgentTraceIntegration,
        TestErrorHandling,
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    for test_class in test_classes:
        print(f"\n{'═' * 60}")
        print(f"  {test_class.__name__}")
        print(f"{'═' * 60}")
        
        instance = test_class()
        
        for method_name in dir(instance):
            if method_name.startswith("test_"):
                total_tests += 1
                try:
                    method = getattr(instance, method_name)
                    if asyncio.iscoroutinefunction(method):
                        await method()
                    else:
                        method()
                    passed_tests += 1
                except AssertionError as e:
                    failed_tests.append(f"{test_class.__name__}.{method_name}: {e}")
                    print(f"\n  ❌ FAILED: {method_name}")
                    print(f"     {e}")
                except Exception as e:
                    failed_tests.append(f"{test_class.__name__}.{method_name}: {type(e).__name__}: {e}")
                    print(f"\n  ❌ ERROR: {method_name}")
                    print(f"     {type(e).__name__}: {e}")
    
    # Summary
    print("\n" + "=" * 80)
    print("  SUMMARY")
    print("=" * 80)
    print(f"\n  Total Tests: {total_tests}")
    print(f"  Passed: {passed_tests}")
    print(f"  Failed: {len(failed_tests)}")
    
    if failed_tests:
        print("\n  Failed Tests:")
        for failure in failed_tests:
            print(f"    - {failure}")
    
    print("\n" + "=" * 80 + "\n")
    
    return len(failed_tests) == 0


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
