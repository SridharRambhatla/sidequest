"""
Sidequest Live Agent Evaluation Suite

Tests agents with actual API calls to validate real outputs.
Requires GOOGLE_API_KEY to be set in environment.

Run with: python test/test_live_agent_evals.py
"""

import asyncio
import json
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Any, Optional

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from state.schemas import AgentState


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Check for API key
API_KEY = os.environ.get("GOOGLE_API_KEY")
if not API_KEY:
    print("❌ GOOGLE_API_KEY not set. Skipping live tests.")
    print("   Set GOOGLE_API_KEY in .env file to run live evaluations.")


# ═══════════════════════════════════════════════════════════════════════════════
# TEST FIXTURES
# ═══════════════════════════════════════════════════════════════════════════════

def create_test_state(
    query: str = "Solo-friendly pottery workshop and artisan coffee in Bangalore",
    city: str = "Bangalore",
    budget_range: tuple = (500, 2500),
    interest_pods: list = None,
) -> AgentState:
    """Create a test AgentState."""
    return AgentState(
        user_query=query,
        social_media_urls=[],
        city=city,
        budget_range=budget_range,
        num_people=1,
        solo_preference=True,
        interest_pods=interest_pods or ["craft_explorer", "food_nerd"],
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
        session_id=f"eval_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
    )


# ═══════════════════════════════════════════════════════════════════════════════
# DISCOVERY AGENT EVALUATION
# ═══════════════════════════════════════════════════════════════════════════════

class DiscoveryAgentEval:
    """Evaluate Discovery Agent outputs."""

    @staticmethod
    async def test_basic_discovery():
        """Test basic discovery with a simple query."""
        from agents.discovery_agent import run_discovery_agent
        
        print("\n" + "─" * 60)
        print("  TEST: Discovery Agent - Basic Query")
        print("─" * 60)
        
        state = create_test_state(
            query="pottery workshops in Bangalore",
            interest_pods=["craft_explorer"],
        )
        
        result = run_discovery_agent(state)
        
        # Validate output
        assert "discovered_experiences" in result, "Missing discovered_experiences"
        experiences = result["discovered_experiences"]
        
        print(f"  Found {len(experiences)} experiences")
        
        # Should find at least 1 experience
        assert len(experiences) >= 1, f"Expected at least 1 experience, got {len(experiences)}"
        
        # Validate each experience structure
        required_fields = ["name", "category", "budget", "location"]
        for i, exp in enumerate(experiences):
            for field in required_fields:
                assert field in exp, f"Experience {i} missing {field}"
            print(f"  ✓ {exp['name']} ({exp['category']}) - ₹{exp['budget']}")
        
        # Note: Discovery agent doesn't add agent_trace (coordinator does)
        # Just verify no error was returned
        assert "error" not in result or not result["error"], f"Discovery error: {result.get('error')}"
        
        print("  ✅ PASSED: Basic discovery works correctly")
        return True

    @staticmethod
    async def test_interest_pod_filtering():
        """Test that interest pods influence results."""
        from agents.discovery_agent import run_discovery_agent
        
        print("\n" + "─" * 60)
        print("  TEST: Discovery Agent - Interest Pod Filtering")
        print("─" * 60)
        
        # Test with food interest
        state_food = create_test_state(
            query="experiences in Bangalore",
            interest_pods=["food_nerd"],
        )
        result_food = run_discovery_agent(state_food)
        
        # Test with craft interest
        state_craft = create_test_state(
            query="experiences in Bangalore",
            interest_pods=["craft_explorer"],
        )
        result_craft = run_discovery_agent(state_craft)
        
        food_experiences = result_food.get("discovered_experiences", [])
        craft_experiences = result_craft.get("discovered_experiences", [])
        
        print(f"  Food query: {len(food_experiences)} experiences")
        print(f"  Craft query: {len(craft_experiences)} experiences")
        
        # Count categories
        food_categories = [e.get("category", "").lower() for e in food_experiences]
        craft_categories = [e.get("category", "").lower() for e in craft_experiences]
        
        food_food_count = sum(1 for c in food_categories if "food" in c)
        craft_craft_count = sum(1 for c in craft_categories if "craft" in c)
        
        print(f"  Food experiences in food query: {food_food_count}")
        print(f"  Craft experiences in craft query: {craft_craft_count}")
        
        # Results should be different (at least some variation)
        food_names = {e.get("name") for e in food_experiences}
        craft_names = {e.get("name") for e in craft_experiences}
        
        overlap = food_names.intersection(craft_names)
        print(f"  Overlap between results: {len(overlap)} experiences")
        
        # Some difference should exist
        assert food_names != craft_names or len(food_experiences) == 0 or len(craft_experiences) == 0, \
            "Interest pods had no effect on results"
        
        print("  ✅ PASSED: Interest pods influence discovery")
        return True

    @staticmethod
    async def test_budget_range_awareness():
        """Test that budget range is considered."""
        from agents.discovery_agent import run_discovery_agent
        
        print("\n" + "─" * 60)
        print("  TEST: Discovery Agent - Budget Range Awareness")
        print("─" * 60)
        
        state = create_test_state(
            query="affordable experiences in Bangalore",
            budget_range=(200, 1000),
        )
        
        result = run_discovery_agent(state)
        experiences = result.get("discovered_experiences", [])
        
        print(f"  Found {len(experiences)} experiences")
        
        within_budget = 0
        over_budget = 0
        
        for exp in experiences:
            budget = exp.get("budget", 0)
            if budget <= 1000:
                within_budget += 1
            else:
                over_budget += 1
            print(f"  - {exp['name']}: ₹{budget} {'✓' if budget <= 1000 else '⚠️ over budget'}")
        
        # Most experiences should be within budget
        if len(experiences) > 0:
            within_ratio = within_budget / len(experiences)
            print(f"  Within budget: {within_budget}/{len(experiences)} ({within_ratio:.0%})")
            
            # At least 50% should be within budget
            assert within_ratio >= 0.5, f"Only {within_ratio:.0%} within budget"
        
        print("  ✅ PASSED: Budget range considered in discovery")
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# CULTURAL CONTEXT AGENT EVALUATION
# ═══════════════════════════════════════════════════════════════════════════════

