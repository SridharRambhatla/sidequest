# Backend Agent Testing Guide

This guide explains how to test the Sidequest backend agents from the command line.

## Prerequisites

1. Python 3.9+ installed
2. Google Cloud Project with Vertex AI enabled
3. Service account credentials with Vertex AI permissions

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and set your Google Cloud credentials:

```
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

### 3. Authenticate with Google Cloud

```bash
# Set the environment variable
set GOOGLE_APPLICATION_CREDENTIALS=path\to\service-account-key.json

# Or authenticate using gcloud CLI
gcloud auth application-default login
```

## Running the Tests

### Basic Test Run

From the backend directory:

```bash
python test_agents.py
```

This will:
- Run all 5 agents in the correct order
- Print detailed output for each agent
- Save discovery results to `sources/` directory
- Display the final narrative itinerary

### Output Structure

The test script provides:

1. **Discovery Results** - Saved to `sources/discovery_<session_id>_<timestamp>.json`
2. **Console Output** - Detailed agent execution trace
3. **Narrative Itinerary** - The final plot-first story
4. **Budget Breakdown** - Cost analysis
5. **Agent Trace** - Execution timeline and latency

### Example Output

```
🚀 Starting Sidequest Agent Testing

============================================================
  SIDEQUEST AGENT TESTING
============================================================

📝 Test Request:
   Query: Solo-friendly pottery workshop and artisan coffee experiences in Bangalore
   City: Bangalore
   Budget: ₹500 - ₹3000
   Solo: True
   Interest Pods: craft_explorer, food_nerd

⏳ Running agent workflow...

📁 Discovery results saved to: sources/discovery_a1b2c3d4_20260214_143022.json

🔍 Discovered 8 experiences:
...
```

## Customizing Test Queries

Edit `test_agents.py` and modify the `test_request` object:

```python
test_request = ItineraryRequest(
    query="Your custom query here",
    city="Mumbai",  # Change city
    budget_min=1000,
    budget_max=5000,
    interest_pods=["heritage_walker", "food_nerd"],
    # ... other parameters
)
```

## Validating Discovery Results

Discovery agent results are saved as JSON in the `sources/` directory:

```json
{
  "session_id": "abc123...",
  "timestamp": "2026-02-14T14:30:22",
  "experiences_count": 8,
  "experiences": [
    {
      "name": "Clay Station Pottery Workshop",
      "category": "craft",
      "location": "Indiranagar",
      "budget": 1500,
      "solo_friendly": true,
      ...
    }
  ]
}
```

You can validate:
- Experience quality and relevance
- Budget accuracy
- Solo-friendliness ratings
- Source attribution

## Troubleshooting

### "Vertex AI calls will fail" Warning

Make sure:
1. `.env` file exists with correct `GOOGLE_CLOUD_PROJECT`
2. `GOOGLE_APPLICATION_CREDENTIALS` points to valid service account key
3. Service account has Vertex AI permissions

### Import Errors

```bash
# Make sure you're in the backend directory
cd backend

# Reinstall dependencies
pip install -r requirements.txt
```

### Agent Timeout

If agents are timing out, increase the timeout in `config.py`:

```python
agent_timeout_seconds: int = 60  # Increase from 30
```

## Next Steps

- Review discovery results in `sources/` directory
- Adjust agent prompts in `backend/agents/` if needed
- Test with different queries and cities
- Validate budget calculations
- Check narrative quality
