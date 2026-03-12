# 🧭 Sidequest — Technical Implementation Pitch

> **Sidequest** turns "what should I do in Bangalore?" into a plot-first, narrative-driven itinerary — not a list of places, but a *story you walk into*. Under the hood, 5 specialized AI agents collaborate through a Coordinator pipeline, each with a distinct cognitive role, to transform a simple user query into a culturally-rich, budget-aware, solo-confident experience.

---

## 🏗️ Architecture at a Glance

```
                         ┌─────────────────────────────────┐
                         │        USER REQUEST              │
                         │  "Solo pottery workshop in       │
                         │   Bangalore under ₹2000"         │
                         └──────────────┬──────────────────┘
                                        │
                                        ▼
                         ┌──────────────────────────┐
                         │      COORDINATOR          │
                         │   (Supervisor Pattern)    │
                         │   State Init → Pipeline   │
                         └──────────┬───────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   STEP 1: DISCOVERY AGENT     │
                    │   🔍 Find 10-15 hyperlocal    │
                    │   experiences via Gemini 2.0   │
                    │   Flash + Geocoding API        │
                    │   ⏱️ ~2-3s                     │
                    └───────────────┬───────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
  │ STEP 2a: CULTURAL │ │ STEP 2b:          │ │ STEP 2c: BUDGET   │
  │ CONTEXT AGENT     │ │ COMMUNITY AGENT   │ │ OPTIMIZER AGENT   │
  │ 🏛️ India-specific │ │ 👥 Solo-sure      │ │ 💰 Cost analysis  │
  │ insider knowledge │ │ social scaffold   │ │ deals & tips      │
  │ Gemini 2.0 Pro    │ │ Gemini 2.0 Flash  │ │ Gemini 2.0 Flash  │
  │ ⏱️ ~2s            │ │ ⏱️ ~1.5s          │ │ ⏱️ ~1.5s          │
  └────────┬──────────┘ └────────┬──────────┘ └────────┬──────────┘
           └─────────────────────┼─────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  STEP 3: PLOT-BUILDER   │
                    │  📖 Narrative itinerary  │
                    │  with emotional arc      │
                    │  + collision suggestions  │
                    │  Gemini 2.0 Pro          │
                    │  ⏱️ ~3-4s               │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     API RESPONSE         │
                    │  ItineraryResponse       │
                    │  (narrative + data)       │
                    └──────────────────────────┘

              Total Pipeline Latency: ~6-8 seconds
```

---

## 📊 Tech Stack Summary

| Layer              | Technology                                          |
|--------------------|-----------------------------------------------------|
| **LLM Runtime**    | Gemini 2.0 Flash + Gemini 2.0 Pro (Vertex AI)      |
| **SDK (Discovery)**| `google.generativeai` (direct API, JSON mode)       |
| **SDK (Others)**   | `langchain-google-vertexai` (`ChatVertexAI`)        |
| **Orchestration**  | Custom `asyncio.gather()` supervisor (not LangGraph graph) |
| **API Framework**  | FastAPI (async)                                     |
| **State Mgmt**     | `TypedDict` shared state (pipeline pattern)         |
| **Geocoding**      | Google Geocoding API + in-memory cache + fallback   |
| **Schemas**        | Pydantic v2 (API models) + TypedDict (agent state)  |
| **Observability**  | Custom `AgentLogger` + `agent_trace[]` per session  |

---

## 🔍 Agent 1: Discovery Agent — Deep Dive

**File:** `backend/agents/discovery_agent.py` (527 lines)
**Model:** `gemini-2.0-flash` via `google.generativeai` SDK
**Temperature:** `0.4` | **Max Tokens:** `8,192`

### Internal Data Flow

