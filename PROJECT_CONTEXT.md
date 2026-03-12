# Curex (Sidequest) — Full Project Context (Post-Migration Restoration)

> **Purpose:** Complete working context for resuming work after machine migration.  
> **Last Updated:** March 2, 2026  
> **Location:** `/Users/siddansh/Hackathon/curex`

---

## 1. Tech Stack (Exact Versions)

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js + React | Next.js 16.1.6 (Turbopack), React 19.2.3 |
| **Backend** | FastAPI + Uvicorn | fastapi>=0.104.0 |
| **LLM** | Gemini via Vertex AI | gemini-2.0-flash |
| **Maps** | @react-google-maps/api | ^2.20.8 |
| **State** | @tanstack/react-query | ^5.90.21 |
| **UI** | Tailwind + Radix + shadcn | tailwindcss ^4 |
| **Orchestration** | LangGraph | >=0.2.60 |

---

## 2. Environment Variables (Keys Only — No Values)

| Key | Purpose |
|-----|---------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | **Required** — Browser Maps (must have NEXT_PUBLIC_ prefix) |
| `GOOGLE_API_KEY` | Server-side (geocoding) — may need separate key |
| `GOOGLE_CLOUD_PROJECT` | Vertex AI for Gemini LLM |
| `GOOGLE_CLOUD_LOCATION` | Vertex AI region (e.g., us-central1) |
| `REDDIT_CLIENT_ID` | Optional Reddit API for context enrichment |
| `REDDIT_CLIENT_SECRET` | Optional Reddit API secret |
| `ENABLE_REDDIT_ENRICHMENT` | Enable/disable Reddit enrichment (true/false) |
| `BACKEND_PORT` | Default: 8000 |
| `BACKEND_HOST` | Default: 0.0.0.0 |
| `LANGSMITH_API_KEY` | Optional tracing |
| `LANGSMITH_PROJECT` | sidequest-dev |
| `LANGSMITH_TRACING` | true/false |

---

## 3. Run Commands

### Backend (port 8000)

```bash
cd /Users/siddansh/Hackathon/curex/backend
# Ensure .env has GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Or from project root:

```bash
cd /Users/siddansh/Hackathon/curex
# Backend expects .env in backend/ or project root
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend (port 3000)

```bash
cd /Users/siddansh/Hackathon/curex/frontend
npm install  # if needed
npm run dev
```

**Note:** `frontend/.env.local` overrides `.env` for Maps key. Restart Next.js after env changes.

---

## 4. API Integrations

