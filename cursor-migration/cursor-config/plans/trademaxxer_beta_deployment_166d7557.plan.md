---
name: TradeMaxxer Beta Deployment
overview: "Build all remaining gaps for TradeMaxxer's private beta deployment: infrastructure (Docker, beta auth, admin API), quality evaluator agent, Streamlit admin dashboard, feedback endpoint, and integration tests."
todos:
  - id: phase1-model
    content: Add BetaAccessKey model to apps/api/models.py
    status: completed
  - id: phase1-config
    content: Add beta_auth_enabled to ApiSettings in apps/api/config.py
    status: completed
  - id: phase1-middleware
    content: Create apps/api/middleware/beta_auth.py (+ __init__.py)
    status: completed
  - id: phase1-admin
    content: Create apps/api/routers/admin.py with key management + health endpoints
    status: completed
  - id: phase1-main
    content: Update apps/api/main.py — add middleware, admin router, feedback router, start_time
    status: completed
  - id: phase1-docker
    content: Create Dockerfile, docker-compose.yml, railway.toml, vercel.json
    status: completed
  - id: phase2-evaluator
    content: Create src/trademaxxer/agents/evaluators/quality_evaluator.py
    status: completed
  - id: phase3-dashboard
    content: Create apps/admin/ (master_dashboard.py, requirements.txt, Dockerfile)
    status: completed
  - id: phase4-feedback
    content: Create apps/api/routers/feedback.py
    status: completed
  - id: phase5-tests
    content: Create tests/integration/test_beta_deployment.py
    status: completed
  - id: phase5-docs
    content: Create docs/LAUNCH_CHECKLIST.md
    status: completed
isProject: false
---

# TradeMaxxer Beta Deployment — Remaining Gaps

## Pre-Implementation Note: Model Constant Bug

`base_agent.py` line 161 references `ClaudeModel.DEEPSEEK_V3`, which does not exist in the `ClaudeModel` enum ([`src/trademaxxer/llm/claude_client.py`](trademaxxer/src/trademaxxer/llm/claude_client.py) lines 110-111 only has `HAIKU` and `SONNET`). All new code will use `ClaudeModel.HAIKU` (fast/cheap) and `ClaudeModel.SONNET` (deep reasoning) — the actual enum values. Fixing the existing `DEEPSEEK_V3` references in other agents is out of scope unless requested.

---

## Phase 1: Infrastructure (7 files: 4 new, 3 modified)

### 1.1 Add `BetaAccessKey` model

**Modify**: [`apps/api/models.py`](trademaxxer/apps/api/models.py) — append a new `BetaAccessKey` ORM class after `AgentEvaluation`. Fields: `key_hash` (SHA-256, unique, indexed), `key_prefix`, `user_label`, `created_at`, `expires_at`, `is_active`, `daily_request_count`, `last_request_date`, `total_requests`, `last_used_at`. Follow existing patterns (`Mapped`, `mapped_column`, `utcnow`).

### 1.2 Add `beta_auth_enabled` to config

**Modify**: [`apps/api/config.py`](trademaxxer/apps/api/config.py) — add one field to `ApiSettings`:
```python
beta_auth_enabled: bool = Field(default=False, alias="BETA_AUTH_ENABLED")
```
Default `False` so dev mode works unchanged.

### 1.3 Create beta auth middleware

**New file**: `apps/api/middleware/__init__.py` (empty) + `apps/api/middleware/beta_auth.py`

Async middleware function `validate_beta_key(request, session)` that:
- Exempts `/health`, `/ready`, `/docs`, `/openapi.json`, `/redoc`
- Exempts `/admin/*` from localhost only
- Extracts key from `X-API-Key` header or `api_key` query param
- Looks up SHA-256 hash in `BetaAccessKey` table
- Checks `is_active`, `expires_at`, daily rate limit (5000/day)
- Updates usage counters
- Stores `beta_user` in `request.state`

Uses existing `session_scope(db)` pattern from [`apps/api/db.py`](trademaxxer/apps/api/db.py).

### 1.4 Create admin router

**New file**: `apps/api/routers/admin.py`

Endpoints (all guarded by `require_local` dependency):
- `GET /admin/health` — service status, uptime, version
- `GET /admin/keys` — list beta keys (masked)
- `POST /admin/keys` — generate new key (`secrets.token_urlsafe(32)`, store hash)
- `DELETE /admin/keys/{key_prefix}` — revoke key
- `POST /admin/keys/{key_prefix}/extend` — extend expiry
- `GET /admin/agents/config` — agent configuration map
- `POST /admin/cache/clear` — clear caches

