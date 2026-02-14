# Sidequest Frontend

> Production-grade UI for plot-first experience discovery

A Next.js 14+ frontend with a custom calming design system, built with shadcn/ui, Tailwind CSS, and React Leaflet.

## Features

- **Custom Calming Design System**: Soft blues, muted greens, warm terracotta (60-30-10 rule)
- **Agent Visualization**: Real-time display of 5 AI agents working (KEY DEMO DIFFERENTIATOR)
- **Narrative Itinerary**: Story-driven timeline with cultural context
- **Interactive Map**: React Leaflet with numbered markers and route lines
- **Budget Breakdown**: Donut chart visualization with cost details
- **Solo-Sure Indicators**: Visual badges for solo-friendly experiences
- **Responsive Design**: Mobile-first with tablet and desktop breakpoints
- **Glassmorphism Effects**: Premium UI polish with backdrop blur

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage with hero, input
│   ├── generate/page.tsx           # Agent visualization loading
│   ├── itinerary/[id]/page.tsx     # Results with map split
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Design system
├── components/
│   ├── ui/                         # shadcn components
│   ├── experience-card.tsx         # Experience display card
│   ├── agent-progress.tsx          # 5-agent progress viz
│   ├── narrative-block.tsx         # Timeline entry
│   ├── itinerary-map.tsx           # Leaflet map
│   ├── budget-breakdown.tsx        # Donut chart
│   └── filter-chips.tsx            # Filter UI
└── lib/
    ├── api.ts                      # Backend API client
    ├── types.ts                    # TypeScript types
    └── utils.ts                    # Utilities (cn)
```

## Design System

### Colors (Calming Palette)
- **Primary**: Soft Blue `#4A90A4` (trust, CTAs)
- **Secondary**: Muted Green `#7BA388` (nature, success)
- **Accent**: Warm Terracotta `#C4846C` (warmth, highlights)
- **Background**: Warm Off-White `#FAFAF8`

### Typography
- **Font**: Inter (400, 500, 600, 700)
- **Scale**: 12px → 38px (1.25x modular)

### Spacing
- **8pt Grid**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

## Demo Flow

1. **Homepage (0:00-0:30)**: Paste Instagram URL or describe experience
2. **Loading (0:30-1:30)**: Agent visualization shows 5 agents collaborating
3. **Results (1:30-2:30)**: Narrative itinerary with interactive map
4. **Highlights (2:30-3:00)**: Solo-sure badges, cultural context, mobile view

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui |
| Maps | React Leaflet |
| Charts | Recharts |
| Icons | Lucide React |

## License

MIT