| Service | Auth | Usage |
|---------|------|-------|
| **Gemini (Vertex AI)** | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` | All agents (discovery, cultural_context, budget, community, plot_builder) |
| **Reddit API** | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | Optional context enrichment for agents |
| **Google Maps** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map render, client-side |
| **Google Geocoding** | Server-side key | May need `REQUEST_DENIED` fix — add domain to API restrictions |

---

## 5. Architectural Decisions (Exact Reasoning)

1. **All agents on Gemini:** Migrated from Perplexity to Gemini via Vertex AI for cost savings. Discovery, cultural_context, budget, community, plot_builder all use `gemini-2.0-flash` via `utils/llm_caller.py`. Optional Reddit enrichment available via feature flag.

2. **Cultural context 3-field schema:** Original 6-field prompt hit sonar-pro 8k output limit with 3+ experiences. Reduced to `timing`, `tip`, `solo_note`.

3. **Multi-day itineraries:** Backend parses `num_days` from query ("3 days", "weekend"). Experiences have `day` (1-indexed), `start_time`. Default 6 AM–9 PM, 15 hours. Frontend groups by day, collapsible sections.

4. **Discovery via Gemini:** Uses `call_llm()` wrapper for Gemini via Vertex AI. Optional Reddit enrichment can be enabled via `ENABLE_REDDIT_ENRICHMENT` flag.

5. **Collapsible event details:** `DraggableTimelineCard` and `NarrativeBlock` both have expand/collapse. Results page uses `InteractiveTimeline` with `culturalContext`, `socialScaffolding` passed through. Click row → inline details panel.

---

## 6. File Inventory (Key Paths)

### Modified (uncommitted) — Current Work

| Path | Purpose | Change Summary |
|------|---------|----------------|
| `backend/agents/discovery_agent.py` | Experience discovery | Gemini via llm_caller |
| `backend/agents/cultural_context_agent.py` | Cultural context | Gemini via llm_caller, 3-field schema |
| `backend/agents/budget_agent.py` | Budget | Gemini via llm_caller |
| `backend/agents/community_agent.py` | Community | Gemini via llm_caller |
| `backend/agents/plot_builder_agent.py` | Plot/narrative | Gemini via llm_caller |
| `backend/agents/coordinator.py` | Orchestration | num_days, day, start_time |
| `backend/config.py` | Config | Model names (unused — Perplexity) |
| `backend/state/schemas.py` | Schemas | day, start_time, num_days on ExperienceItem |
| `frontend/src/app/itinerary/[id]/page.tsx` | Itinerary view | NarrativeBlock |
| `frontend/src/app/page.tsx` | Home | handleExperienceSelect → /experience/[id] |
| `frontend/src/app/results/page.tsx` | Results | Day sections, culturalContext, socialScaffolding |
| `frontend/src/components/narrative-block.tsx` | Experience card | Expand, 3-field cultural context |
| `frontend/src/components/timeline/draggable-card.tsx` | Timeline card | Expand, details panel |
| `frontend/src/components/timeline/interactive-timeline.tsx` | Timeline | culturalContext, socialScaffolding, dayStartTime |
| `frontend/src/lib/types.ts` | Types | day, start_time, num_days, CulturalContext (tip, solo_note) |

### New (untracked)

| Path | Purpose |
|------|---------|
| `backend/utils/llm_caller.py` | Shared Gemini LLM wrapper via Vertex AI |
| `backend/data_sources/reddit_simple.py` | Optional Reddit client for context enrichment |

---

## 7. Features: Built / Partial / Planned

| Feature | Status |
|---------|--------|
| Discovery (Gemini) | ✅ Built |
| Cultural context (3-field, Gemini) | ✅ Built |
| Budget, community, plot_builder (Gemini) | ✅ Built |
| Optional Reddit enrichment | ✅ Built |
| Multi-day itineraries | ✅ Built |
| Collapsible day sections | ✅ Built |
| Collapsible event details (results + itinerary) | ✅ Built |
| Google Maps render | ✅ Built — key in .env.local |
| Click experience → /experience/[id] | ✅ Built |
| Geocoding (server-side) | ⚠️ REQUEST_DENIED — Maps key restrictions |

---

## 8. Bugs/Issues (Identified + Status)

| Issue | Status |
|-------|--------|
| ApiTargetBlockedMapError | ✅ Fixed — NEXT_PUBLIC_ prefix, key restrictions |
| 0 results (Gemini quota) | ✅ Fixed — Gemini via Vertex AI |
| gemini-2.0-pro-exp-02-05 404 | ✅ Fixed — all agents on Gemini Flash |
| cultural_context JSON truncation | ✅ Fixed — 3-field schema |
| Citation markers breaking JSON | ✅ Fixed — strip in llm_caller.py |
| Geocoding REQUEST_DENIED | ⚠️ Open — add server domain to Maps key |

---

## 9. Last 5 Things Worked On (Order)

1. **Multi-day itineraries + collapsible days:** `parse_num_days_from_query()`, `day` and `start_time` on experiences, results page with DaySection components, day 1 open by default.

2. **Collapsible event details on results page:** `DraggableTimelineCard` expand panel; `InteractiveTimeline` accepts `culturalContext`, `socialScaffolding`; `results/page.tsx` passes them.

3. **Cultural context type + NarrativeBlock:** Types updated for `tip`, `solo_note`; NarrativeBlock shows expanded details.

4. **All agents on Gemini:** Migrated from Perplexity to Gemini via Vertex AI using `utils/llm_caller.py`; discovery, cultural_context, budget, community, plot_builder use Gemini. Optional Reddit enrichment added.

5. **Google Maps key fix:** NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, .env.local update, restart.

---

## 10. Next Task (Before Migration)

**Documented next step:** Commit uncommitted changes (Gemini migration, multi-day, collapsible UI). Verify geocoding if precise pin placement is needed.

**Exact state:** All 5 agents on Gemini via Vertex AI. Multi-day itineraries with collapsible days. Event details expand on click. Maps render. Optional Reddit enrichment available. Geocoding may need key restriction update.

---

## 11. Transcripts Referenced

- `ee2c7dcb` — Maps, Gemini migration, 0 results, agents, itinerary, multi-day, collapsible
