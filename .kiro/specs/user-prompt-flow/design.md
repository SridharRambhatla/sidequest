# Design Document: Backend Flow Implementation

## Overview

This design document describes the backend architecture for the Sidequest user prompt flow, from receiving user input through the FastAPI endpoint to orchestrating multiple AI agents and returning a narrative-driven itinerary. The system implements a supervisor pattern using LangGraph to coordinate 5 specialized Vertex AI Gemini agents that work sequentially and in parallel to transform user preferences into personalized travel experiences.

## Architecture

### High-Level Architecture

The backend follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│              HTTP POST /api/generate-itinerary           │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  API Layer (FastAPI)                     │
│  • Request validation (Pydantic)                         │
│  • CORS middleware                                       │
│  • Error handling                                        │
│  • Response serialization                                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│            Coordinator (Supervisor Agent)                │
│  • State initialization                                  │
│  • Agent orchestration                                   │
│  • Trace management                                      │
│  • State-to-response conversion                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Agent Pipeline                          │
│                                                          │
│  Step 1: Discovery Agent (Sequential)                   │
│          ↓                                               │
│  Step 2: Cultural Context + Community (Parallel)        │
│          ↓                                               │
│  Step 3: Plot-Builder Agent (Sequential)                │
│          ↓                                               │
│  Step 4: Budget Optimizer (Sequential)                  │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Vertex AI (Gemini Models)                   │
│  • gemini-2.0-flash (fast agents)                       │
│  • gemini-2.0-pro (reasoning agents)                    │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **API Framework**: FastAPI 0.100+
- **AI Platform**: Google Vertex AI / Gemini API
- **Orchestration**: LangGraph (implicit via coordinator pattern)
- **Validation**: Pydantic v2
- **Async Runtime**: asyncio
- **Configuration**: python-dotenv, pydantic-settings

## Components and Interfaces

### 1. API Layer (`backend/main.py`)

#### Responsibilities
- Expose REST endpoints for itinerary generation
- Validate incoming requests using Pydantic schemas
- Handle CORS for frontend communication
- Initialize Vertex AI on application startup
- Convert exceptions to appropriate HTTP responses

#### Key Endpoints

**POST /api/generate-itinerary**
- **Input**: `ItineraryRequest` (Pydantic model)
- **Output**: `ItineraryResponse` (Pydantic model)
- **Error Handling**: Returns HTTP 500 with error details on failure

**GET /health**
- **Output**: `{"status": "ok", "service": "sidequest-api"}`
- **Purpose**: Health check for deployment monitoring

#### Middleware
- **CORSMiddleware**: Allows requests from localhost:3000 (frontend dev server)
- **Lifespan Context**: Initializes Vertex AI with project/location on startup

### 2. Configuration Layer (`backend/config.py`)

#### Responsibilities
- Load environment variables from `.env` file
- Provide centralized configuration for all agents
- Define model assignments per agent role
- Manage API keys and project settings

#### Configuration Schema

```python
class Settings:
    # Google Cloud
    google_cloud_project: str
    google_cloud_location: str = "us-central1"
    
    # Server
    backend_port: int = 8000
    backend_host: str = "0.0.0.0"
    
    # Models
    flash_model: str = "gemini-2.0-flash"
    pro_model: str = "gemini-2.0-pro"
    
    # Agent Settings
    max_retries: int = 3
    agent_timeout_seconds: int = 30
```

#### Agent Model Configuration

| Agent | Model | Temperature | Max Tokens | Rationale |
|-------|-------|-------------|------------|-----------|
| Discovery | Flash | 0.3 | 4096 | Fast multi-source search with moderate creativity |
| Cultural Context | Pro | 0.4 | 4096 | Deep cultural reasoning requires Pro model |
| Plot-Builder | Pro | 0.7 | 8192 | Creative narrative generation needs high temperature |
| Budget | Flash | 0.1 | 2048 | Deterministic numerical analysis |
| Community | Flash | 0.2 | 2048 | Pattern matching for solo-friendly indicators |

### 3. State Management (`backend/state/schemas.py`)

#### Data Models

