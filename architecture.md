# Sidequest — System Architecture

## Overview

Sidequest uses a **Supervisor Pattern** (via LangGraph) to orchestrate 5 specialized Vertex AI agents. Each agent has a distinct role and uses the optimal Gemini model variant for its task.

## Agent Flow

```
┌──────────────────────────────────────────────────────────┐
│                     USER INPUT                           │
│  • Text query                                            │
│  • Instagram/YouTube URL                                 │
│  • Voice command                                         │
│  • Image upload                                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│           COORDINATOR (Supervisor)                        │
│  • Routes to appropriate agents                          │
│  • Manages shared state                                  │
│  • Synthesizes final narrative output                    │
│  • Model: Gemini 2.0 Flash (fast routing)               │
└──────┬───────────────────────────────────────────────────┘
       │
       │ Step 1: Discovery
       ▼
┌──────────────┐
│  DISCOVERY   │ Gemini Flash
│    AGENT     │ Find experiences from social media,
│              │ community, hyperlocal sources
└──────┬───────┘
       │
       │ Step 2: Parallel enrichment
       ├──────────────────────────┐
       ▼                          ▼
┌──────────────┐          ┌──────────────┐
│  CULTURAL    │          │  COMMUNITY   │
│  CONTEXT     │ Pro      │    AGENT     │ Flash
│    AGENT     │          │              │
│ Timing, dress│          │ Solo-sure,   │
│ transport    │          │ scaffolding  │
└──────┬───────┘          └──────┬───────┘
       │                          │
       └────────────┬─────────────┘
                    │
       │ Step 3: Narrative generation
                    ▼
          ┌──────────────┐
          │ PLOT-BUILDER │ Gemini Pro
          │    AGENT     │ Story arcs, lore,
          │              │ friction, collision
          └──────┬───────┘
                 │
       │ Step 4: Cost check
                 ▼
          ┌──────────────┐
          │   BUDGET     │ Gemini Flash
          │  OPTIMIZER   │ Costs, deals,
          │              │ booking urgency
          └──────┬───────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│               NARRATIVE ITINERARY                        │
│  • Story-driven arc (setup → friction → payoff)         │
│  • Cultural context per stop                            │
│  • Solo-sure indicators                                 │
│  • Lore & provenance                                    │
│  • Budget breakdown with deals                          │
│  • Collision suggestion (cross-pod)                     │
└──────────────────────────────────────────────────────────┘
```

## Model Assignment

| Agent | Model | Why |
|-------|-------|-----|
| Coordinator | Gemini 2.0 Flash | Fast routing decisions |
| Discovery | Gemini 2.0 Flash | Speed for multi-source search |
| Cultural Context | Gemini 2.0 Pro | Deep cultural reasoning |
| Plot-Builder | Gemini 2.0 Pro | Creative narrative generation |
| Budget Optimizer | Gemini 2.0 Flash | Fast numerical analysis |
| Community | Gemini 2.0 Flash | Pattern matching |

## State Schema

All agents share an `AgentState` TypedDict that flows through the pipeline:

```python
class AgentState(TypedDict):
    # User inputs
    user_query: str
    social_media_urls: list[str]
    city: str
    budget_range: tuple[int, int]
    solo_preference: bool
    interest_pods: list[str]

    # Agent outputs
    discovered_experiences: list[dict]
    cultural_context: dict
    narrative_itinerary: str
    budget_breakdown: dict
    social_scaffolding: dict
    collision_suggestion: dict

    # Metadata
    agent_trace: list[dict]
    errors: list[dict]
    session_id: str
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/generate-itinerary` | Generate narrative itinerary |
| GET | `/api/agent-trace/{session_id}` | Get agent execution trace |

## Deployment

- **Backend**: FastAPI on Railway/Cloud Run
- **Frontend**: Next.js on Vercel
- **AI**: Vertex AI (Google Cloud)