class CulturalContextAgentEval:
    """Evaluate Cultural Context Agent outputs."""

    @staticmethod
    async def test_cultural_context_generation():
        """Test cultural context generation for experiences."""
        from agents.cultural_context_agent import run_cultural_context
        
        print("\n" + "─" * 60)
        print("  TEST: Cultural Context Agent - Context Generation")
        print("─" * 60)
        
        # Create state with sample experiences
        state = create_test_state()
        state["discovered_experiences"] = [
            {
                "name": "Clay Station Pottery",
                "category": "craft",
                "budget": 1200,
                "location": "Indiranagar",
                "timing": "10:00 AM - 1:00 PM",
            },
            {
                "name": "Third Wave Coffee",
                "category": "food",
                "budget": 400,
                "location": "Koramangala",
                "timing": "8:00 AM - 10:00 PM",
            },
        ]
        
        result = await run_cultural_context(state)
        
        # Validate output
        assert "cultural_context" in result, "Missing cultural_context"
        context = result["cultural_context"]
        
        print(f"  Generated context for {len(context)} experiences")
        
        # Should have context for experiences
        if len(context) > 0:
            expected_fields = ["optimal_timing", "dress_code", "transport_hacks", "social_norms"]
            
            for exp_name, exp_context in context.items():
                print(f"\n  {exp_name}:")
                
                for field in expected_fields:
                    if field in exp_context:
                        value = exp_context[field]
                        # Truncate for display
                        display = value[:60] + "..." if len(value) > 60 else value
                        print(f"    ✓ {field}: {display}")
                    else:
                        print(f"    ⚠️ Missing: {field}")
        
        # Check agent trace
        trace = result.get("agent_trace", [])
        assert any(t["agent"] == "cultural_context" for t in trace), "No cultural_context trace"
        
        print("\n  ✅ PASSED: Cultural context generation works")
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# COMMUNITY AGENT EVALUATION
# ═══════════════════════════════════════════════════════════════════════════════

