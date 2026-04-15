---
name: Dynamic Events and UI Fixes
overview: Implement dynamic event fetching on the discovery page with auto-refresh, align time constraints between prompts and itineraries, add inline event expansion on the itinerary page, and verify all agent flows.
todos:
  - id: auto-refresh
    content: Add auto-refresh mechanism to useExperiences hook with interval polling and visibility detection
    status: completed
  - id: home-api
    content: Update home page to fetch from API instead of using static SAMPLE_EXPERIENCES
    status: completed
  - id: refresh-indicator
    content: Add visual refresh indicator and last-updated timestamp to explore page
    status: completed
  - id: time-limit-schema
    content: Add time_available_hours field to request schemas (backend + frontend)
    status: completed
  - id: time-limit-prompts
    content: Update discovery and plot builder agent prompts to respect time constraints
    status: completed
  - id: inline-expansion
    content: Add inline event expansion on click in NarrativeBlock component
    status: completed
  - id: verify-flows
    content: Test all existing flows work correctly after changes
    status: completed
  - id: verify-agents
    content: Verify all 5 agents produce correct outputs and trace entries
    status: completed
isProject: false
---

# Dynamic Events and UI Fixes Plan

## 1. Dynamic Event Fetching on Discovery Page

**Current State:**

- The `/explore` page uses `useExperiences` hook which calls the backend `/api/discover` endpoint
- The home page (`/`) uses static `SAMPLE_EXPERIENCES` instead of the API
- `useExperiences` has a manual `refetch` function but no auto-refresh mechanism
- Cache duration is 5 minutes

**Changes Required:**

### A. Add Auto-Refresh to `useExperiences` Hook

File: [frontend/src/hooks/useExperiences.ts](frontend/src/hooks/useExperiences.ts)

- Add `refreshInterval` option (default: 30 seconds when page is focused)
- Implement `useEffect` with `setInterval` for periodic refetching
- Add visibility change listener to pause/resume polling when tab is inactive
- Clear interval on component unmount
```typescript
// New options to add
refreshInterval?: number; // ms, default 30000
autoRefresh?: boolean;    // default true
```


### B. Update Home Page to Use API Data

File: [frontend/src/app/page.tsx](frontend/src/app/page.tsx)

- Replace `SAMPLE_EXPERIENCES` with the `useExperiences` hook
- Add loading skeleton for explore section
- Keep fallback to sample data on API failure

### C. Update Explore Page with Refresh Indicator

File: [frontend/src/app/explore/page.tsx](frontend/src/app/explore/page.tsx)

- Pass `autoRefresh: true` to `useExperiences`
- Add visual indicator for last refresh time
- Show subtle animation on refresh

---

## 2. Time Limit Consistency in Prompts and Itineraries

**Current State:**

- `ItineraryRequest` has `start_date` and `end_date` but no explicit duration/time limit
- Discovery agent extracts time-of-day preferences (morning/afternoon/evening)
- Plot builder prompt says "Craft a day's narrative" but doesn't receive time constraints
- Each experience has `duration_hours` but this isn't used in prompt constraints

**Changes Required:**

### A. Add Time Limit Field to Request Schema

Files:

- [backend/state/schemas.py](backend/state/schemas.py)
- [frontend/src/lib/types.ts](frontend/src/lib/types.ts)

Add `time_available_hours` field (e.g., 4, 6, 8 hours) to `ItineraryRequest`

### B. Pass Time Constraints to Plot Builder

File: [backend/agents/plot_builder_agent.py](backend/agents/plot_builder_agent.py)

Update user prompt to include:

- Available time window
- Instruction to respect total duration constraint
- Example: "User has 6 hours available (2 PM - 8 PM)"

### C. Update Discovery Agent to Filter by Duration

File: [backend/agents/discovery_agent.py](backend/agents/discovery_agent.py)

Add duration constraint to prompt when time limit is specified:

- "Only include experiences that can be completed within the user's time window"

### D. Update Frontend Form (Optional)

