"""
Sidequest Backend — Mock Agent Testing CLI

Test agent workflow without Vertex AI using mock data.
Useful for testing the flow and data dumping without API calls.
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path

from state.schemas import AgentState


def create_sources_directory():
    """Create sources/ directory if it doesn't exist."""
    sources_dir = Path("sources")
    sources_dir.mkdir(exist_ok=True)
    return sources_dir


def save_discovery_results(experiences: list, session_id: str, sources_dir: Path):
    """Save discovery agent results to sources/ directory."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"discovery_mock_{session_id[:8]}_{timestamp}.json"
    filepath = sources_dir / filename
    
    data = {
        "session_id": session_id,
        "timestamp": datetime.now().isoformat(),
        "experiences_count": len(experiences),
        "experiences": experiences,
        "note": "Mock data for testing"
    }
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n📁 Mock discovery results saved to: {filepath}")
    return filepath


def get_mock_experiences():
    """Generate mock experiences for testing."""
    return [
        {
            "name": "Clay Station Pottery Workshop",
            "category": "craft",
            "timing": "Weekday evenings 6-8 PM",
            "budget": 1500,
            "location": "Indiranagar, Bangalore",
            "solo_friendly": True,
            "source": "instagram_@claystation_blr",
            "description": "Beginner-friendly pottery wheel session. Small batches of 4-6 people. Instructor Priya guides you through centering clay and shaping your first bowl. Take home your creation after firing.",
            "lore": "Started by a former tech professional who quit to pursue ceramics full-time"
        },
        {
            "name": "Third Wave Coffee Roasters - Koramangala",
            "category": "food",
            "timing": "Morning 8-11 AM for fresh roasts",
            "budget": 400,
            "location": "Koramangala, Bangalore",
            "solo_friendly": True,
            "source": "local_knowledge",
            "description": "Single-origin pour-overs and espresso. Baristas explain bean origins. Community table perfect for solo visitors. Try the Chikmagalur estate beans.",
            "lore": "One of India's first specialty coffee roasters, pioneered the third wave movement"
        },
        {
            "name": "Jayanagar Walking Food Tour",
            "category": "food",
            "timing": "Saturday mornings 9 AM",
            "budget": 800,
            "location": "Jayanagar, Bangalore",
            "solo_friendly": True,
            "source": "blog_bangalorebites",
            "description": "Heritage South Indian breakfast trail. Visit 5 iconic eateries: dosa, idli, filter coffee. Guide shares stories of 50-year-old establishments.",
            "lore": "Covers restaurants that have been family-run for three generations"
        },
        {
            "name": "Rangoli Metro Art Gallery",
            "category": "art",
            "timing": "Anytime during metro hours",
            "budget": 50,
            "location": "MG Road Metro Station, Bangalore",
            "solo_friendly": True,
            "source": "local_knowledge",
            "description": "Free art installations in metro station. Rotating exhibits by local artists. Perfect for a quick cultural stop between activities.",
            "lore": "Part of Namma Metro's initiative to make public transport spaces cultural hubs"
        },
        {
            "name": "Cubbon Park Heritage Walk",
            "category": "heritage",
            "timing": "Sunday mornings 7 AM",
            "budget": 200,
            "location": "Cubbon Park, Bangalore",
            "solo_friendly": True,
            "source": "instagram_@bangalorewalks",
            "description": "Guided walk through 150-year-old park. Learn about colonial architecture, rare trees, and park's role in city history. Group of 15-20 people.",
            "lore": "Named after Sir Mark Cubbon, British commissioner who expanded the park in 1870s"
        },
        {
            "name": "Atta Galatta Bookstore Cafe",
            "category": "networking",
            "timing": "Weekday afternoons 3-6 PM",
            "budget": 300,
            "location": "Koramangala, Bangalore",
            "solo_friendly": True,
            "source": "local_knowledge",
            "description": "Independent bookstore with cafe. Regular author events and book clubs. Solo-friendly atmosphere with communal seating. Great for meeting fellow readers.",
            "lore": "Founded by former Flipkart employees passionate about indie publishing"
        }
    ]


async def mock_discovery_agent(state: AgentState) -> AgentState:
    """Mock discovery agent."""
    print("🔍 Running Discovery Agent (MOCK)...")
    await asyncio.sleep(0.5)  # Simulate API call
    
    experiences = get_mock_experiences()
    state["discovered_experiences"] = experiences
    state["agent_trace"].append({
        "agent": "discovery",
        "status": "success",
        "experiences_found": len(experiences),
        "latency_ms": 500,
        "timestamp": datetime.now().isoformat(),
        "note": "Mock data"
    })
    
    print(f"   ✅ Found {len(experiences)} experiences")
    return state


async def mock_cultural_context_agent(state: AgentState) -> AgentState:
    """Mock cultural context agent."""
    print("🌍 Running Cultural Context Agent (MOCK)...")
    await asyncio.sleep(0.3)
    
    state["cultural_context"] = {
        "local_customs": "Bangalore is known for its cafe culture and tech community",
        "best_times": "Avoid peak traffic hours (8-10 AM, 6-8 PM)",
        "language_tips": "English widely spoken, Kannada appreciated",
        "etiquette": "Remove shoes before entering workshops, tip 10% at cafes"
    }
    state["agent_trace"].append({
        "agent": "cultural_context",
        "status": "success",
        "latency_ms": 300,
        "timestamp": datetime.now().isoformat(),
    })
    
    print("   ✅ Cultural context added")
    return state


async def mock_community_agent(state: AgentState) -> AgentState:
    """Mock community agent."""
    print("👥 Running Community Agent (MOCK)...")
    await asyncio.sleep(0.3)
    
    state["social_scaffolding"] = {
        "solo_tips": "All selected experiences have communal seating or small group settings",
        "conversation_starters": "Ask about the craft/food origin stories",
        "safety": "All locations are in well-lit, populated areas"
    }
    state["agent_trace"].append({
        "agent": "community",
        "status": "success",
        "latency_ms": 300,
        "timestamp": datetime.now().isoformat(),
    })
    
    print("   ✅ Social scaffolding added")
    return state


async def mock_plot_builder_agent(state: AgentState) -> AgentState:
    """Mock plot builder agent."""
    print("📖 Running Plot-Builder Agent (MOCK)...")
    await asyncio.sleep(0.4)
    
    state["narrative_itinerary"] = """Your Bangalore Craft & Coffee Journey