```
User Query ──→ Date Parser ──→ Time Parser ──→ Interest Mapper ──→ Prompt Builder
                  │                │                  │                    │
                  ▼                ▼                  ▼                    ▼
          parse_date_from_query  parse_time_from_query  pod_mapping     user_prompt
          (today, tomorrow,      (morning, evening,   (food_nerd →       │
           this weekend,          7pm-9pm, etc.)       "food and         │
           next Saturday,                              drinks")          │
           Feb 15th, etc.)                                               │
                                                                         ▼
                                                         ┌──────────────────────┐
                                                         │  Gemini 2.0 Flash    │
                                                         │  response_mime_type:  │
                                                         │  "application/json"   │
                                                         └──────────┬───────────┘
                                                                    │
                                                                    ▼
                                                         JSON Parse → Date Filter
                                                                    │
                                                                    ▼
                                                         geocode_experiences()
                                                         (Google Geocoding API
                                                          + neighborhood fallback)
                                                                    │
                                                                    ▼
                                                         discovered_experiences[]
```

### 🔑 What Sources Does Discovery Use?

> **This is the key question.** The Discovery Agent currently operates on **Gemini's parametric knowledge** — the model's massive training corpus which includes:

| Source Type | How It's Used | Real-Time? |
|------------|---------------|------------|
| **Gemini Training Data** | Google Maps listings, business directories, travel blogs, food blogs, Instagram text, Reddit discussions, Zomato/Swiggy listings — all from Gemini's pre-training corpus | ❌ No — knowledge cutoff applies |
| **Google Geocoding API** | Real API call to convert location names → lat/lng coordinates for map display | ✅ Yes — live API |
| **Neighborhood Fallback DB** | Hardcoded coordinates for 26 Bangalore neighborhoods (in-memory dict) | ❌ Static |
| **System Prompt Curation** | Explicit exclusion list of 15+ overexposed venues (CTR, Toit, Cubbon Park Run Club, etc.) to force hidden gem discovery | ❌ Static |

#### What the `source` field actually means

When the Discovery Agent returns `"source": "instagram"` or `"source": "local_knowledge"` in each experience — **this is the LLM self-attributing** where it believes it learned about this place. It does NOT mean an actual API call was made to Instagram. The model is drawing from its training data which includes scraped Instagram captions, blog posts, and local guides.

```python
# The actual API call — note: NO external search tools are invoked
response = model.generate_content(
    user_prompt,
    generation_config={
        "temperature": 0.4,
        "response_mime_type": "application/json",  # Forces structured JSON
    },
    safety_settings=safety_settings  # Permissive for travel content
)
```

#### In-Memory Experience DB (Unused by Discovery Agent)

There is a separate `backend/tools/search.py` that contains a handcrafted **10-item Bangalore experience database** (`EXPERIENCE_DB`) with keyword-based search. This is a hackathon MVP stub — it's available via `search_experiences()` but is **not currently called** by the Discovery Agent. The agent relies entirely on Gemini generation.

#### Social Media Extraction (Stubbed)

`backend/tools/social_media.py` contains stubs for extracting experiences from Instagram Reels and YouTube URLs. These are **not yet functional** — they parse URL patterns but return empty `experiences[]` arrays with `"status": "stub"`. In production, these would use Gemini Vision to extract experience data from video frames.

### Smart Pre-Processing

The Discovery Agent has significant pre-processing logic *before* the LLM call:

**1. Date Parsing** (`parse_date_from_query`) — Handles:
- Relative dates: `"today"`, `"tomorrow"`, `"day after tomorrow"`
- Weekend references: `"this weekend"`, `"next weekend"`
- Day names: `"this Saturday"`, `"next Monday"`, just `"saturday"`
- Explicit dates: `"Feb 15"`, `"15th February"`, `"2/15/24"`
- Injects a date constraint into the prompt AND post-filters results by `operating_days`

**2. Time Parsing** (`parse_time_from_query`) — Handles:
- Natural language: `"morning"`, `"evening"`, `"nightlife"`
- Specific ranges: `"7pm-9pm"`
- Activity-based: `"breakfast"`, `"dinner"`, `"sunrise"`

**3. Duration Awareness** — If user specifies limited time (e.g., 4 hours):
- Caps single experience to `min(available/2, 3)` hours
- Instructs Gemini to return 2-4 quality experiences instead of 5-10

### Post-Processing Pipeline

After the Gemini response:

