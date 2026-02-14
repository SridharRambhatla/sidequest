"""
Sidequest Agent Field Contract Tests

Documents and verifies the exact fields each agent reads and writes.
This serves as both documentation and validation of the agent contracts.

Run with: python3 test/test_field_contracts.py
"""

import sys
from pathlib import Path
from typing import Set, Dict, Any

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from state.schemas import AgentState


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT FIELD CONTRACTS
# ═══════════════════════════════════════════════════════════════════════════════

# These contracts define what fields each agent reads (inputs) and writes (outputs)
# This is the source of truth for agent data flow

AGENT_CONTRACTS = {
    "discovery": {
        "inputs": {
            "user_query": "Natural language query from user",
            "city": "Target city for experiences",
            "budget_range": "Tuple of (min, max) budget in INR",
            "interest_pods": "List of interest categories (e.g., ['craft_explorer', 'food_nerd'])",
        },
        "outputs": {
            "discovered_experiences": "List of experience dicts with name, category, timing, budget, location, etc.",
        },
        "trace_fields": {
            "agent": "discovery",
            "status": "success | error | skipped",
            "experiences_found": "Number of experiences discovered",
            "latency_ms": "Execution time in milliseconds",
            "timestamp": "ISO timestamp of execution",
        },
    },
    "cultural_context": {
        "inputs": {
            "discovered_experiences": "List of experiences to add context to",
            "city": "Target city (for cultural nuances)",
            "solo_preference": "Whether user prefers solo-friendly experiences",
        },
        "outputs": {
            "cultural_context": "Dict keyed by experience name with cultural annotations",
        },
        "output_structure": {
            "optimal_timing": "When locals go, peak hours",
            "dress_code": "What to wear, etiquette",
            "transport_hacks": "How to get there efficiently",
            "social_norms": "Solo dining accepted? Conversation culture?",
            "religious_cultural": "Festival timing, local customs",
            "safety_accessibility": "Well-lit? Wheelchair access?",
        },
        "trace_fields": {
            "agent": "cultural_context",
            "status": "success | error | skipped",
            "contexts_added": "Number of contexts generated",
            "latency_ms": "Execution time in milliseconds",
            "timestamp": "ISO timestamp of execution",
        },
    },
    "community": {
        "inputs": {
            "discovered_experiences": "List of experiences to analyze",
            "city": "Target city",
            "solo_preference": "Whether user prefers solo-friendly",
        },
        "outputs": {
            "social_scaffolding": "Dict keyed by experience name with social dynamics",
        },
        "output_structure": {
            "solo_friendly": "Boolean - can someone come alone comfortably?",
            "solo_percentage": "Estimated % of solo attendees (e.g., '40%')",
            "scaffolding": "How the environment facilitates connection",
            "arrival_vibe": "What it feels like arriving alone",
            "beginner_energy": "Low | Medium | High - welcoming to first-timers?",
        },
        "trace_fields": {
            "agent": "community",
            "status": "success | error | skipped",
            "experiences_analyzed": "Number of experiences analyzed",
            "latency_ms": "Execution time in milliseconds",
            "timestamp": "ISO timestamp of execution",
        },
    },
    "plot_builder": {
        "inputs": {
            "user_query": "Original user query for context",
            "city": "Target city",
            "interest_pods": "User's interest categories",
            "solo_preference": "Whether user prefers solo",
            "discovered_experiences": "Experiences to include in narrative",
            "cultural_context": "Cultural annotations to weave in",
            "social_scaffolding": "Social dynamics to incorporate",
        },
        "outputs": {
            "narrative_itinerary": "Story-based itinerary with emotional arc (string)",
            "collision_suggestion": "Cross-pod recommendation for serendipity",
        },
        "collision_structure": {
            "title": "Name of the collision suggestion",
            "experiences": "List of experience names that pair well",
            "why": "Explanation of why they pair well",
        },
        "trace_fields": {
            "agent": "plot_builder",
            "status": "success | error | skipped",
            "narrative_length": "Length of narrative in characters",
            "has_collision": "Boolean - whether collision suggestion was generated",
            "latency_ms": "Execution time in milliseconds",
            "timestamp": "ISO timestamp of execution",
        },
    },
    "budget": {
        "inputs": {
            "discovered_experiences": "Experiences to price",
            "city": "City for local pricing",
            "budget_range": "User's budget constraints",
            "num_people": "Party size for cost calculation",
        },
        "outputs": {
            "budget_breakdown": "Detailed cost analysis",
        },
        "output_structure": {
            "total_estimate": "Total cost in INR (int)",
            "breakdown": "List of cost items with experience, cost, type, booking_required",
            "deals": "List of available deals/discounts (list[str])",
            "tips": "Cost-saving tips (list[str])",
            "within_budget": "Boolean - fits user budget?",
        },
        "trace_fields": {
            "agent": "budget",
            "status": "success | error | skipped",
            "total_estimate": "Total estimated cost",
            "within_budget": "Whether within user's budget",
            "latency_ms": "Execution time in milliseconds",
            "timestamp": "ISO timestamp of execution",
        },
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# EXPERIENCE ITEM CONTRACT
# ═══════════════════════════════════════════════════════════════════════════════

EXPERIENCE_ITEM_CONTRACT = {
    "required_fields": {
        "name": "str - Experience name",
        "category": "str - Category (craft, food, heritage, nature, adventure, art, music, wellness)",
        "timing": "str - Operating hours or timing info",
        "budget": "int - Cost in INR",
        "location": "str - Neighborhood or address",
    },
    "optional_fields": {
        "solo_friendly": "bool - Suitable for solo visitors (default: False)",
        "source": "str - Data source (default: '')",
        "lore": "str - Background story (default: '')",
        "description": "str - Brief description (default: '')",
    },
    "valid_categories": [
        "craft",
        "food",
        "heritage",
        "nature",
        "adventure",
        "art",
        "music",
        "wellness",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT VALIDATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestAgentContracts:
    """Validate agent field contracts against actual schema."""

    def test_agent_state_has_all_input_fields(self):
        """Test that AgentState has all fields agents need to read."""
        all_input_fields: Set[str] = set()
        
        for agent_name, contract in AGENT_CONTRACTS.items():
            for field in contract["inputs"].keys():
                all_input_fields.add(field)
        
        state_fields = set(AgentState.__annotations__.keys())
        
        missing = all_input_fields - state_fields
        assert not missing, f"AgentState missing input fields: {missing}"
        
        print(f"✅ All {len(all_input_fields)} input fields present in AgentState")
        return True

    def test_agent_state_has_all_output_fields(self):
        """Test that AgentState has all fields agents write."""
        all_output_fields: Set[str] = set()
        
        for agent_name, contract in AGENT_CONTRACTS.items():
            for field in contract["outputs"].keys():
                all_output_fields.add(field)
        
        state_fields = set(AgentState.__annotations__.keys())
        
        missing = all_output_fields - state_fields
        assert not missing, f"AgentState missing output fields: {missing}"
        
        print(f"✅ All {len(all_output_fields)} output fields present in AgentState")
        return True

    def test_agent_state_has_metadata_fields(self):
        """Test that AgentState has required metadata fields."""
        required_metadata = {"agent_trace", "errors", "session_id"}
        
        state_fields = set(AgentState.__annotations__.keys())
        
        missing = required_metadata - state_fields
        assert not missing, f"AgentState missing metadata fields: {missing}"
        
        print(f"✅ All metadata fields present in AgentState")
        return True


class TestDataFlowContracts:
    """Validate data flow between agents."""

    def test_discovery_outputs_flow_to_cultural_context(self):
        """Test Discovery → Cultural Context data flow."""
        discovery_outputs = set(AGENT_CONTRACTS["discovery"]["outputs"].keys())
        cultural_inputs = set(AGENT_CONTRACTS["cultural_context"]["inputs"].keys())
        
        # cultural_context needs discovered_experiences from discovery
        assert "discovered_experiences" in discovery_outputs
        assert "discovered_experiences" in cultural_inputs
        
        print("✅ Discovery → Cultural Context: discovered_experiences flows correctly")
        return True

    def test_discovery_outputs_flow_to_community(self):
        """Test Discovery → Community data flow."""
        discovery_outputs = set(AGENT_CONTRACTS["discovery"]["outputs"].keys())
        community_inputs = set(AGENT_CONTRACTS["community"]["inputs"].keys())
        
        # community needs discovered_experiences from discovery
        assert "discovered_experiences" in discovery_outputs
        assert "discovered_experiences" in community_inputs
        
        print("✅ Discovery → Community: discovered_experiences flows correctly")
        return True

    def test_parallel_agents_to_plot_builder(self):
        """Test Cultural Context + Community → Plot Builder data flow."""
        cultural_outputs = set(AGENT_CONTRACTS["cultural_context"]["outputs"].keys())
        community_outputs = set(AGENT_CONTRACTS["community"]["outputs"].keys())
        plot_inputs = set(AGENT_CONTRACTS["plot_builder"]["inputs"].keys())
        
        # Plot builder needs outputs from both parallel agents
        assert "cultural_context" in cultural_outputs
        assert "cultural_context" in plot_inputs
        
        assert "social_scaffolding" in community_outputs
        assert "social_scaffolding" in plot_inputs
        
        print("✅ Parallel agents → Plot Builder: cultural_context and social_scaffolding flow correctly")
        return True

    def test_discovery_outputs_flow_to_budget(self):
        """Test Discovery → Budget data flow."""
        discovery_outputs = set(AGENT_CONTRACTS["discovery"]["outputs"].keys())
        budget_inputs = set(AGENT_CONTRACTS["budget"]["inputs"].keys())
        
        # budget needs discovered_experiences from discovery
        assert "discovered_experiences" in discovery_outputs
        assert "discovered_experiences" in budget_inputs
        
        print("✅ Discovery → Budget: discovered_experiences flows correctly")
        return True


class TestExperienceItemContract:
    """Validate experience item structure."""

    def test_required_fields_defined(self):
        """Test that required fields are defined."""
        required = EXPERIENCE_ITEM_CONTRACT["required_fields"]
        
        assert "name" in required
        assert "category" in required
        assert "budget" in required
        assert "location" in required
        
        print(f"✅ {len(required)} required fields defined for ExperienceItem")
        return True

    def test_optional_fields_defined(self):
        """Test that optional fields are defined."""
        optional = EXPERIENCE_ITEM_CONTRACT["optional_fields"]
        
        assert "solo_friendly" in optional
        assert "description" in optional
        
        print(f"✅ {len(optional)} optional fields defined for ExperienceItem")
        return True

    def test_valid_categories_defined(self):
        """Test that valid categories are defined."""
        categories = EXPERIENCE_ITEM_CONTRACT["valid_categories"]
        
        assert "craft" in categories
        assert "food" in categories
        assert "heritage" in categories
        
        print(f"✅ {len(categories)} valid categories defined")
        return True


class TestTraceContracts:
    """Validate agent trace structure."""

    def test_all_agents_have_trace_fields(self):
        """Test that all agents define trace fields."""
        for agent_name, contract in AGENT_CONTRACTS.items():
            assert "trace_fields" in contract, f"{agent_name} missing trace_fields"
            
            trace = contract["trace_fields"]
            assert "agent" in trace, f"{agent_name} trace missing 'agent' field"
            assert "status" in trace, f"{agent_name} trace missing 'status' field"
            assert "latency_ms" in trace, f"{agent_name} trace missing 'latency_ms' field"
        
        print(f"✅ All {len(AGENT_CONTRACTS)} agents have proper trace field definitions")
        return True

    def test_trace_status_values(self):
        """Test that trace status has valid values."""
        valid_statuses = {"success", "error", "skipped"}
        
        for agent_name, contract in AGENT_CONTRACTS.items():
            status_desc = contract["trace_fields"]["status"]
            
            for status in valid_statuses:
                assert status in status_desc, f"{agent_name} missing '{status}' in status description"
        
        print(f"✅ All agents define valid status values: {valid_statuses}")
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT DOCUMENTATION
# ═══════════════════════════════════════════════════════════════════════════════

def print_contracts():
    """Print all agent contracts as documentation."""
    print("\n" + "=" * 80)
    print("  SIDEQUEST AGENT FIELD CONTRACTS")
    print("=" * 80)
    
    for agent_name, contract in AGENT_CONTRACTS.items():
        print(f"\n{'─' * 60}")
        print(f"  {agent_name.upper().replace('_', ' ')} AGENT")
        print(f"{'─' * 60}")
        
        print("\n  INPUTS:")
        for field, description in contract["inputs"].items():
            print(f"    • {field}: {description}")
        
        print("\n  OUTPUTS:")
        for field, description in contract["outputs"].items():
            print(f"    • {field}: {description}")
        
        if "output_structure" in contract:
            print("\n  OUTPUT STRUCTURE:")
            for field, description in contract["output_structure"].items():
                print(f"    • {field}: {description}")
        
        if "collision_structure" in contract:
            print("\n  COLLISION STRUCTURE:")
            for field, description in contract["collision_structure"].items():
                print(f"    • {field}: {description}")
    
    print("\n" + "=" * 80)
    print("  EXPERIENCE ITEM STRUCTURE")
    print("=" * 80)
    
    print("\n  REQUIRED FIELDS:")
    for field, description in EXPERIENCE_ITEM_CONTRACT["required_fields"].items():
        print(f"    • {field}: {description}")
    
    print("\n  OPTIONAL FIELDS:")
    for field, description in EXPERIENCE_ITEM_CONTRACT["optional_fields"].items():
        print(f"    • {field}: {description}")
    
    print("\n  VALID CATEGORIES:")
    for cat in EXPERIENCE_ITEM_CONTRACT["valid_categories"]:
        print(f"    • {cat}")
    
    print("\n" + "=" * 80 + "\n")


# ═══════════════════════════════════════════════════════════════════════════════
# RUN TESTS
# ═══════════════════════════════════════════════════════════════════════════════

def run_all_tests():
    """Run all contract validation tests."""
    print("\n" + "=" * 80)
    print("  AGENT FIELD CONTRACT VALIDATION")
    print("=" * 80)
    
    test_classes = [
        TestAgentContracts,
        TestDataFlowContracts,
        TestExperienceItemContract,
        TestTraceContracts,
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    for test_class in test_classes:
        print(f"\n{'─' * 60}")
        print(f"  {test_class.__name__}")
        print(f"{'─' * 60}")
        
        instance = test_class()
        
        for method_name in dir(instance):
            if method_name.startswith("test_"):
                total_tests += 1
                try:
                    getattr(instance, method_name)()
                    passed_tests += 1
                except AssertionError as e:
                    failed_tests.append(f"{test_class.__name__}.{method_name}: {e}")
                    print(f"❌ {method_name}: {e}")
                except Exception as e:
                    failed_tests.append(f"{test_class.__name__}.{method_name}: {type(e).__name__}: {e}")
                    print(f"❌ {method_name}: {type(e).__name__}: {e}")
    
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
    import argparse
    
    parser = argparse.ArgumentParser(description="Agent Field Contract Tests")
    parser.add_argument("--docs", action="store_true", help="Print contract documentation")
    args = parser.parse_args()
    
    if args.docs:
        print_contracts()
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