class CommunityAgentEval:
    """Evaluate Community Agent outputs."""

    @staticmethod
    async def test_social_scaffolding_generation():
        """Test social scaffolding generation for experiences."""
        from agents.community_agent import run_community
        
        print("\n" + "─" * 60)
        print("  TEST: Community Agent - Social Scaffolding")
        print("─" * 60)
        
        state = create_test_state()
        state["discovered_experiences"] = [
            {
                "name": "Pottery Workshop",
                "category": "craft",
                "budget": 1200,
                "location": "Indiranagar",
                "solo_friendly": True,
            },
            {
                "name": "Coffee Shop",
                "category": "food",
                "budget": 400,
                "location": "Koramangala",
                "solo_friendly": True,
            },
        ]
        
        result = await run_community(state)
        
        # Validate output
        assert "social_scaffolding" in result, "Missing social_scaffolding"
        scaffolding = result["social_scaffolding"]
        
        print(f"  Generated scaffolding for {len(scaffolding)} experiences")
        
        if len(scaffolding) > 0:
            expected_fields = ["solo_friendly", "scaffolding", "arrival_vibe", "beginner_energy"]
            
            for exp_name, exp_scaffolding in scaffolding.items():
                print(f"\n  {exp_name}:")
                
                for field in expected_fields:
                    if field in exp_scaffolding:
                        value = str(exp_scaffolding[field])
                        display = value[:50] + "..." if len(value) > 50 else value
                        print(f"    ✓ {field}: {display}")
        
        # Check agent trace
        trace = result.get("agent_trace", [])
        assert any(t["agent"] == "community" for t in trace), "No community trace"
        
        print("\n  ✅ PASSED: Social scaffolding generation works")
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# PLOT BUILDER AGENT EVALUATION
# ═══════════════════════════════════════════════════════════════════════════════

class PlotBuilderAgentEval:
    """Evaluate Plot Builder Agent outputs."""

    @staticmethod
    async def test_narrative_generation():
        """Test narrative itinerary generation."""
        from agents.plot_builder_agent import run_plot_builder
        
        print("\n" + "─" * 60)
        print("  TEST: Plot Builder Agent - Narrative Generation")
        print("─" * 60)
        
        state = create_test_state()
        state["discovered_experiences"] = [
            {
                "name": "Clay Station Pottery",
                "category": "craft",
                "budget": 1200,
                "location": "Indiranagar",
                "timing": "10:00 AM - 1:00 PM",
                "description": "Hands-on pottery workshop",
            },
            {
                "name": "Third Wave Coffee",
                "category": "food",
                "budget": 400,
                "location": "Koramangala",
                "timing": "Flexible",
                "description": "Specialty coffee shop",
            },
        ]
        state["cultural_context"] = {
            "Clay Station Pottery": {
                "optimal_timing": "Morning sessions best",
                "transport_hacks": "Auto from metro",
            },
        }
        state["social_scaffolding"] = {
            "Clay Station Pottery": {
                "solo_friendly": True,
                "beginner_energy": "High",
            },
        }
        
        result = await run_plot_builder(state)
        
        # Validate narrative
        assert "narrative_itinerary" in result, "Missing narrative_itinerary"
        narrative = result["narrative_itinerary"]
        
        print(f"  Narrative length: {len(narrative)} characters")
        assert len(narrative) > 100, f"Narrative too short: {len(narrative)} chars"
        
        # Show preview
        preview = narrative[:200] + "..." if len(narrative) > 200 else narrative
        print(f"\n  Preview:\n  {preview}")
        
        # Check for collision suggestion
        collision = result.get("collision_suggestion", {})
        if collision:
            print(f"\n  Collision Suggestion:")
            print(f"    Title: {collision.get('title', 'N/A')}")
            print(f"    Why: {collision.get('why', 'N/A')[:50]}...")
        
        # Check agent trace
        trace = result.get("agent_trace", [])
        assert any(t["agent"] == "plot_builder" for t in trace), "No plot_builder trace"
        
        print("\n  ✅ PASSED: Narrative generation works")
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# BUDGET AGENT EVALUATION
# ═══════════════════════════════════════════════════════════════════════════════

