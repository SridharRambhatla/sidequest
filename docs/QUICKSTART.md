# Quick Start Guide - Backend Testing

## Option 1: Automated Setup (Recommended)

Run the setup script that will install dependencies and run tests:

```bash
cd backend
setup_and_test.bat
```

This will:
1. Install all Python dependencies
2. Check for .env configuration
3. Let you choose between real or mock agent testing
4. Save results to `sources/` directory

## Option 2: Manual Setup

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Run Mock Test (No Vertex AI needed)

Test the agent workflow without API calls:

```bash
python test_agents_mock.py
```

This will:
- Run all agents with mock data
- Print detailed output to console
- Save discovery results to `sources/discovery_mock_*.json`

### Step 3: Run Real Test (Requires Vertex AI)

First, set up your `.env` file:

```bash
# Copy example
copy .env.example .env

# Edit .env and add your Google Cloud credentials
```

Then run:

```bash
python test_agents.py
```

## What to Expect

### Console Output

You'll see:
- 🔍 Discovery agent finding experiences
- 🌍 Cultural context being added
- 👥 Community/social scaffolding
- 📖 Narrative itinerary generation
- 💰 Budget breakdown
- 📊 Agent execution trace with timing

### Files Created

Check the `sources/` directory for:
- `discovery_*.json` - Full discovery agent results
- Each file contains:
  - Session ID
  - Timestamp
  - List of discovered experiences with all details

### Example Output

```
🚀 Starting Mock Agent Testing

============================================================
  SIDEQUEST MOCK AGENT TESTING
============================================================

📝 Test Query: Solo-friendly pottery workshop and artisan coffee experiences
📍 City: Bangalore
💵 Budget: ₹500 - ₹3000

🔍 Running Discovery Agent (MOCK)...
   ✅ Found 6 experiences

🌍 Running Cultural Context Agent (MOCK)...
   ✅ Cultural context added

👥 Running Community Agent (MOCK)...
   ✅ Social scaffolding added

📖 Running Plot-Builder Agent (MOCK)...
   ✅ Narrative created

💰 Running Budget Optimizer Agent (MOCK)...
   ✅ Budget calculated: ₹3250

📁 Mock discovery results saved to: sources/discovery_mock_20260214_143022.json
```

## Validating Results

Open the JSON file in `sources/` to validate:

```json
{
  "session_id": "mock_20260214143022",
  "timestamp": "2026-02-14T14:30:22",
  "experiences_count": 6,
  "experiences": [
    {
      "name": "Clay Station Pottery Workshop",
      "category": "craft",
      "budget": 1500,
      "solo_friendly": true,
      "location": "Indiranagar, Bangalore",
      "description": "Beginner-friendly pottery wheel session...",
      ...
    }
  ]
}
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'pydantic'"

Run: `pip install -r requirements.txt`

### "Vertex AI calls will fail"

This is expected if you haven't configured Google Cloud. Use the mock test instead:
```bash
python test_agents_mock.py
```

### Import errors

Make sure you're running from the backend directory:
```bash
cd backend
python test_agents_mock.py
```

## Next Steps

1. ✅ Run mock test to verify setup
2. ✅ Check `sources/` directory for output files
3. ✅ Review the narrative itinerary in console
4. Configure Vertex AI for real agent testing
5. Customize test queries in the test files
6. Integrate with frontend

## Customizing Tests

Edit `test_agents_mock.py` or `test_agents.py` to change:
- Query text
- City
- Budget range
- Interest pods
- Solo preference

Look for the `test_request` or state initialization section.
