# Sidequest Backend Testing - Quick Reference Card

## 🚀 Quick Commands

### Run Mock Test (No API needed)
```bash
python backend/test_agents_mock.py
```

### Run Interactive Test
```bash
python backend/run_test.py
```

### Run Real Vertex AI Test
```bash
python backend/test_agents.py
```

### Clean Test Data
```bash
python backend/clean_test_data.py
```

### Start Backend Server
```bash
python backend/main.py
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `backend/test_agents_mock.py` | Mock test without API calls |
| `backend/test_agents.py` | Real Vertex AI agent test |
| `backend/run_test.py` | Interactive test runner |
| `backend/clean_test_data.py` | Clean up test results |
| `sources/*.json` | Discovery agent results |

## 📊 What Gets Saved

Discovery results are automatically saved to:
```
sources/discovery_<session_id>_<timestamp>.json
```

Each file contains:
- Session ID
- Timestamp
- Experience count
- Full list of discovered experiences with all details

## ✅ Validation Checklist

Check discovery results for:
- [ ] Experience relevance to query
- [ ] Budget accuracy
- [ ] Solo-friendliness ratings
- [ ] Source attribution
- [ ] Location details
- [ ] Timing information
- [ ] Lore/storytelling elements

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Import errors | `pip install -r backend/requirements.txt` |
| No Vertex AI | Use `test_agents_mock.py` instead |
| Custom query | Use `run_test.py` option 2 |
| Clean test data | Run `clean_test_data.py` |

## 📖 Documentation

- `BACKEND_TESTING_README.md` - Main guide
- `backend/QUICKSTART.md` - Quick start
- `backend/TESTING.md` - Detailed testing
- `TESTING_COMPLETE.md` - Setup summary

## 🎯 Next Steps

1. Run mock test: `python backend/test_agents_mock.py`
2. Check `sources/` directory for results
3. Review console output
4. Validate discovery data
5. Configure Vertex AI (optional)
6. Test with custom queries

---

**Need help?** Check `BACKEND_TESTING_README.md` for detailed instructions.