File: [frontend/src/app/page.tsx](frontend/src/app/page.tsx)

Add duration selector in preferences section

---

## 3. Inline Event Expansion on Itinerary Page

**Current State:**

- `NarrativeBlock` displays experience with expandable "local tips" section
- Clicking the card does nothing (only action buttons and map pin button have handlers)
- User wants: clicking an event should expand details inline

**Changes Required:**

### A. Add Expandable State and Click Handler to NarrativeBlock

File: [frontend/src/components/narrative-block.tsx](frontend/src/components/narrative-block.tsx)

- Add `isExpanded` state for the full card
- Make the entire card header area clickable
- On click, expand to show:
  - Full description (currently truncated)
  - All cultural context details (currently hidden behind button)
  - Social scaffolding details
  - Operating hours and days
- Animate expansion with smooth transition
```typescript
// Key changes
const [isExpanded, setIsExpanded] = useState(false);

// Make card clickable
<div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer">
```


### B. Add Expanded Content Section

- When expanded, show additional details:
  - Full lore/description
  - Operating hours
  - Cultural context (auto-expanded)
  - Booking requirements
  - Better action buttons (calendar, directions)

---

## 4. Ensure No Existing Flows Break

**Testing Checklist:**

- [ ] Home page itinerary generation flow still works
- [ ] Explore page fetches and displays experiences
- [ ] Experience card click navigates to generate page
- [ ] Itinerary page loads from sessionStorage
- [ ] Map integration still works
- [ ] All 5 agents complete successfully

---

## 5. Verify All Agents Working

**Current Agent Flow:**

```
Discovery → (Cultural Context + Community + Budget) [parallel] → Plot Builder
```

**Verification Steps:**

### A. Check Agent Imports in Coordinator

File: [backend/agents/coordinator.py](backend/agents/coordinator.py)

Coordinator imports:

- `run_discovery` from discovery_agent.py (sync)
- `run_cultural_context` from cultural_context_agent.py (async)
- `run_community` from community_agent.py (async)
- `run_plot_builder` from plot_builder_agent.py (async)
- `run_budget_optimizer` from budget_agent.py (async)

### B. Verify Each Agent Returns Correct Output Schema

| Agent | Expected Output Keys |

|-------|---------------------|

| Discovery | `discovered_experiences[]` |

| Cultural Context | `cultural_context{experience_name: {...}}` |

| Community | `social_scaffolding{experience_name: {...}}` |

| Budget | `budget_breakdown{total_estimate, breakdown[], deals[]}` |

| Plot Builder | `narrative_itinerary`, `collision_suggestion` |

### C. Add Agent Status Logging

File: [backend/agents/coordinator.py](backend/agents/coordinator.py)

Enhance trace entries to include more debugging info for demo visualization.

---

## Implementation Order

1. **Start with non-breaking changes:**

   - Add inline expansion to NarrativeBlock (Task 3)
   - Add auto-refresh to useExperiences hook (Task 1A)

2. **Then API integration changes:**

   - Update home page to use API (Task 1B)
   - Update explore page refresh indicator (Task 1C)

3. **Schema/prompt changes:**

   - Add time limit field (Task 2A)
   - Update prompts (Task 2B, 2C)

4. **Verification:**

   - Test all flows (Task 4)
   - Verify agent outputs (Task 5)

---

## Files to Modify

| File | Changes |

|------|---------|

| `frontend/src/hooks/useExperiences.ts` | Add auto-refresh with interval |

| `frontend/src/app/page.tsx` | Use API instead of sample data |

| `frontend/src/app/explore/page.tsx` | Add refresh indicator |

| `frontend/src/components/narrative-block.tsx` | Add inline expansion on click |

| `backend/state/schemas.py` | Add `time_available_hours` field |

| `frontend/src/lib/types.ts` | Add `time_available_hours` field |

| `backend/agents/plot_builder_agent.py` | Add time constraint to prompt |

| `backend/agents/discovery_agent.py` | Add duration filtering |

| `frontend/src/lib/api.ts` | Update request type |