1. **JSON Parse** — Enforced by `response_mime_type: "application/json"`
2. **Operating Day Filter** — If date constraint detected, filters out experiences closed on that day
3. **Geocoding** — Calls `geocode_experiences()` which:
   - First tries: `"{experience_name}, {location}"` → Google Geocoding API
   - Fallback: Just `"{location}"` → Google Geocoding API
   - Fallback: Neighborhood name matching → hardcoded coords for 26 Bangalore areas
   - Ultimate fallback: Bangalore city center `(12.9716, 77.5946)`
   - Uses in-memory cache with 24-hour TTL to minimize API calls
4. **Metadata Injection** — Adds `search_metadata` with agent info, filters applied

---

## 🏛️ Agent 2: Cultural Context Agent — Deep Dive

**File:** `backend/agents/cultural_context_agent.py` (122 lines)
**Model:** `gemini-2.0-pro` via `langchain-google-vertexai` (`ChatVertexAI`)
**Temperature:** `0.4` | **Max Tokens:** `2,048`

### What It Does

Takes the raw `discovered_experiences[]` from Agent 1 and adds **6 layers of India-specific cultural intelligence** that no travel API provides:

```
discovered_experiences[] ──→ Gemini Pro ──→ cultural_context{}
                                           (keyed by experience name)
```

### The 6 Cultural Layers (per experience)

| Layer | Field | Example Output |
|-------|-------|----------------|
| **When** | `optimal_timing` | "9-11am is peak coffee culture in Malleswaram. Go at 7:30 AM to skip the queue." |
| **Wear** | `dress_code_and_etiquette` | "Temple adjacent — cover shoulders. For pottery, wear clothes you don't mind staining." |
| **Move** | `transport_hacks` | "Auto from Indiranagar: ₹80 negotiated, ₹120 if you don't. Or metro to MG Road + walk." |
| **Social** | `social_norms` | "Solo dining is normal here. Counter seating is the solo traveler's friend." |
| **Sacred** | `religious_cultural_considerations` | "If visiting during Ramadan, cafes near mosques may have reduced hours." |
| **Safe** | `safety_and_accessibility` | "Well-lit until 10 PM. Women-solo-friendly. No wheelchair ramp." |

### Internal Architecture

- Uses **`ChatVertexAI`** (LangChain adapter for Vertex AI) — not the raw `google.generativeai` SDK
- **Async execution** via `await model.ainvoke(messages)` — allows parallel execution with the Community Agent
- **System/Human message pattern** — structured prompting via LangChain's `SystemMessage` + `HumanMessage`
- **JSON stripping** — Uses `strip_markdown_json()` helper because Vertex AI responses sometimes wrap JSON in markdown code fences (``` ```json ... ``` ```)
- **Graceful degradation** — If the agent fails, `cultural_context` defaults to `{}` and the pipeline continues

### Why Gemini Pro?

Cultural reasoning requires nuance that Flash struggles with. Understanding dress code hierarchies (temple vs. workshop vs. fine dining), negotiation norms (auto-rickshaws), and religious timing sensitivities benefits from Pro's deeper reasoning capabilities.

---

## 👥 Agent 3: Community Agent — Deep Dive

**File:** `backend/agents/community_agent.py` (134 lines)
**Model:** `gemini-2.0-flash` via `langchain-google-vertexai` (`ChatVertexAI`)
**Temperature:** `0.2` | **Max Tokens:** `2,048`

### The Solo-Sure System

This agent answers the question every solo traveler asks but no app answers: **"Will I feel awkward going alone?"**

```
discovered_experiences[] ──→ Gemini Flash ──→ social_scaffolding{}
                                              (keyed by experience name)
```

### Output Per Experience

| Field | Type | What It Tells You |
|-------|------|-------------------|
| `solo_friendly` | `boolean` | Can you show up alone without it being weird? |
| `solo_percentage` | `string` | "40% come solo" — normalizes the behavior |
| `scaffolding` | `string` | *How* the environment helps you connect: counter seating, shared tables, structured intros |
| `arrival_vibe` | `string` | What the first 5 minutes feel like alone: "Autonomous confidence" vs "Initial awkwardness" |
| `beginner_energy` | `string` | Low/Medium/High — is the crowd welcoming to newcomers? |

### Why Low Temperature (0.2)?