class BudgetAgentEval:
    """Evaluate Budget Agent outputs."""

    @staticmethod
    async def test_budget_breakdown_generation():
        """Test budget breakdown generation."""
        from agents.budget_agent import run_budget_optimizer
        
        print("\n" + "─" * 60)
        print("  TEST: Budget Agent - Budget Breakdown")
        print("─" * 60)
        
        state = create_test_state(budget_range=(500, 2500))
        state["discovered_experiences"] = [
            {
                "name": "Pottery Workshop",
                "category": "craft",
                "budget": 1200,
                "location": "Indiranagar",
            },
            {
                "name": "Coffee Experience",
                "category": "food",
                "budget": 400,
                "location": "Koramangala",
            },
        ]
        
        result = await run_budget_optimizer(state)
        
        # Validate budget breakdown
        assert "budget_breakdown" in result, "Missing budget_breakdown"
        breakdown = result["budget_breakdown"]
        
        print(f"  Budget breakdown generated")
        
        if breakdown:
            total = breakdown.get("total_estimate", 0)
            items = breakdown.get("breakdown", [])
            within = breakdown.get("within_budget", False)
            
            print(f"\n  Total Estimate: ₹{total}")
            print(f"  Within Budget: {within}")
            print(f"  Breakdown Items: {len(items)}")
            
            for item in items:
                print(f"    - {item.get('experience', 'Unknown')}: ₹{item.get('cost', 0)}")
            
            # Deals and tips
            deals = breakdown.get("deals", [])
            tips = breakdown.get("tips", [])
            
            if deals:
                print(f"\n  Deals: {len(deals)}")
                for deal in deals[:2]:
                    print(f"    - {deal[:60]}...")
            
            if tips:
                print(f"\n  Tips: {len(tips)}")
                for tip in tips[:2]:
                    print(f"    - {tip[:60]}...")
        
        # Check agent trace
        trace = result.get("agent_trace", [])
        assert any(t["agent"] == "budget" for t in trace), "No budget trace"
        
        print("\n  ✅ PASSED: Budget breakdown generation works")
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# END-TO-END WORKFLOW EVALUATION
# ═══════════════════════════════════════════════════════════════════════════════

