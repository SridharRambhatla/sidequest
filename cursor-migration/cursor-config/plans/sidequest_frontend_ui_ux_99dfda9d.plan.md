---
name: Sidequest Frontend UI/UX
overview: Build a production-grade Next.js frontend for Sidequest with a custom calming design system, covering demo-critical flows (homepage, input, loading with agent visualization, results) plus competitive edge features (map integration, budget viz, solo-sure indicators).
todos:
  - id: setup-project
    content: Initialize Next.js project with TypeScript, Tailwind, shadcn/ui
    status: completed
  - id: design-system
    content: Configure custom calming color palette and typography in Tailwind config
    status: completed
  - id: install-components
    content: Install required shadcn/ui components (button, input, card, badge, tabs, etc.)
    status: completed
  - id: build-experience-card
    content: Build ExperienceCard component with image, badges, solo indicator
    status: completed
  - id: build-agent-progress
    content: Build AgentProgress component - 5 agent cards with animated status
    status: completed
  - id: build-narrative-block
    content: Build NarrativeBlock component for timeline entries
    status: completed
  - id: homepage
    content: Implement Homepage with hero, input tabs, preferences
    status: completed
  - id: loading-page
    content: Implement Generation Loading page with agent visualization
    status: completed
  - id: results-page
    content: Implement Itinerary Results page with narrative + map split
    status: completed
  - id: map-integration
    content: Add React Leaflet map with markers and route lines
    status: completed
  - id: budget-viz
    content: Add budget breakdown donut chart (recharts)
    status: completed
  - id: api-integration
    content: Create API client and connect to backend
    status: completed
  - id: responsive
    content: Implement responsive breakpoints (mobile, tablet, desktop)
    status: completed
  - id: polish
    content: Add micro-animations, skeleton loading, glassmorphism effects
    status: completed
isProject: false
---

# Sidequest Frontend UI/UX Implementation Plan

## Current State

- Backend: Fully implemented FastAPI + 5 LangGraph agents (working API at `/api/generate-itinerary`)
- Frontend: **Does not exist** - building from scratch
- API Response structure defined in [`backend/state/schemas.py`](backend/state/schemas.py)

---

## Phase 1: Project Setup & Design System Foundation

### 1.1 Next.js Project Initialization

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend && npx shadcn@latest init
```

### 1.2 Custom Calming Color Palette

Based on PRD's "soft blues, muted greens, warm neutrals" with 60-30-10 rule:

- **Primary**: Soft Blue `#4A90A4` (calm trust, CTAs)
- **Secondary**: Muted Green `#7BA388` (success, nature)
- **Accent**: Warm Terracotta `#C4846C` (warmth, 10% accent pops)
- **Neutrals**: 
  - Background: `#FAFAF8` (warm off-white)
  - Surface: `#FFFFFF` 
  - Text: `#2D3436` (soft black)
  - Muted: `#636E72` (secondary text)
- **Semantic**: Success `#7BA388`, Warning `#E9B44C`, Error `#C75B5B`
- **Dark mode variants** with WCAG AA contrast (4.5:1 minimum)

### 1.3 Typography System

- **Primary (body)**: Inter (clean, readable)
- **Type scale**: 12px, 15px, 19px, 24px, 30px, 38px (1.25x modular)
- **Line heights**: 1.5 body, 1.2 headings
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### 1.4 Spacing & Elevation

- **8pt grid**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Shadows**: sm/md/lg/xl for depth perception
- **Border radius**: 8px (inputs), 12px (cards), 16px (modals)

---

## Phase 2: Component Library (shadcn/ui + Custom)

### 2.1 Core Components to Install/Customize

```bash
npx shadcn@latest add button input textarea card badge tabs skeleton
npx shadcn@latest add dialog sheet select slider checkbox
npx shadcn@latest add toast progress avatar separator
```

### 2.2 Custom Components to Build

**Experience Card** (`components/experience-card.tsx`)

- Image placement (top)
- Title, category badge, timing
- Solo-friendly indicator (checkmark badge)
- Budget pill
- Hover lift effect (transform + shadow)

**Agent Progress Card** (`components/agent-progress.tsx`) - KEY DIFFERENTIATOR

- 5 agent cards showing real-time status
- Progress indicators per agent
- Animated pulse when processing
- Checkmark when complete

**Filter Chips** (`components/filter-chips.tsx`)

- Removable active filter display
- Budget range, solo preference, interests

**Narrative Block** (`components/narrative-block.tsx`)

- Time badge (rounded pill)
- Experience heading (clickable)
- Rich narrative text
- Cultural context tooltip
- Inline metadata chips

---

## Phase 3: Page Implementation (Tier 1 - Demo Critical)

### 3.1 Homepage / Discovery (`app/page.tsx`)

**Layout Structure:**

- Hero section (above fold):
  - Headline: "Turn social inspiration into story-driven experiences"
  - Subheadline: "Paste an Instagram Reel, describe a vibe, or upload inspiration"
  - Primary CTA: "Create Your Sidequest" button
- Quick input options (tabs):
  - Text query textarea
  - Instagram/YouTube URL input with validation
- Optional preferences (collapsible):
  - Budget slider (₹200 - ₹5000)
  - Solo preference toggle
  - Interest chips (food_nerd, craft_explorer, heritage_walker, etc.)

**Data flow:**

