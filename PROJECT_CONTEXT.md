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
| **LLM** | Perplexity API (replaces Vertex AI) | sonar, sonar-pro |
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
| `PERPLEXITY_API_KEY` | All agents (discovery, cultural_context, budget, community, plot_builder) |
| `GOOGLE_CLOUD_PROJECT` | Vertex AI (deprecated — out of credits) |
| `VERTEX_PRO_MODEL` | Pro model for thinking tasks (deprecated) |
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
# Ensure .env has PERPLEXITY_API_KEY
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
| **Perplexity** | `PERPLEXITY_API_KEY` | Discovery (`sonar-pro`), cultural_context/budget/community (`sonar`), plot_builder (`sonar-pro`) |
| **Google Maps** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map render, client-side |
| **Google Geocoding** | Server-side key | May need `REQUEST_DENIED` fix — add domain to API restrictions |

---

## 5. Architectural Decisions (Exact Reasoning)

1. **All agents on Perplexity:** Vertex AI credits exhausted. Discovery, cultural_context, budget, community, plot_builder all use Perplexity. Model mapping: `sonar-pro` for thinking (plot_builder, cultural_context), `sonar` for fast (budget, community, discovery).

2. **Cultural context 3-field schema:** Original 6-field prompt hit sonar-pro 8k output limit with 3+ experiences. Reduced to `timing`, `tip`, `solo_note`.

3. **Multi-day itineraries:** Backend parses `num_days` from query ("3 days", "weekend"). Experiences have `day` (1-indexed), `start_time`. Default 6 AM–9 PM, 15 hours. Frontend groups by day, collapsible sections.

4. **Discovery via Perplexity:** `genai.GenerativeModel` (Gemini) was quota-exhausted. Replaced with `requests` → Perplexity `sonar-pro` for real-time search.

5. **Collapsible event details:** `DraggableTimelineCard` and `NarrativeBlock` both have expand/collapse. Results page uses `InteractiveTimeline` with `culturalContext`, `socialScaffolding` passed through. Click row → inline details panel.

---

## 6. File Inventory (Key Paths)

### Modified (uncommitted) — Current Work

| Path | Purpose | Change Summary |
|------|---------|----------------|
| `backend/agents/discovery_agent.py` | Experience discovery | Perplexity sonar-pro, no Vertex |
| `backend/agents/cultural_context_agent.py` | Cultural context | Perplexity sonar, 3-field schema |
| `backend/agents/budget_agent.py` | Budget | Perplexity sonar |
| `backend/agents/community_agent.py` | Community | Perplexity sonar |
| `backend/agents/plot_builder_agent.py` | Plot/narrative | Perplexity sonar-pro |
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
| `backend/utils/perplexity.py` | Shared sync + async Perplexity callers, citation stripping |

---

## 7. Features: Built / Partial / Planned

| Feature | Status |
|---------|--------|
| Discovery (Perplexity sonar-pro) | ✅ Built |
| Cultural context (3-field) | ✅ Built |
| Budget, community, plot_builder | ✅ Built |
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
| 0 results (Gemini quota) | ✅ Fixed — Perplexity discovery |
| gemini-2.0-pro-exp-02-05 404 | ✅ Fixed — all agents on Perplexity |
| cultural_context JSON truncation | ✅ Fixed — 3-field schema, sonar |
| Citation markers breaking JSON | ✅ Fixed — strip in perplexity.py |
| Geocoding REQUEST_DENIED | ⚠️ Open — add server domain to Maps key |

---

## 9. Last 5 Things Worked On (Order)

1. **Multi-day itineraries + collapsible days:** `parse_num_days_from_query()`, `day` and `start_time` on experiences, results page with DaySection components, day 1 open by default.

2. **Collapsible event details on results page:** `DraggableTimelineCard` expand panel; `InteractiveTimeline` accepts `culturalContext`, `socialScaffolding`; `results/page.tsx` passes them.

3. **Cultural context type + NarrativeBlock:** Types updated for `tip`, `solo_note`; NarrativeBlock shows expanded details.

4. **All agents on Perplexity:** Replaced Vertex AI with `utils/perplexity.py`; discovery, cultural_context, budget, community, plot_builder use Perplexity.

5. **Google Maps key fix:** NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, .env.local update, restart.

---

## 10. Next Task (Before Migration)

**Documented next step:** Commit uncommitted changes (Perplexity migration, multi-day, collapsible UI). Verify geocoding if precise pin placement is needed.

**Exact state:** All 5 agents on Perplexity. Multi-day itineraries with collapsible days. Event details expand on click. Maps render. Geocoding may need key restriction update.

---

## 11. Transcripts Referenced

- `ee2c7dcb` — Maps, Perplexity, 0 results, agents, itinerary, multi-day, collapsible
