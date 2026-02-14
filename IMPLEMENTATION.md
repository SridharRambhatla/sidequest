# Sidequest: Implementation Details

> **Plot-First Experience Discovery Platform**  
> Google Gemini Hackathon 2026

---

## Executive Summary

Sidequest transforms how people plan experiences by creating **narrative-driven, culturally-grounded itineraries** instead of generic lists. Five specialized AI agents collaborate to turn a simple query or Instagram reel into a story-driven day plan with cultural context, solo-friendliness scores, and realistic budgets.

---

## Problem Statement

| Pain Point | Current Reality |
|------------|-----------------|
| **Inspiration → Action Gap** | Social media shows amazing experiences but doesn't convert to actionable plans |
| **Generic Recommendations** | Travel apps produce boring chronological lists without soul or local insight |
| **Solo Traveler Anxiety** | No confidence indicators for experiencing places alone |
| **Missing Cultural Context** | Generic tips miss India-specific nuances (timing, dress codes, transport hacks) |

---

## Solution: Plot-First Itineraries

Instead of "Here are 5 places to visit," Sidequest delivers:

> *"At dawn, the flower market awakens. You'll navigate through marigold mountains, bargaining in half-Hindi. The friction of a 20-minute queue becomes the payoff — your own jasmine garland, hand-strung."*

Every experience becomes a **story with setup, friction, and payoff**.

---

## System Architecture

### High-Level Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER INPUT                                  │
│         (Text Query / Instagram Reel URL / Interest Selection)        │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND                                │
│                     (/api/generate-itinerary)                         │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    LANGGRAPH COORDINATOR                              │
│              (Supervisor Pattern Orchestration)                       │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    STAGE 1: Discovery                            │ │
│  │              ┌────────────────────────┐                          │ │
│  │              │   DISCOVERY AGENT      │                          │ │
│  │              │   (Gemini 2.0 Flash)   │                          │ │
│  │              │   Finds 5-10 hidden    │                          │ │
│  │              │   gems & experiences   │                          │ │
│  │              └────────────────────────┘                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              STAGE 2: Enrichment (PARALLEL)                      │ │
│  │                                                                   │ │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │ │
│  │  │ CULTURAL CONTEXT │ │ COMMUNITY AGENT  │ │ BUDGET OPTIMIZER │ │ │
│  │  │     AGENT        │ │ (Solo-Sure)      │ │     AGENT        │ │ │
│  │  │ (Gemini Pro)     │ │ (Gemini Flash)   │ │ (Gemini Flash)   │ │ │
│  │  │                  │ │                  │ │                  │ │ │
│  │  │ • Timing tips    │ │ • Solo % score   │ │ • Cost estimate  │ │ │
│  │  │ • Dress codes    │ │ • Social cues    │ │ • Deals finder   │ │ │
│  │  │ • Transport hacks│ │ • Arrival vibe   │ │ • Booking urgency│ │ │
│  │  │ • Safety info    │ │ • Beginner energy│ │ • Saving tips    │ │ │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    STAGE 3: Narrative                            │ │
│  │              ┌────────────────────────┐                          │ │
│  │              │   PLOT-BUILDER AGENT   │                          │ │
│  │              │     (Gemini Pro)       │                          │ │
│  │              │                        │                          │ │
│  │              │ Weaves all data into   │                          │ │
│  │              │ narrative itinerary    │                          │ │
│  │              │ with story arcs        │                          │ │
│  │              └────────────────────────┘                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS FRONTEND                                 │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  Interactive │  │   Google     │  │   Budget     │               │
│  │   Timeline   │  │    Maps      │  │  Breakdown   │               │
│  │  (Drag/Drop) │  │  (Routes)    │  │   (Charts)   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## The Five AI Agents

### 1. Discovery Agent
**Model:** Gemini 2.0 Flash (optimized for speed)

**Purpose:** Finds 5-10 compelling experiences from hyperlocal sources that aren't easily found on Google Maps.

**Output:**
- Experience name and description
- Category classification (food, craft, heritage, etc.)
- Optimal timing windows
- Budget estimate in INR
- Location with geocoding
- Solo-friendliness flag

**Special Capability:** Focuses on "hidden gems" — that pottery studio in a bylane, the 5 AM flower market, the filter coffee walk only locals know.

---

### 2. Cultural Context Agent
**Model:** Gemini Pro (deep reasoning)

**Purpose:** Adds India-specific localization that goes far beyond translation.