Morning: Begin at Third Wave Coffee Roasters (8 AM) - Start your day understanding India's specialty coffee revolution. The baristas here are storytellers as much as craftspeople.

Mid-Morning: Join the Jayanagar Walking Food Tour (9 AM) - Trace the breakfast traditions of old Bangalore. Each dosa has a story, each filter coffee a legacy.

Afternoon: Quick cultural stop at Rangoli Metro Art Gallery (12 PM) - See how Bangalore weaves art into everyday spaces.

Late Afternoon: Atta Galatta Bookstore (3 PM) - Decompress with a book and chai. Strike up conversations with fellow readers.

Evening: Clay Station Pottery Workshop (6 PM) - End your day creating something with your hands. The clay remembers your touch, just as you'll remember this day.

Optional: Cubbon Park Heritage Walk (next Sunday morning) - If you're staying longer, this walk connects all the threads of Bangalore's past and present.

This isn't just a list of places - it's a story of craft, community, and discovery."""

    state["agent_trace"].append({
        "agent": "plot_builder",
        "status": "success",
        "latency_ms": 400,
        "timestamp": datetime.now().isoformat(),
    })
    
    print("   ✅ Narrative created")
    return state


async def mock_budget_agent(state: AgentState) -> AgentState:
    """Mock budget agent."""
    print("💰 Running Budget Optimizer Agent (MOCK)...")
    await asyncio.sleep(0.2)
    
    experiences = state.get("discovered_experiences", [])
    total = sum(exp.get("budget", 0) for exp in experiences)
    
    state["budget_breakdown"] = {
        "total_estimate": total,
        "breakdown": [
            {"item": exp.get("name"), "cost": exp.get("budget", 0)}
            for exp in experiences
        ],
        "deals": [
            "Book pottery workshop 3 days in advance for 10% off",
            "Metro day pass (₹100) covers unlimited travel"
        ],
        "within_budget": total <= state["budget_range"][1]
    }
    
    state["agent_trace"].append({
        "agent": "budget",
        "status": "success",
        "latency_ms": 200,
        "timestamp": datetime.now().isoformat(),
    })
    
    print(f"   ✅ Budget calculated: ₹{total}")
    return state


async def run_mock_workflow():
    """Run the mock agent workflow."""
    print("\n" + "="*60)
    print("  SIDEQUEST MOCK AGENT TESTING")
    print("="*60 + "\n")
    
    # Create initial state
    state = AgentState(
        user_query="Solo-friendly pottery workshop and artisan coffee experiences in Bangalore",
        social_media_urls=[],
        city="Bangalore",
        budget_range=(500, 3000),
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
        session_id="mock_" + datetime.now().strftime("%Y%m%d%H%M%S"),
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
    
    # Print results
    print("\n" + "="*60)
    print("  RESULTS")
    print("="*60 + "\n")
    
    print("📖 NARRATIVE ITINERARY:\n")
    print(state["narrative_itinerary"])
    
    print("\n" + "─"*60 + "\n")
    print("💰 BUDGET BREAKDOWN:\n")
    budget = state["budget_breakdown"]
    print(f"Total: ₹{budget['total_estimate']}")
    print(f"Within Budget: {'✅' if budget['within_budget'] else '❌'}")
    
    print("\n" + "─"*60 + "\n")
    print("📊 AGENT TRACE:\n")
    for trace in state["agent_trace"]:
        status_icon = "✅" if trace["status"] == "success" else "❌"
        print(f"{status_icon} {trace['agent'].upper()}: {trace['latency_ms']}ms")
    
    print("\n" + "="*60)
    print("  ✅ MOCK TEST COMPLETED")
    print("="*60 + "\n")


if __name__ == "__main__":
    print("\n🚀 Starting Mock Agent Testing (No Vertex AI required)\n")
    asyncio.run(run_mock_workflow())