Solo assessments need *consistency*. If we say a pottery workshop is "High beginner_energy" on Monday but "Low" on Thursday for the same prompt, we've broken user trust. The low temperature ensures reliable, repeatable social assessments.

### Parallel Execution

This agent runs **simultaneously** with the Cultural Context Agent and Budget Agent via `asyncio.gather()`:

```python
results = await asyncio.gather(
    run_cultural_context(dict(state)),   # Step 2a
    run_community(dict(state)),          # Step 2b
    run_budget_optimizer(dict(state)),   # Step 2c
    return_exceptions=True
)
```

Each receives a **copy** of the state (`dict(state)`) to prevent mutation conflicts.

---

## 📖 Agent 4: Plot-Builder Agent — Deep Dive

**File:** `backend/agents/plot_builder_agent.py` (187 lines)
**Model:** `gemini-2.0-pro` via `langchain-google-vertexai` (`ChatVertexAI`)
**Temperature:** `0.7` | **Max Tokens:** `8,192`

### The Core Differentiator

This is **why Sidequest exists**. Every other travel app gives you a list. This agent gives you a *story*.

```
discovered_experiences[]  ──┐
cultural_context{}          ├──→ Gemini Pro (creative) ──→ narrative_itinerary (string)
social_scaffolding{}        │                              collision_suggestion (object)
time_available_hours        │
start_time                 ─┘
```

### The Storytelling Framework

Every narrative follows the **Setup → Friction → Payoff** arc:

| Act | What Happens | Example |
|-----|-------------|---------|
| **Setup** | Hook + first experience. Sensory language. | "The lane behind Malleswaram 18th Cross smells different at 7 AM. Ghee, jaggery, and something you can't name yet…" |
| **Friction** | Intentional discomfort that creates memories. | "The queue wraps around the building. 30 minutes. But this is the point — the aunty ahead of you will tell you what to order." |
| **Payoff** | Emotional resolution. | "When the dosa arrives — crisp, golden, drowning in butter — you understand why people have been coming here since 1920." |

### Additional Narrative Principles

- **Lore Layering** — Every stop has backstory: "Invented rava idli during WWII rice shortage"
- **Collision Suggestions** — Cross-pod pairings: "Pottery + filter coffee + live Carnatic music = 'The Artisan Morning'"
- **Time-Fluid Design** — Dawn and evening stops in the same itinerary
- **Solo-Sure Integration** — Weaves social scaffolding into the narrative: "Counter seating — conversation happens organically"

### Time Constraint Intelligence

The Plot-Builder does real time math:
```python
start_hour = int(user_start_time.split(':')[0])
end_hour = start_hour + int(time_available)
```

It selects 2-4 experiences that physically fit within the user's time window, including 15-30 min transit time between stops.

### Why Highest Temperature (0.7)?

Creative writing needs variability. We *want* each narrative to feel fresh, not templated. The Pro model at 0.7 temperature produces evocative, voice-rich copy that reads like a travel writer's secret recommendation.

---

## 💰 Agent 5: Budget Optimizer Agent — Deep Dive

**File:** `backend/agents/budget_agent.py` (172 lines)
**Model:** `gemini-2.0-flash` via `langchain-google-vertexai` (`ChatVertexAI`)
**Temperature:** `0.1` | **Max Tokens:** `2,048`

### What It Actually Computes

Goes beyond "ticket price" to calculate the *real* cost of an experience:

```
discovered_experiences[]  ──┐
budget_range (min, max)     ├──→ Gemini Flash ──→ budget_breakdown{}
num_people                  │
city                       ─┘
```

### Output Schema

```json
{
  "budget_breakdown": {
    "total_estimate": 1850,
    "breakdown": [
      {"experience": "Pottery Workshop", "cost": 800, "type": "workshop", "booking_required": "2 days ahead"},
      {"experience": "Heritage Walk", "cost": 300, "type": "guided_tour"},
      {"experience": "Filter Coffee + Dosa", "cost": 250, "type": "food"},
      {"experience": "Transport (3 auto rides)", "cost": 500, "type": "transport"}
    ],
    "deals": ["BNPL available via Simpl for workshop", "10% off heritage walk with student ID"],
    "tips": ["Take metro from MG Road to Malleswaram — save ₹150", "Carry cash — most darshinis don't accept UPI"],
    "within_budget": true
  }
}
```