**Output per Experience:**
| Dimension | Example |
|-----------|---------|
| **Optimal Timing** | "Arrive 6:30 AM — flower sellers start packing by 8" |
| **Dress Code** | "Cover shoulders for temple entry; leave shoes at door" |
| **Transport Hacks** | "Auto negotiation: Start ₹50 below meter, they expect bargaining" |
| **Social Norms** | "Photography OK outside, ask before capturing vendors" |
| **Safety Info** | "Well-lit until 10 PM; female-friendly neighborhood" |

---

### 3. Community Agent (Solo-Sure)
**Model:** Gemini Flash (pattern matching)

**Purpose:** Quantifies solo-friendliness with actionable social scaffolding.

**Output per Experience:**
| Metric | Description | Example |
|--------|-------------|---------|
| **Solo Percentage** | What % of visitors come alone | "60% come alone" |
| **Social Scaffolding** | Physical/social cues that help solos connect | "Counter seating enables easy conversation with barista" |
| **Arrival Vibe** | Emotional state of walking in alone | "Autonomous confidence — locals respect solo diners" |
| **Beginner Energy** | Intimidation level for first-timers | Low / Medium / High |

---

### 4. Plot-Builder Agent
**Model:** Gemini Pro (creative writing)

**Purpose:** The core innovation — transforms data into narrative itineraries with emotional arcs.

**Storytelling Principles:**
| Principle | Implementation |
|-----------|----------------|
| **Setup → Friction → Payoff** | Every experience has an emotional arc with intentional tension |
| **Intentional Friction** | Queueing, walking, effort become memory-making moments |
| **Lore Layering** | Backstory and provenance for each stop ("This shop survived three generations...") |
| **Collision Suggestions** | Mix interest categories for serendipity ("Pottery + filter coffee walk: Creative hands meet contemplative minds") |

**Output:**
- Full narrative text for each experience
- Transition copy between stops
- Collision suggestions for unexpected pairings
- Overall day arc with thematic coherence

---

### 5. Budget Optimizer Agent
**Model:** Gemini Flash (numerical analysis)

**Purpose:** Provides cost transparency and discovers deals.

**Output:**
| Component | Detail |
|-----------|--------|
| **Total Estimate** | Sum of all experiences + transport + incidentals |
| **Per-Item Breakdown** | Cost for each stop with confidence level |
| **Deals Finder** | Happy hour timings, weekday discounts, combo offers |
| **Booking Urgency** | "Book 2 days ahead for weekend slots" |
| **Cost-Saving Tips** | "Share auto with fellow visitors to Pottery Barn" |

---

## Technology Stack

### Backend
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Python 3.11+ | Core backend language |
| **API Framework** | FastAPI | High-performance async API |
| **Agent Framework** | LangGraph + LangChain | Multi-agent orchestration |
| **AI Models** | Google Vertex AI Gemini 2.0 | All 5 agents |
| **Geocoding** | Google Geocoding API | Location → Coordinates |
| **Caching** | In-memory with TTL | 24-hour geocode cache |

### Frontend
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js 14 | React-based full-stack |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Components** | shadcn/ui + Radix UI | Accessible UI primitives |
| **Maps** | Google Maps JavaScript API | Interactive route display |
| **Drag & Drop** | @dnd-kit | Reorderable timeline |
| **Charts** | Recharts | Budget visualization |

---

## Key Features

### 1. Real-Time Agent Visualization
During generation, users see all 5 agents working with live progress indicators:

```
[■■■■■■■■■■] Discovery Agent — Finding hidden gems...
[■■■■■■░░░░] Cultural Context — Adding local wisdom...
[■■■■■■░░░░] Community Agent — Analyzing solo-friendliness...
[■■■■░░░░░░] Budget Optimizer — Calculating costs...
[░░░░░░░░░░] Plot Builder — Crafting your story...
```

This creates engagement during the 15-20 second generation time.

---

### 2. Interactive Timeline with Drag & Drop
Users can reorder their itinerary by dragging stops. The system:
- Automatically recalculates travel times
- Adjusts arrival/departure windows
- Maintains narrative coherence
- Updates the map route in real-time

---

### 3. Google Maps Integration
| Feature | Implementation |
|---------|----------------|
| **Numbered Markers** | Each stop displayed with sequence number |
| **Route Polylines** | Driving/walking directions between stops |
| **Info Windows** | Click marker to see details + "Get Directions" link |
| **Focus Mode** | Selecting a stop pans and zooms to that location |

---

### 4. Solo-Sure Badges
Visual indicators throughout the UI:
- **Green Badge:** High solo-friendliness (60%+ solo visitors)
- **Yellow Badge:** Moderate (40-60% solo visitors)
- **Social Scaffolding Tips:** Expanded on hover/tap

---

### 5. Expandable Cultural Context
Each experience card has a "Local Insight" section that expands to show:
- Best time to visit with reasoning
- What to wear and why
- How to get there (with negotiation tips)
- Social norms and etiquette
- Safety considerations