class E2EWorkflowEval:
    """Evaluate end-to-end workflow."""

    @staticmethod
    async def test_full_workflow():
        """Test complete agent workflow."""
        from agents.coordinator import run_workflow
        from state.schemas import ItineraryRequest
        
        print("\n" + "─" * 60)
        print("  TEST: End-to-End Workflow")
        print("─" * 60)
        
        request = ItineraryRequest(
            query="Solo pottery workshop and artisan coffee in Bangalore",
            city="Bangalore",
            budget_min=500,
            budget_max=3000,
            solo_preference=True,
            interest_pods=["craft_explorer", "food_nerd"],
            crowd_preference="relatively_niche",
        )
        
        print(f"  Query: {request.query}")
        print(f"  City: {request.city}")
        print(f"  Budget: ₹{request.budget_min} - ₹{request.budget_max}")
        print("\n  Running workflow...")
        
        start_time = datetime.now()
        result = await run_workflow(request)
        elapsed = (datetime.now() - start_time).total_seconds()
        
        print(f"  Completed in {elapsed:.1f}s")
        
        # Validate all expected outputs
        print("\n  Output Validation:")
        
        # Handle both dict and ItineraryResponse object
        if hasattr(result, 'experiences'):
            # ItineraryResponse object
            experiences = result.experiences
            context = result.cultural_context
            scaffolding = result.social_scaffolding
            narrative = result.narrative_itinerary
            budget = result.budget_breakdown
            trace = result.agent_trace
            session_id = result.session_id
        else:
            # Dict
            experiences = result.get("experiences", [])
            context = result.get("cultural_context", {})
            scaffolding = result.get("social_scaffolding", {})
            narrative = result.get("narrative_itinerary", "")
            budget = result.get("budget_breakdown", {})
            trace = result.get("agent_trace", [])
            session_id = result.get("session_id", "")
        
        # 1. Experiences
        print(f"    ✓ Experiences: {len(experiences)}")
        assert len(experiences) > 0, "No experiences generated"
        
        # 2. Cultural Context
        print(f"    ✓ Cultural Context: {len(context)} entries")
        
        # 3. Social Scaffolding
        print(f"    ✓ Social Scaffolding: {len(scaffolding)} entries")
        
        # 4. Narrative
        print(f"    ✓ Narrative: {len(narrative)} chars")
        assert len(narrative) > 100, "Narrative too short"
        
        # 5. Budget Breakdown
        if budget:
            if hasattr(budget, 'total_estimate'):
                print(f"    ✓ Budget: ₹{budget.total_estimate}")
            else:
                print(f"    ✓ Budget: ₹{budget.get('total_estimate', 'N/A')}")
        else:
            print(f"    ⚠️ Budget: Not generated")
        
        # 6. Agent Trace
        print(f"    ✓ Agent Trace: {len(trace)} entries")
        
        # Verify all agents ran
        traced_agents = {t.get("agent") for t in trace}
        expected_agents = {"discovery", "cultural_context", "community", "plot_builder", "budget"}
        
        for agent in expected_agents:
            if agent in traced_agents:
                agent_trace = next(t for t in trace if t.get("agent") == agent)
                status = agent_trace.get("status", "unknown")
                latency = agent_trace.get("latency_ms", 0)
                print(f"      - {agent}: {status} ({latency:.0f}ms)")
            else:
                print(f"      - {agent}: ⚠️ missing from trace")
        
        # 7. Session ID
        print(f"    ✓ Session ID: {session_id[:20] if session_id else 'N/A'}...")
        
        print("\n  ✅ PASSED: Full workflow completed successfully")
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# RUN EVALUATIONS
# ═══════════════════════════════════════════════════════════════════════════════

async def run_all_evals():
    """Run all evaluation tests."""
    print("\n" + "=" * 80)
    print("  SIDEQUEST LIVE AGENT EVALUATION SUITE")
    print("=" * 80)
    
    if not API_KEY:
        print("\n⚠️  GOOGLE_API_KEY not set. Cannot run live evaluations.")
        return False
    
    eval_classes = [
        ("Discovery Agent", DiscoveryAgentEval, [
            "test_basic_discovery",
            "test_interest_pod_filtering",
            "test_budget_range_awareness",
        ]),
        ("Cultural Context Agent", CulturalContextAgentEval, [
            "test_cultural_context_generation",
        ]),
        ("Community Agent", CommunityAgentEval, [
            "test_social_scaffolding_generation",
        ]),
        ("Plot Builder Agent", PlotBuilderAgentEval, [
            "test_narrative_generation",
        ]),
        ("Budget Agent", BudgetAgentEval, [
            "test_budget_breakdown_generation",
        ]),
        ("E2E Workflow", E2EWorkflowEval, [
            "test_full_workflow",
        ]),
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    for section_name, eval_class, test_methods in eval_classes:
        print(f"\n{'═' * 80}")
        print(f"  {section_name.upper()}")
        print(f"{'═' * 80}")
        
        for method_name in test_methods:
            total_tests += 1
            try:
                method = getattr(eval_class, method_name)
                if asyncio.iscoroutinefunction(method):
                    await method()
                else:
                    method()
                passed_tests += 1
            except AssertionError as e:
                failed_tests.append(f"{section_name}.{method_name}: {e}")
                print(f"\n  ❌ FAILED: {method_name}")
                print(f"     {e}")
            except Exception as e:
                failed_tests.append(f"{section_name}.{method_name}: {type(e).__name__}: {e}")
                print(f"\n  ❌ ERROR: {method_name}")
                print(f"     {type(e).__name__}: {e}")
    
    # Summary
    print("\n" + "=" * 80)
    print("  EVALUATION SUMMARY")
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
    success = asyncio.run(run_all_evals())
    sys.exit(0 if success else 1)