### Post-Processing Validation

The agent performs a critical **server-side override** of the LLM's budget assessment:

```python
# Override LLM's within_budget if it's incorrect
actual_within_budget = total_estimate <= budget_max
if budget_breakdown.get("within_budget") != actual_within_budget:
    budget_breakdown["within_budget"] = actual_within_budget
    if not actual_within_budget:
        tips.insert(0, f"⚠️ Over budget by ₹{overage}. Consider dropping or substituting...")
```

This is a **guardrail against LLM hallucination** — the model sometimes incorrectly self-reports `within_budget: true` when totals exceed the max. The deterministic check catches this.

### Why Lowest Temperature (0.1)?

Budget numbers must be accurate and consistent. At temperature 0.1, the model produces nearly deterministic outputs for the same inputs — critical for cost estimates where ₹100 variance could break user trust.

---

## 🎯 Coordinator (Supervisor) — Deep Dive

**File:** `backend/agents/coordinator.py` (212 lines)
**Execution:** Custom `asyncio` orchestration (NOT using LangGraph `StateGraph`)

### The Optimized Pipeline

The coordinator runs a **3-step pipeline** (optimized from the original 4-step):

```
Step 1: Discovery           ← Sequential (everyone depends on this)
    │
    ├── Step 2a: Cultural Context  ┐
    ├── Step 2b: Community         ├── ALL PARALLEL via asyncio.gather()
    └── Step 2c: Budget Optimizer  ┘
    │
Step 3: Plot-Builder         ← Sequential (needs 2a + 2b output)
```

**Latency Optimization:** Budget was originally Step 4 (after Plot-Builder). Moving it to run in parallel with Step 2 saves ~1.5-2 seconds because Budget only needs `discovered_experiences[]`, not the narrative.

### State Management

```python
state = _create_initial_state(request)  # ItineraryRequest → AgentState (TypedDict)

# Parallel agents get state COPIES to prevent mutation conflicts
results = await asyncio.gather(
    run_cultural_context(dict(state)),  # copy
    run_community(dict(state)),         # copy
    run_budget_optimizer(dict(state)),  # copy
    return_exceptions=True              # fault tolerance
)

# Results are merged back into the canonical state
state["cultural_context"] = cultural_state.get("cultural_context", {})
state["social_scaffolding"] = community_state.get("social_scaffolding", {})
state["budget_breakdown"] = budget_state.get("budget_breakdown", {})
```

### Fault Tolerance

If ANY parallel agent throws an exception:
- The exception is caught and logged to `state["errors"]`
- The failed agent's output defaults to `{}`
- The pipeline **continues** — the Plot-Builder works with whatever data is available
- No single agent failure kills the entire request

### Observability: Agent Trace

Every execution records a full trace:

```json
{
  "agent_trace": [
    {"agent": "coordinator", "status": "started", "timestamp": "..."},
    {"agent": "discovery", "status": "success", "experiences_found": 12, "latency_ms": 2340},
    {"agent": "cultural_context", "status": "success", "contexts_added": 12, "latency_ms": 1890},
    {"agent": "community", "status": "success", "experiences_analyzed": 12, "latency_ms": 1540},
    {"agent": "budget", "status": "success", "total_estimate": 1850, "within_budget": true, "latency_ms": 1230},
    {"agent": "plot_builder", "status": "success", "narrative_length": 2840, "latency_ms": 3450},
    {"agent": "coordinator", "status": "completed", "total_latency_ms": 7120, "agents_succeeded": 5}
  ]
}
```

Retrievable via `GET /api/agent-trace/{session_id}`.

---

## 🧬 Shared State Schema

The `AgentState` TypedDict is the **single source of truth** flowing through all agents:

```python
class AgentState(TypedDict):
    # ── User Inputs ──
    user_query: str                     # "Solo pottery workshop under ₹2000"
    social_media_urls: list[str]        # Instagram/YouTube URLs (stubbed)
    city: str                           # "Bangalore"
    budget_range: tuple[int, int]       # (500, 2000)
    num_people: int                     # 1
    solo_preference: bool               # True
    interest_pods: list[str]            # ["craft_explorer", "food_nerd"]
    crowd_preference: str               # "relatively_niche"
    start_date: str                     # "2026-02-15"
    end_date: str                       # "2026-02-15"
    time_available_hours: float         # 4.0
    start_time: str                     # "14:00"

    # ── Agent Outputs ──
    discovered_experiences: list[dict]  # Agent 1 output (10-15 experiences)
    cultural_context: dict              # Agent 2 output (keyed by experience name)
    narrative_itinerary: str            # Agent 4 output (story text)
    budget_breakdown: dict              # Agent 5 output (costs + deals)
    social_scaffolding: dict            # Agent 3 output (solo-sure data)
    collision_suggestion: dict          # Agent 4 output (cross-pod pairing)

    # ── Metadata ──
    agent_trace: list[dict]             # Execution traces for observability
    errors: list[dict]                  # Error log
    session_id: str                     # UUID for trace retrieval
```

---

## ⚙️ Model Configuration Matrix

| Agent | Model | Temperature | Max Tokens | Why This Configuration |
|-------|-------|-------------|------------|------------------------|
| **Discovery** | `gemini-2.0-flash` | 0.4 | 8,192 | Speed for first response + creative enough for diverse suggestions |
| **Cultural Context** | `gemini-2.0-pro` | 0.4 | 2,048 | Deep reasoning for cultural nuance — flash misses subtlety |
| **Community** | `gemini-2.0-flash` | 0.2 | 2,048 | Pattern matching (solo-friendly?) doesn't need Pro. Low temp for consistency |
| **Plot-Builder** | `gemini-2.0-pro` | 0.7 | 8,192 | Creative writing needs Pro's quality + high temperature + long output |
| **Budget** | `gemini-2.0-flash` | 0.1 | 2,048 | Numerical analysis — flash is sufficient. Near-deterministic for accuracy |
| **Coordinator** | `gemini-2.0-flash` | 0.1 | 1,024 | Fast routing (currently unused — orchestration is code-driven, not LLM-driven) |

> **Pro models** (`gemini-2.0-pro`) are configurable via `VERTEX_PRO_MODEL` env var. Currently defaults to `gemini-2.0-flash` as fallback if Pro is unavailable.

---

## 🚀 Can We Deploy These Agents on Vertex AI?

**Short answer: Yes — 4 out of 5 agents already use Vertex AI, and the 5th can be migrated easily.**

### Current Deployment Status

| Agent | Current SDK | Vertex AI Ready? | Migration Effort |
|-------|------------|-------------------|-----------------|
| **Cultural Context** | `langchain-google-vertexai` (`ChatVertexAI`) | ✅ Already on Vertex | None |
| **Community** | `langchain-google-vertexai` (`ChatVertexAI`) | ✅ Already on Vertex | None |
| **Plot-Builder** | `langchain-google-vertexai` (`ChatVertexAI`) | ✅ Already on Vertex | None |
| **Budget Optimizer** | `langchain-google-vertexai` (`ChatVertexAI`) | ✅ Already on Vertex | None |
| **Discovery** | `google.generativeai` (direct API) | ⚠️ Uses AI Studio API | ~30 min migration |

### Why Discovery Uses a Different SDK

The Discovery Agent was built first as a standalone prototype using the `google.generativeai` SDK (AI Studio). It was never migrated to `langchain-google-vertexai` because:
1. It uses `response_mime_type: "application/json"` for forced JSON output — which works natively with the generativeai SDK
2. It's synchronous (`def` not `async def`) — different execution model
3. "If it ain't broke, don't fix it" during hackathon velocity

### Migration Path: Discovery Agent → Vertex AI