**ItineraryRequest** (API Input)
```python
{
    "query": str,                    # Required
    "social_media_urls": list[str],  # Optional
    "city": str = "Bangalore",
    "budget_min": int = 200,
    "budget_max": int = 5000,
    "num_people": int = 1,
    "solo_preference": bool = True,
    "interest_pods": list[str] = [],
    "crowd_preference": str = "relatively_niche",
    "start_date": str | None,
    "end_date": str | None
}
```

**AgentState** (Internal State)
```python
{
    # User inputs (from request)
    "user_query": str,
    "social_media_urls": list[str],
    "city": str,
    "budget_range": tuple[int, int],
    "num_people": int,
    "solo_preference": bool,
    "interest_pods": list[str],
    "crowd_preference": str,
    "start_date": str,
    "end_date": str,
    
    # Agent outputs (populated during pipeline)
    "discovered_experiences": list[dict],
    "cultural_context": dict,
    "narrative_itinerary": str,
    "budget_breakdown": dict,
    "social_scaffolding": dict,
    "collision_suggestion": dict,
    
    # Metadata
    "agent_trace": list[dict],
    "errors": list[dict],
    "session_id": str
}
```

**ItineraryResponse** (API Output)
```python
{
    "narrative_itinerary": str,
    "experiences": list[ExperienceItem],
    "cultural_context": dict,
    "budget_breakdown": BudgetBreakdown | None,
    "social_scaffolding": dict,
    "collision_suggestion": CollisionSuggestion | None,
    "agent_trace": list[dict],
    "session_id": str
}
```

### 4. Coordinator (`backend/agents/coordinator.py`)

#### Responsibilities
- Convert API request to initial AgentState
- Orchestrate agent execution in correct order
- Manage parallel agent execution (Cultural Context + Community)
- Merge agent outputs back into shared state
- Track execution traces for observability
- Handle partial failures gracefully
- Convert final state to API response

#### Workflow Execution

```python
async def run_workflow(request: ItineraryRequest) -> ItineraryResponse:
    # 1. Initialize state
    state = _create_initial_state(request)
    
    # 2. Discovery (sequential - needed by all)
    state = run_discovery(state)
    
    # 3. Cultural Context + Community (parallel)
    results = await asyncio.gather(
        run_cultural_context(state),
        run_community(state)
    )
    state = merge_parallel_results(state, results)
    
    # 4. Plot-Builder (sequential - needs context)
    state = await run_plot_builder(state)
    
    # 5. Budget Optimizer (sequential - final check)
    state = await run_budget_optimizer(state)
    
    # 6. Convert to response
    return _state_to_response(state)
```

#### State Transformations

**Request → State**
- Generate unique `session_id` using UUID
- Convert `budget_min/max` to `budget_range` tuple
- Initialize empty agent output fields
- Create initial trace entry with workflow start timestamp

**State → Response**
- Extract agent outputs from state
- Build structured `ExperienceItem` objects
- Format `BudgetBreakdown` with totals and line items
- Include complete `agent_trace` for observability
- Attach `session_id` for trace retrieval

### 5. Discovery Agent (`backend/agents/discovery_agent.py`)

#### Responsibilities
- Parse user query and preferences from state
- Call Gemini API with discovery system prompt
- Search for hyperlocal, unique experiences
- Filter by budget, interests, and solo-friendliness
- Return 5-10 structured experiences
- Handle API errors gracefully

#### System Prompt Strategy

The discovery agent uses a specialized system prompt that emphasizes:
- Hyperlocal gems not on Google Maps
- Artisan workshops and cultural immersions
- Solo-friendly activities with social potential
- Story-rich experiences (lore, provenance, friction)

#### API Integration

```python
# Model Configuration
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    system_instruction=DISCOVERY_SYSTEM_PROMPT
)

# Generation Config
generation_config = {
    "temperature": 0.4,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json"  # Force JSON output
}

# Safety Settings (permissive for travel content)
safety_settings = {
    HarmCategory.HARM_CATEGORY_*: HarmBlockThreshold.BLOCK_NONE
}
```

#### Output Schema

```json
{
    "discovered_experiences": [
        {
            "name": "Experience name",
            "category": "food|craft|heritage|nature|art|music|fitness|shopping|networking",
            "timing": "Best time to visit",
            "budget": 1500,
            "location": "Neighborhood/area",
            "solo_friendly": true,
            "source": "instagram|blog|local_knowledge",
            "description": "2-3 sentence vivid description"
        }
    ],
    "search_metadata": {
        "agent": "Discovery Agent",
        "model": "gemini-2.0-flash",
        "city": "Bangalore"
    }
}
```

