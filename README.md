# Sidequest

> **From scroll to story:** Turn social media inspiration into plot-first experiences.

Sidequest is a plot-first experience discovery platform that transforms Instagram inspiration into narrative-driven, culturally-grounded itineraries. Powered by Vertex AI Gemini models and a multi-agent architecture.

## 🎯 What It Does

1. **Paste an Instagram Reel** or describe what you want to experience
2. **5 AI agents collaborate** to discover, contextualize, and narrate experiences
3. **Get a story-driven itinerary** — not a list, but a journey with lore, friction, and payoff

## 🏗️ Architecture

```
User Input → Coordinator (Supervisor)
                ├── Discovery Agent (Gemini Flash)
                ├── Cultural Context Agent (Gemini Pro)  ─┐ parallel
                ├── Community Agent (Gemini Flash)       ─┘
                ├── Plot-Builder Agent (Gemini Pro)
                └── Budget Optimizer (Gemini Flash)
              → Narrative Itinerary Output
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Cloud project with Vertex AI enabled
- Service account key with `Vertex AI User` role

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Copy and configure env
cp ../.env.example .env
# Edit .env with your GCP project details

# Run the server
python main.py
```

Server starts at `http://localhost:8000`. Health check: `GET /health`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:3000`.

### API Usage

```bash
curl -X POST http://localhost:8000/api/generate-itinerary \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Solo pottery workshop for beginners in Bangalore",
    "city": "Bangalore",
    "budget_min": 200,
    "budget_max": 2000,
    "solo_preference": true,
    "interest_pods": ["craft_explorer", "food_nerd"]
  }'
```

## 📁 Project Structure

```
curex/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── config.py               # Vertex AI configuration
│   ├── agents/
│   │   ├── coordinator.py      # LangGraph Supervisor
│   │   ├── discovery_agent.py  # Experience finder (Gemini Flash)
│   │   ├── cultural_context_agent.py  # Localization (Gemini Pro)
│   │   ├── plot_builder_agent.py      # Narrative engine (Gemini Pro)
│   │   ├── budget_agent.py     # Cost optimizer (Gemini Flash)
│   │   └── community_agent.py  # Solo-sure filtering (Gemini Flash)
│   ├── state/                  # Agent state schemas
│   ├── tools/                  # Social media extractors, search
│   └── utils/                  # Error handling, logging
├── frontend/                   # Next.js app
├── deployment/                 # Docker configs
├── .env.example
├── LICENSE (MIT)
└── architecture.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Models | Vertex AI Gemini 2.0 (Pro + Flash) |
| Agent Framework | LangGraph + LangChain |
| Backend | Python + FastAPI |
| Frontend | Next.js + TypeScript |
| Deployment | Docker + Vercel/Railway |

## 📄 License

MIT — see [LICENSE](./LICENSE).
