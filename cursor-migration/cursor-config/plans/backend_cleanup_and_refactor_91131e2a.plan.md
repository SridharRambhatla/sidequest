---
name: Backend Cleanup and Refactor
overview: Clean up unused test files, fix duplicate dependencies in requirements.txt, and consolidate duplicate code patterns without breaking existing functionality.
todos:
  - id: delete-unused
    content: Delete 4 unused/empty/duplicate test files
    status: completed
  - id: fix-requirements
    content: Clean up duplicate entries in requirements.txt
    status: completed
  - id: fix-validate
    content: Fix hardcoded timestamp in validate_sources.py
    status: completed
  - id: fix-runtest
    content: Fix import path in run_test.py
    status: completed
  - id: add-utility
    content: Add strip_markdown_json utility function to helpers.py
    status: completed
  - id: refactor-agents
    content: Update 4 Vertex AI agents to use the new utility function
    status: completed
  - id: verify-lints
    content: Run lint check on all modified files
    status: completed
isProject: false
---

# Backend Cleanup and Refactoring Plan

## Current State Analysis

The backend is well-structured with a working multi-agent system (5 agents + coordinator). However, there are several cleanup opportunities:

### Files to Delete (Unused/Empty/Duplicate)

| File | Reason |
|------|--------|
| `demo_discovery_agent.py` | Empty file (0 bytes) |
| `test_interest_pods_fix.py` | Duplicates `test/test_discovery_categories.py` |
| `test_api_simple.py` | Duplicates `test/test_api_request.py` |
| `test_discovery_direct.py` | Minimal 22-line version covered by `test/test_discovery_live.py` |

### Files to Fix

**1. `requirements.txt` - Duplicate Entries**

Current state has duplicate package declarations:

```python
# Lines 8 & 13: langchain-google-vertexai (>=2.0.12 and ==2.0.12)
# Lines 11 & 16: langgraph (>=0.2.0 and >=0.2.60)
# Lines 12 & 17: langchain-core (>=0.3.0 and >=0.3.28)
```

Fix: Keep only the latest version constraints.

**2. `validate_sources.py` - Hardcoded Timestamp**

Line 7 has:
```python
summary_file = "sources/summary_20260214_142930.json"
```

Fix: Find latest summary file dynamically using glob pattern.

**3. `run_test.py` - Wrong Import Path**

Line 14 imports from root level:
```python
from test_agents_mock import run_mock_workflow
```

But `test_agents_mock.py` is in `test/` directory.

Fix: Update import to `from test.test_agents_mock import run_mock_workflow`.

---

## Refactoring Opportunities (Non-Breaking)

### Extract Common JSON Parsing to Utils

All 4 Vertex AI agents have identical markdown-stripping logic (~6 lines each):

```python
# In budget_agent.py, community_agent.py, cultural_context_agent.py, plot_builder_agent.py
content = response.content
if content.startswith("```json"):
    content = content[7:]
if content.startswith("```"):
    content = content[3:]
if content.endswith("```"):
    content = content[:-3]
```

Extract to [`utils/helpers.py`](backend/utils/helpers.py) as `strip_markdown_json()`.

---

## Architectural Notes (Document, Don't Change)

**SDK Inconsistency**: `discovery_agent.py` uses `google.generativeai` (Gemini API directly) while other agents use `langchain_google_vertexai` (ChatVertexAI). This appears intentional for different model capabilities (Gemini 2.0 Flash vs Vertex AI models) and should not be changed without further investigation.

---

## Implementation Steps

1. Delete empty/duplicate test files (4 files)
2. Fix `requirements.txt` duplicate entries
3. Fix `validate_sources.py` hardcoded timestamp
4. Fix `run_test.py` import path
5. Extract JSON parsing utility function
6. Update all 4 Vertex AI agents to use the new utility
7. Verify no lint errors introduced

---

## Files That Will Be Modified

- [`backend/requirements.txt`](backend/requirements.txt) - Remove duplicates
- [`backend/validate_sources.py`](backend/validate_sources.py) - Dynamic file lookup
- [`backend/run_test.py`](backend/run_test.py) - Fix import path
- [`backend/utils/helpers.py`](backend/utils/helpers.py) - Add utility function
- [`backend/agents/budget_agent.py`](backend/agents/budget_agent.py) - Use utility
- [`backend/agents/community_agent.py`](backend/agents/community_agent.py) - Use utility
- [`backend/agents/cultural_context_agent.py`](backend/agents/cultural_context_agent.py) - Use utility
- [`backend/agents/plot_builder_agent.py`](backend/agents/plot_builder_agent.py) - Use utility

## Files That Will Be Deleted

- `backend/demo_discovery_agent.py`
- `backend/test_interest_pods_fix.py`
- `backend/test_api_simple.py`
- `backend/test_discovery_direct.py`

## Risk Assessment

- **Low Risk**: All changes are additive or delete unused code
- **No Breaking Changes**: Existing API endpoints and agent workflow unchanged
- **Backward Compatible**: New utility function only used by internal agents