---

## Data Flow

```
1. USER INPUT
   ├── Text: "Solo pottery workshop in Bangalore"
   ├── OR Instagram Reel URL
   └── Interest pods: [craft_explorer, food_nerd]

2. API REQUEST
   {
     query: "Solo pottery workshop in Bangalore",
     city: "Bangalore",
     budget_range: [200, 5000],
     solo_preference: true,
     interest_pods: ["craft_explorer", "food_nerd"]
   }

3. AGENT PIPELINE
   Discovery (3s) → Parallel Enrichment (2s) → Plot Builder (3s)
   Total: ~8-10 seconds

4. API RESPONSE
   ├── narrative_itinerary (story text)
   ├── experiences[] (structured data with geocodes)
   ├── cultural_context{} (per-experience tips)
   ├── social_scaffolding{} (solo info)
   ├── budget_breakdown{} (costs + deals)
   └── agent_trace[] (for visualization)

5. FRONTEND RENDER
   ├── Timeline with drag/drop
   ├── Google Maps with route
   ├── Budget donut chart
   └── Narrative blocks with badges
```

---

## Performance Optimizations

### Parallel Agent Execution
The coordinator runs three agents simultaneously after Discovery:
- Cultural Context Agent
- Community Agent  
- Budget Optimizer Agent

**Result:** Saves 2-3 seconds compared to sequential execution.

### Intelligent Geocoding
| Strategy | Benefit |
|----------|---------|
| **24-hour Cache** | Avoid redundant API calls for same locations |
| **Neighborhood Fallbacks** | Graceful degradation when exact address fails |
| **Batch Geocoding** | Process all locations in single pass |

### Model Selection
| Agent | Model | Rationale |
|-------|-------|-----------|
| Discovery | Flash | Speed critical for first response |
| Cultural Context | Pro | Deep reasoning for nuanced tips |
| Community | Flash | Pattern matching, fast |
| Plot Builder | Pro | Creative writing quality |
| Budget | Flash | Numerical, straightforward |

---

## Innovation Highlights

### 1. Plot-First Design (Industry First)
No travel app treats itineraries as stories. We introduce:
- **Narrative arc structure** for every experience
- **Intentional friction** as a feature, not a bug
- **Lore layering** that creates emotional connection

### 2. Solo-Sure Framework
First quantified solo-friendliness system:
- Percentage-based scoring
- Social scaffolding identification
- Arrival vibe prediction
- Beginner energy rating

### 3. Collision Suggestions
AI-powered serendipity engine that suggests unexpected pairings:
> "Heritage walk + street food: History tastes better with chaat"

### 4. Multi-Agent Collaboration
5 specialized agents with distinct roles vs. one generic prompt:
- Better accuracy through specialization
- Parallel execution for speed
- Easier debugging and improvement

---

## Demo Script (3 Minutes)

| Time | Action | Talking Point |
|------|--------|---------------|
| 0:00-0:30 | Enter query on homepage | "Paste an Instagram reel or describe your vibe" |
| 0:30-1:00 | Show agent visualization | "5 AI agents collaborating in real-time" |
| 1:00-1:30 | Reveal itinerary | "Not a list — a story with setup, friction, payoff" |
| 1:30-2:00 | Interact with map | "Every stop geocoded, routes calculated" |
| 2:00-2:30 | Show Solo-Sure badges | "60% come alone — you're not weird" |
| 2:30-3:00 | Drag to reorder | "Your story, your sequence" |

---

## Competitive Differentiation

| Feature | Sidequest | Google Maps | TripAdvisor | Airbnb Exp |
|---------|-----------|-------------|-------------|------------|
| Narrative itineraries | ✅ | ❌ | ❌ | ❌ |
| Solo-friendliness scores | ✅ | ❌ | ❌ | ❌ |
| Cultural context | ✅ Deep | ❌ | ❌ Superficial | ❌ |
| Multi-agent AI | ✅ 5 agents | ❌ | ❌ | ❌ |
| Drag-drop timeline | ✅ | ❌ | ❌ | ❌ |
| Real-time visualization | ✅ | ❌ | ❌ | ❌ |

---

## Future Roadmap

1. **Instagram Reel Parser** — Extract locations and vibes from video content
2. **WhatsApp Bot** — Plan via chat without app download
3. **Collaborative Planning** — Group itineraries with voting
4. **Local Guide Marketplace** — Connect with human guides for premium experiences
5. **Booking Integration** — Direct reservation for restaurants and workshops

---

## Team & Acknowledgments

Built with ❤️ using Google Gemini 2.0, LangGraph, and Next.js

---

*"Every experience deserves a story. Sidequest writes yours."*