```python
# CURRENT (google.generativeai — AI Studio)
import google.generativeai as genai
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
model = genai.GenerativeModel(model_name="models/gemini-2.0-flash", ...)
response = model.generate_content(prompt, generation_config={
    "response_mime_type": "application/json"
})

# MIGRATED (langchain-google-vertexai — Vertex AI)
from langchain_google_vertexai import ChatVertexAI
model = ChatVertexAI(
    model_name="gemini-2.0-flash",
    temperature=0.4,
    max_output_tokens=8192,
    project=settings.google_cloud_project,
    location=settings.google_cloud_location,
    response_mime_type="application/json",  # Supported in ChatVertexAI
)
response = await model.ainvoke(messages)  # Now async like other agents
```

### Full Vertex AI Deployment Options

#### Option 1: Cloud Run (Recommended for MVP → Production)

Deploy the FastAPI backend as a containerized Cloud Run service. All agents already use Vertex AI models — they just need the right IAM permissions.

```
┌──────────────────────────────────────────────────────┐
│                    Cloud Run                          │
│  ┌─────────────────────────────────────────────────┐ │
│  │  FastAPI Container                               │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐         │ │
│  │  │Discovery│ │ Cultural │ │Community │ ...      │ │
│  │  │ Agent   │ │ Context  │ │ Agent    │          │ │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘         │ │
│  │       │           │            │                │ │
│  │       └───────────┼────────────┘                │ │
│  │                   ▼                              │ │
│  │           Vertex AI Gemini API                   │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Pros:** Simple, auto-scaling, pay-per-use, native Vertex AI access via service account
**Requirements:** Application Default Credentials (ADC), Cloud Run service account with `roles/aiplatform.user`

#### Option 2: Vertex AI Agent Builder (Future)

Deploy each agent as a Vertex AI Agent with:
- **Vertex AI Reasoning Engine** — Manages agent orchestration
- **Vertex AI Extensions** — Google Search grounding, Maps API integration
- **Vertex AI Evaluation** — Automated quality metrics per agent

This unlocks **Google Search grounding** for the Discovery Agent — solving the "no real-time sources" limitation by letting Gemini search live Google results.

#### Option 3: Vertex AI Pipelines (Batch/Scheduled)

For pre-generating experience databases:
- Run Discovery Agent nightly for top 10 Indian cities
- Cache results in Firestore/Cloud SQL
- Serve cached experiences for instant responses, agent pipeline for personalization

### Infrastructure Requirements for Vertex Deployment

| Requirement | Current Status | Needed |
|------------|---------------|--------|
| Google Cloud Project | ✅ Configured via `GOOGLE_CLOUD_PROJECT` env var | — |
| Vertex AI API | ✅ 4 agents already using it | Enable for project |
| ADC / Service Account | ⚠️ Needs `gcloud auth application-default login` | Service account in prod |
| `gemini-2.0-flash` access | ✅ Available | — |
| `gemini-2.0-pro` access | ⚠️ Falls back to flash if unavailable | Request access |
| Google Geocoding API | ✅ Uses `GOOGLE_API_KEY` | Same key or Maps SA |
| Cloud Run / GKE | ❌ Not yet deployed | Set up for prod |

---

## 🗺️ Roadmap: From Hackathon → Production

### Phase 1: Vertex Deployment (Week 1)
- [x] Migrate 4/5 agents to Vertex AI (already done)
- [ ] Migrate Discovery Agent from `google.generativeai` → `ChatVertexAI`
- [ ] Deploy FastAPI on Cloud Run with Vertex AI ADC
- [ ] Set up CI/CD (Cloud Build → Cloud Run)

### Phase 2: Real-Time Data Sources (Week 2-3)
- [ ] Add **Google Search Grounding** to Discovery Agent via Vertex AI extensions
- [ ] Implement Instagram Reel extraction (Gemini Vision for video frames)
- [ ] Add YouTube transcript extraction + experience mining
- [ ] Integrate Google Places API for real-time ratings/hours/crowd data

### Phase 3: Scale & Optimize (Week 3-4)
- [ ] Pre-cache experiences via Vertex AI Pipelines (nightly batch for top cities)
- [ ] Add Gemini embeddings + Cloud SQL pgvector for semantic search
- [ ] Implement response streaming (SSE) for progressive UI updates
- [ ] Add Vertex AI Evaluation for automated agent quality metrics

---

*Last updated: 2026-02-14*