Uses existing `session_scope`, `Db`, patterns from other routers.

### 1.5 Update main.py

**Modify**: [`apps/api/main.py`](trademaxxer/apps/api/main.py)

Three changes:
1. Import and register admin router (~line 182):
   ```python
   from apps.api.routers import admin as admin_router
   app.include_router(admin_router.router)
   ```
2. Import and register feedback router (Phase 4, done here for batching)
3. Add beta auth middleware (conditional on `api_settings.beta_auth_enabled`)
4. Track `app.state.start_time = time.time()` in `startup_event()`

### 1.6 Docker + Deployment configs

**New files**:
- `apps/api/Dockerfile` — Python 3.11-slim, install requirements, `pip install -e .`, expose 8080, healthcheck, uvicorn CMD
- `docker-compose.yml` — backend service (port 8080, env vars, volumes for data/logs), admin profile (port 8501)
- `railway.toml` — dockerfile builder pointing to `apps/api/Dockerfile`, healthcheck path `/health`
- `apps/frontend/vercel.json` — Vite framework config with SPA rewrite

---

## Phase 2: Quality Evaluator (1 new file)

### 2.1 Create quality evaluator

**New file**: `src/trademaxxer/agents/evaluators/quality_evaluator.py`

`QualityEvaluator(BaseAgent)` using `ClaudeModel.HAIKU` for fast evaluation. Scores agent outputs on 5 dimensions (0-100): relevance, accuracy, actionability, reasoning, risk_coverage. Returns `EvalResult` dataclass. Uses `_complete_json_with_cot()` from BaseAgent.

Note: Must match actual `BaseAgent.__init__()` signature — keyword-only args with `*`, `enable_self_critique` parameter.

---

## Phase 3: Admin Dashboard (3 new files)

### 3.1 Streamlit dashboard

**New files** under `apps/admin/`:
- `master_dashboard.py` — Main Streamlit app with sidebar navigation and 6 tabs:
  - System Health (calls `/admin/health`)
  - Agent Control (calls `/admin/agents/config`)
  - Beta Users (calls `/admin/keys`, CRUD)
  - Metrics (cost breakdown, latency, requests)
  - Logs (filterable log display)
  - Configuration (rate limits, feature flags)
- `requirements.txt` — streamlit, requests, pandas, plotly
- `Dockerfile` — Python 3.11-slim, streamlit run on port 8501

Dashboard calls backend admin API at `http://localhost:8080` by default.

---

## Phase 4: Feedback Endpoint (1 new file)

### 4.1 Feedback router

**New file**: `apps/api/routers/feedback.py`

Single endpoint:
- `POST /api/v1/feedback/submit` — accepts `request_id`, `thumbs_up` (bool), optional `comment`. Logs feedback and stores in `AgentEvaluation` table (which already has `user_feedback` column).

Registered in `main.py` (done as part of 1.5).

---

## Phase 5: Tests + Docs (2 new files)

### 5.1 Integration tests

**New file**: `tests/integration/test_beta_deployment.py`

pytest-async tests covering:
- Health check accessible (200)
- Protected endpoints require API key (401)
- Admin endpoints localhost-only
- Beta key generation flow
- Authenticated request with valid key

### 5.2 Launch checklist

**New file**: `docs/LAUNCH_CHECKLIST.md` — Pre-launch, launch day, and post-launch checklists.

---

## File Summary

**New files (12)**:
- `apps/api/Dockerfile`
- `apps/api/middleware/__init__.py`
- `apps/api/middleware/beta_auth.py`
- `apps/api/routers/admin.py`
- `apps/api/routers/feedback.py`
- `apps/admin/master_dashboard.py`
- `apps/admin/requirements.txt`
- `apps/admin/Dockerfile`
- `apps/frontend/vercel.json`
- `docker-compose.yml`
- `railway.toml`
- `tests/integration/test_beta_deployment.py`
- `docs/LAUNCH_CHECKLIST.md`
- `src/trademaxxer/agents/evaluators/quality_evaluator.py`

**Modified files (3)**:
- `apps/api/models.py` — add `BetaAccessKey`
- `apps/api/config.py` — add `beta_auth_enabled`
- `apps/api/main.py` — add middleware, admin + feedback routers, start_time tracking