```typescript
interface InputState {
  query: string;
  socialMediaUrls: string[];
  city: string;
  budgetMin: number;
  budgetMax: number;
  soloPreference: boolean;
  interestPods: string[];
}
```

### 3.2 Generation Loading State (`app/generate/page.tsx`) - WOW MOMENT

**Agent Visualization (CRITICAL FOR JUDGES):**

```
┌─────────────────────────────────────────┐
│  Creating your Sidequest...             │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │Discovery│ │Cultural │ │Community│   │
│  │  ████▓░ │ │  ░░░░░░ │ │  ░░░░░░ │   │
│  │ Finding │ │ Waiting │ │ Waiting │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  ┌─────────┐ ┌─────────┐               │
│  │  Plot   │ │ Budget  │               │
│  │  ░░░░░░ │ │  ░░░░░░ │               │
│  │ Waiting │ │ Waiting │               │
│  └─────────┘ └─────────┘               │
│                                         │
│  Progress: 20% - Discovering spots...   │
└─────────────────────────────────────────┘
```

**Implementation:**

- Poll `/api/agent-trace/{session_id}` for real-time updates (or use SSE)
- Simulated progress if no live trace (for demo stability)
- Interesting facts carousel during wait ("Did you know...")
- Cancel option with confirmation modal

### 3.3 Itinerary Results Page (`app/itinerary/[id]/page.tsx`)

**Layout: Split view (60/40 on desktop):**

**Left Panel (60%) - Narrative Itinerary:**

- Opening hook (larger font, distinct styling)
- Timeline entries with:
  - Time badge (e.g., "9:00 AM")
  - Experience name (H3, clickable)
  - Narrative description (2-3 paragraphs)
  - Solo-sure badge if applicable
  - Cultural context expand/collapse
  - "Add to Calendar" / "Get Directions" actions
- Collision suggestion card (distinct background)

**Right Panel (40%) - Interactive Map:**

- React Leaflet integration
- Numbered markers for each stop
- Route lines connecting experiences
- Hover tooltips with experience preview
- Click to scroll to narrative section

**Floating Bottom Action Bar:**

- Export PDF button
- Share itinerary button
- "Modify Itinerary" to go back to input

---

## Phase 4: Tier 2 Enhancements

### 4.1 Map Integration

```bash
npm install react-leaflet leaflet @types/leaflet
```

- OpenStreetMap tiles (free, no API key)
- Custom marker icons matching design system
- Fit bounds to show all experiences

### 4.2 Budget Breakdown Visualization

- Donut chart (recharts) showing category breakdown
- List view with per-experience costs
- "Within budget" / "Over budget" indicator
- BNPL/deals callout if available

### 4.3 Solo-Friendly Indicators

- Badge on experience cards: "Solo-sure ✓"
- Percentage in narrative: "60% of attendees arrive solo"
- Icon legend explaining solo-sure scoring

### 4.4 Premium Visual Polish

- Subtle gradients on hero section
- Glassmorphism on floating action bar (backdrop-filter: blur)
- Hover micro-animations (150ms transitions)
- Loading skeleton screens (not spinners)

---

## Phase 5: Responsive Design

### Breakpoints

- Mobile: 320px - 767px (single column, bottom sheets)
- Tablet: 768px - 1023px (2-column grid)
- Desktop: 1024px+ (60/40 split, sidebars)

### Mobile Adaptations

- Hero CTA moves to sticky bottom bar
- Map becomes horizontal scroll or toggleable panel
- Narrative timeline becomes full-width cards
- Touch targets minimum 48px

---

## Phase 6: API Integration

### API Client (`lib/api.ts`)

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function generateItinerary(input: ItineraryRequest): Promise<ItineraryResponse> {
  const res = await fetch(`${API_BASE}/api/generate-itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Generation failed');
  return res.json();
}
```

### State Management

- React Query for API calls (caching, loading states)
- URL state for shareable itineraries
- localStorage for draft preservation

---

## File Structure

```
frontend/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── generate/
│   │   └── page.tsx                # Loading state with agents
│   ├── itinerary/
│   │   └── [id]/page.tsx           # Results page
│   ├── layout.tsx                  # Root layout with providers
│   └── globals.css                 # Tailwind + custom vars
├── components/
│   ├── ui/                         # shadcn components
│   ├── experience-card.tsx
│   ├── agent-progress.tsx          # KEY: Agent visualization
│   ├── narrative-block.tsx
│   ├── itinerary-map.tsx
│   ├── budget-breakdown.tsx
│   └── filter-chips.tsx
├── lib/
│   ├── api.ts                      # API client
│   ├── utils.ts                    # shadcn cn() helper
│   └── types.ts                    # Shared TypeScript types
└── public/
    └── images/                     # Icons, illustrations
```

---

## Demo Flow (3-minute pitch)

1. **0:00-0:30**: Show Instagram Reel URL paste → instant recognition
2. **0:30-1:30**: Agent visualization (judges see 5 agents working)
3. **1:30-2:30**: Reveal premium narrative itinerary with map
4. **2:30-3:00**: Highlight solo-sure tags, cultural context, mobile view

---

## Success Criteria

- New user completes input → results flow in under 60 seconds
- Agent visualization clearly shows 5 agents collaborating
- Narrative itinerary reads as a story, not a list
- Mobile responsive at 375px
- All interactive elements have feedback within 100ms
- WCAG AA contrast compliance