### 6. Other Agents (Cultural Context, Community, Plot-Builder, Budget)

#### Common Pattern

All agents follow a similar structure:
1. Extract relevant inputs from `AgentState`
2. Construct agent-specific prompt with context
3. Call appropriate Gemini model (Flash or Pro)
4. Parse JSON response
5. Update state with agent outputs
6. Append trace entry with metrics
7. Handle errors and append to errors array

#### Agent Dependencies

- **Discovery**: No dependencies (runs first)
- **Cultural Context**: Depends on discovered experiences
- **Community**: Depends on discovered experiences
- **Plot-Builder**: Depends on discovery + cultural context + community
- **Budget**: Depends on discovered experiences

## Data Models

### Experience Item

```python
class ExperienceItem:
    name: str                # "Pottery workshop at Clay Station"
    category: str            # "craft"
    timing: str              # "Saturday 10 AM - 12 PM"
    budget: int              # 1500 (INR)
    location: str            # "Indiranagar"
    solo_friendly: bool      # True
    source: str              # "instagram"
    lore: str                # Cultural backstory
    description: str         # Vivid 2-3 sentence description
```

### Budget Breakdown

```python
class BudgetBreakdown:
    total_estimate: int                  # 3500
    breakdown: list[dict]                # Line items per experience
    deals: list[str]                     # Available discounts
    within_budget: bool                  # True if <= budget_max
```

### Collision Suggestion

```python
class CollisionSuggestion:
    title: str                           # "Cross-pod collision"
    experiences: list[str]               # Experience names
    why: str                             # Rationale for combination
```

## Error Handling

### Validation Errors

**Trigger**: Invalid request payload (missing required fields, wrong types)
**Response**: HTTP 400 with Pydantic validation details
```json
{
    "detail": [
        {
            "loc": ["body", "query"],
            "msg": "field required",
            "type": "value_error.missing"
        }
    ]
}
```

### Agent Execution Errors

**Trigger**: Gemini API failure, timeout, rate limit
**Strategy**: 
- Continue workflow with partial results
- Append error to `errors` array in state
- Mark agent status as "error" in trace
- Return partial response with available data

**Example Error Entry**:
```python
{
    "agent": "discovery",
    "error": "API timeout after 30s",
    "timestamp": "2026-02-14T14:30:00Z"
}
```

### Critical Failures

**Trigger**: Coordinator crash, unhandled exception
**Response**: HTTP 500 with error message
```json
{
    "detail": "Itinerary generation failed: <error message>"
}
```

### Graceful Degradation

- If Discovery fails: Return empty experiences with error
- If Cultural Context fails: Continue without cultural annotations
- If Plot-Builder fails: Return raw experiences without narrative
- If Budget fails: Return experiences without cost breakdown

## Testing Strategy

### Unit Tests

**Target**: Individual agent functions
**Approach**: Mock Gemini API responses
**Coverage**:
- Discovery agent with various queries
- State transformation functions
- Request/response serialization
- Error handling paths

**Example**:
```python
def test_discovery_agent_success():
    mock_state = {
        "user_query": "pottery workshop",
        "city": "Bangalore",
        "budget_range": (500, 2000)
    }
    result = run_discovery(mock_state)
    assert len(result["discovered_experiences"]) > 0
    assert result["discovered_experiences"][0]["name"]
```

### Integration Tests

**Target**: Full workflow execution
**Approach**: Use real Gemini API with test queries
**Coverage**:
- End-to-end request → response flow
- Parallel agent execution
- State merging logic
- Trace generation

**Example**:
```python
async def test_full_workflow():
    request = ItineraryRequest(
        query="solo pottery workshop",
        city="Bangalore",
        budget_min=500,
        budget_max=2000
    )
    response = await run_workflow(request)
    assert response.narrative_itinerary
    assert len(response.experiences) > 0
    assert response.session_id
```

### API Tests

**Target**: FastAPI endpoints
**Approach**: Use TestClient for HTTP requests
**Coverage**:
- POST /api/generate-itinerary with valid payload
- POST /api/generate-itinerary with invalid payload
- GET /health endpoint
- CORS headers

