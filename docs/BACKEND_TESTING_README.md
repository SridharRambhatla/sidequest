# Backend Agent Testing - Quick Start

## ✅ Setup Complete!

Your backend is now ready for testing. Dependencies have been installed and the mock test has been verified.

## Running Tests

### Option 1: Mock Test (No Vertex AI Required) ✨

Test the complete agent workflow with mock data:

```bash
python backend/test_agents_mock.py
```

**What it does:**
- Runs all 5 agents (Discovery, Cultural Context, Community, Plot-Builder, Budget)
- Prints detailed console output
- Saves discovery results to `sources/` directory
- No API calls or credentials needed

### Option 2: Real Agents (Requires Vertex AI)

1. Create `.env` file from template:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your Google Cloud credentials:
   ```
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   ```

3. Run the real agent test:
   ```bash
   python backend/test_agents.py
   ```

## What You'll See

### Console Output
```
🚀 Starting Agent Testing

🔍 Running Discovery Agent...
   ✅ Found 6 experiences

🌍 Running Cultural Context Agent...
   ✅ Cultural context added

👥 Running Community Agent...
   ✅ Social scaffolding added

📖 Running Plot-Builder Agent...
   ✅ Narrative created

💰 Running Budget Optimizer Agent...
   ✅ Budget calculated: ₹3250

📁 Discovery results saved to: sources/discovery_*.json
```

### Files Created

Check `sources/` directory for JSON files containing:
- Session ID and timestamp
- Complete list of discovered experiences
- All experience details (name, category, budget, location, etc.)

Example: `sources/discovery_mock_mock_202_20260214_132309.json`

## Validating Discovery Results

Open any JSON file in `sources/` to review:

```json
{
  "session_id": "mock_20260214132307",
  "timestamp": "2026-02-14T13:23:09",
  "experiences_count": 6,
  "experiences": [
    {
      "name": "Clay Station Pottery Workshop",
      "category": "craft",
      "budget": 1500,
      "solo_friendly": true,
      "location": "Indiranagar, Bangalore",
      "description": "Beginner-friendly pottery wheel session...",
      "lore": "Started by a former tech professional..."
    }
  ]
}
```

## Customizing Tests

Edit the test files to change:
- Query text
- City
- Budget range
- Interest pods
- Solo preference

Look for the state initialization or `test_request` section in:
- `backend/test_agents_mock.py` (mock version)
- `backend/test_agents.py` (real version)

## Next Steps

1. ✅ Review discovery results in `sources/` directory
2. ✅ Validate experience quality and relevance
3. ✅ Check budget calculations
4. ✅ Review narrative itinerary quality
5. Configure Vertex AI for real agent testing
6. Customize agent prompts in `backend/agents/`
7. Integrate with frontend

## Documentation

- `backend/QUICKSTART.md` - Detailed setup guide
- `backend/TESTING.md` - Comprehensive testing documentation
- `backend/setup_and_test.bat` - Automated setup script

## Troubleshooting

**Import errors?**
```bash
pip install -r backend/requirements.txt
```

**Want to test without Vertex AI?**
```bash
python backend/test_agents_mock.py
```

**Need to customize the query?**
Edit the test file and modify the request parameters.

---

Happy testing! 🚀
