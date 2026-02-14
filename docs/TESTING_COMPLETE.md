# ✅ Backend Agent Testing - Setup Complete!

## What's Been Done

Your Sidequest backend is now fully configured for testing with multiple options:

### 1. Dependencies Installed ✅
- All Python packages installed successfully
- Fixed version conflicts in requirements.txt
- Backend is ready to run

### 2. Test Scripts Created ✅

**Three ways to test your agents:**

1. **`backend/test_agents_mock.py`** - Mock test (no API calls)
   - Runs all 5 agents with realistic mock data
   - Perfect for testing the workflow
   - No Vertex AI credentials needed

2. **`backend/test_agents.py`** - Real test (requires Vertex AI)
   - Runs actual Vertex AI agents
   - Requires Google Cloud credentials
   - Full production-like testing

3. **`backend/run_test.py`** - Interactive test runner
   - Menu-driven interface
   - Custom query support
   - Easy to use for quick tests

### 3. Discovery Data Dumping ✅

All discovery agent results are automatically saved to `sources/` directory:

```
sources/
├── discovery_mock_mock_202_20260214_132309.json
└── discovery_mock_mock_202_20260214_132556.json
```

Each file contains:
- Session ID and timestamp
- Complete list of discovered experiences
- All experience metadata (name, category, budget, location, solo_friendly, etc.)
- Source attribution and lore

### 4. Documentation Created ✅

- **`BACKEND_TESTING_README.md`** - Quick start guide
- **`backend/QUICKSTART.md`** - Detailed setup instructions
- **`backend/TESTING.md`** - Comprehensive testing guide
- **`backend/setup_and_test.bat`** - Automated setup script

## How to Run Tests

### Quick Test (Recommended First)

```bash
python backend/test_agents_mock.py
```

This will:
- ✅ Run all 5 agents (Discovery, Cultural Context, Community, Plot-Builder, Budget)
- ✅ Print detailed console output with emojis and formatting
- ✅ Save discovery results to `sources/discovery_mock_*.json`
- ✅ Show narrative itinerary, budget breakdown, and agent trace
- ✅ Complete in ~2 seconds

### Interactive Test

```bash
python backend/run_test.py
```

Menu options:
1. Run default mock test
2. Run custom query test (enter your own parameters)
3. Exit

### Real Vertex AI Test

1. Create `.env` file:
   ```bash
   copy .env.example .env
   ```

2. Add your Google Cloud credentials to `.env`

3. Run:
   ```bash
   python backend/test_agents.py
   ```

## What You'll See

### Console Output Example

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

📁 Mock discovery results saved to: sources/discovery_mock_*.json

============================================================
  RESULTS
============================================================

📖 NARRATIVE ITINERARY:

Your Bangalore Craft & Coffee Journey

Morning: Begin at Third Wave Coffee Roasters (8 AM)...
[Full narrative displayed]

────────────────────────────────────────────────────────────

💰 BUDGET BREAKDOWN:

Total: ₹3250
Within Budget: ❌

────────────────────────────────────────────────────────────

📊 AGENT TRACE:

✅ DISCOVERY: 500ms
✅ CULTURAL_CONTEXT: 300ms
✅ COMMUNITY: 300ms
✅ PLOT_BUILDER: 400ms
✅ BUDGET: 200ms

============================================================
  ✅ MOCK TEST COMPLETED
============================================================
```

### Discovery Results File

Check `sources/discovery_mock_*.json`:

```json
{
  "session_id": "mock_20260214132307",
  "timestamp": "2026-02-14T13:23:09.035538",
  "experiences_count": 6,
  "experiences": [
    {
      "name": "Clay Station Pottery Workshop",
      "category": "craft",
      "timing": "Weekday evenings 6-8 PM",
      "budget": 1500,
      "location": "Indiranagar, Bangalore",
      "solo_friendly": true,
      "source": "instagram_@claystation_blr",
      "description": "Beginner-friendly pottery wheel session...",
      "lore": "Started by a former tech professional..."
    },
    // ... more experiences
  ],
  "note": "Mock data for testing"
}
```

## Validation Checklist

Use the discovery results in `sources/` to validate:

- ✅ Experience quality and relevance to query
- ✅ Budget accuracy and calculations
- ✅ Solo-friendliness ratings
- ✅ Source attribution (Instagram, blogs, local knowledge)
- ✅ Category distribution (craft, food, heritage, etc.)
- ✅ Location details
- ✅ Timing information
- ✅ Lore and storytelling elements

## Next Steps

1. **Test the workflow** ✅ (Already done!)
   ```bash
   python backend/test_agents_mock.py
   ```

2. **Review discovery results**
   - Open files in `sources/` directory
   - Validate experience quality
   - Check budget calculations

3. **Customize test queries**
   - Edit test files to try different scenarios
   - Test various cities and budgets
   - Experiment with different interest pods

4. **Set up Vertex AI** (optional)
   - Configure `.env` with Google Cloud credentials
   - Run real agent tests
   - Compare mock vs real results

5. **Integrate with frontend**
   - Backend API is ready at `/api/generate-itinerary`
   - Start backend server: `python backend/main.py`
   - Connect frontend to test end-to-end

## Files Created

```
backend/
├── test_agents.py              # Real Vertex AI test
├── test_agents_mock.py         # Mock test (no API)
├── run_test.py                 # Interactive test runner
├── setup_and_test.bat          # Automated setup
├── QUICKSTART.md               # Quick start guide
└── TESTING.md                  # Detailed testing docs

sources/
├── discovery_mock_*.json       # Discovery results (auto-generated)

Root:
├── BACKEND_TESTING_README.md   # Main testing guide
└── TESTING_COMPLETE.md         # This file
```

## Troubleshooting

**Import errors?**
```bash
pip install -r backend/requirements.txt
```

**Want to test without Vertex AI?**
```bash
python backend/test_agents_mock.py
```

**Need to customize queries?**
```bash
python backend/run_test.py
# Select option 2 for custom query
```

**Discovery results not saving?**
- Check that `sources/` directory exists (auto-created)
- Verify write permissions
- Look for error messages in console output

## Summary

✅ Backend dependencies installed
✅ Mock test working perfectly
✅ Discovery agent dumping data to `sources/` directory
✅ Console output formatted and readable
✅ Multiple test scripts available
✅ Documentation complete

**You're all set to test and validate your backend agents!** 🚀

Run `python backend/test_agents_mock.py` anytime to test the full workflow.