**Example**:
```python
def test_generate_itinerary_endpoint():
    response = client.post("/api/generate-itinerary", json={
        "query": "pottery workshop",
        "city": "Bangalore"
    })
    assert response.status_code == 200
    assert "narrative_itinerary" in response.json()
```

### Load Tests

**Target**: Concurrent request handling
**Approach**: Use locust or k6 for load generation
**Metrics**:
- Requests per second
- P95/P99 latency
- Error rate under load
- Vertex AI quota consumption

## Performance Considerations

### Latency Optimization

**Parallel Execution**: Cultural Context + Community agents run concurrently
- Expected savings: ~3-5 seconds per request
- Implementation: `asyncio.gather()`

**Model Selection**: Use Flash for speed-critical agents
- Discovery: Flash (fast search)
- Budget: Flash (simple calculations)
- Plot-Builder: Pro (quality over speed)

**Caching Strategy** (Future):
- Cache discovered experiences by city + query hash
- TTL: 24 hours
- Invalidation: Manual or on source updates

### Scalability

**Stateless Design**: No server-side session storage
- All state passed through request/response
- Enables horizontal scaling

**Async I/O**: All agent calls use async/await
- Non-blocking Gemini API calls
- Efficient resource utilization

**Rate Limiting** (Future):
- Per-user rate limits (10 requests/minute)
- Global rate limits (1000 requests/minute)
- Graceful backoff on Vertex AI quota limits

### Cost Optimization

**Token Management**:
- Limit max_output_tokens per agent
- Use Flash models where possible (10x cheaper than Pro)
- Implement prompt caching for system instructions

**Request Batching** (Future):
- Batch multiple user requests to same city
- Share discovery results across similar queries

## Security Considerations

### Input Validation

- Pydantic schema validation for all inputs
- Sanitize user queries before passing to Gemini
- Validate social media URLs (whitelist domains)
- Limit query length (max 500 characters)

### API Key Management

- Store `GOOGLE_API_KEY` in environment variables
- Never log or expose API keys in responses
- Use separate keys for dev/staging/prod
- Rotate keys quarterly

### CORS Configuration

- Whitelist specific frontend origins
- Disable credentials for public endpoints
- Add rate limiting per origin

### Data Privacy

- No PII storage (stateless design)
- Session IDs are ephemeral UUIDs
- Agent traces contain no user-identifiable data
- Comply with GDPR (no data retention)

## Deployment Architecture

### Environment Variables

```bash
# Required
GOOGLE_CLOUD_PROJECT=sidequest-prod
GOOGLE_API_KEY=<gemini-api-key>

# Optional
GOOGLE_CLOUD_LOCATION=us-central1
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
LANGSMITH_API_KEY=<tracing-key>
LANGSMITH_TRACING=true
```

### Container Configuration

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Health Checks

- Endpoint: `GET /health`
- Interval: 30 seconds
- Timeout: 5 seconds
- Unhealthy threshold: 3 consecutive failures

### Monitoring

**Metrics**:
- Request count by endpoint
- Response latency (P50, P95, P99)
- Error rate by status code
- Agent execution time per agent
- Vertex AI token usage

**Logging**:
- Structured JSON logs
- Log levels: INFO (requests), ERROR (failures), DEBUG (agent traces)
- Include `session_id` in all logs for traceability

**Alerting**:
- Error rate > 5% for 5 minutes
- P95 latency > 30 seconds
- Vertex AI quota exhaustion

## Future Enhancements

### Streaming Responses

- Stream agent outputs as they complete
- Use Server-Sent Events (SSE) or WebSockets
- Update frontend progress bar in real-time

### Agent Trace Storage

- Persist traces to database (PostgreSQL/Firestore)
- Implement `GET /api/agent-trace/{session_id}` endpoint
- Enable replay and debugging of past requests

### Multi-City Support

- Expand beyond Bangalore to other Indian cities
- City-specific agent prompts and sources
- Localized cultural context

### Social Media Integration

- Extract experiences from Instagram Reels
- Parse YouTube video descriptions
- TikTok location tag analysis

### User Feedback Loop

- Collect user ratings on experiences
- Fine-tune agent prompts based on feedback
- Build preference profiles for returning users
