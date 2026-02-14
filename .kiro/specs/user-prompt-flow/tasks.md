# Implementation Plan

- [ ] 1. Implement request validation and API endpoint enhancements
  - Add comprehensive input validation for ItineraryRequest fields
  - Implement query length limits (max 500 characters)
  - Add social media URL validation (whitelist Instagram, YouTube, TikTok domains)
  - Enhance error responses with detailed validation messages
  - _Requirements: 4.2, 4.5_

- [ ] 2. Implement state initialization and transformation logic
- [ ] 2.1 Create state initialization function
  - Implement `_create_initial_state()` to convert ItineraryRequest to AgentState
  - Generate unique session_id using UUID
  - Convert budget_min/max to budget_range tuple
  - Initialize empty agent output fields and metadata arrays
  - Add initial trace entry with workflow start timestamp
  - _Requirements: 4.3, 4.4, 8.1_

- [ ] 2.2 Create state-to-response conversion function
  - Implement `_state_to_response()` to convert AgentState to ItineraryResponse
  - Build structured ExperienceItem objects from discovered_experiences
  - Format BudgetBreakdown with totals and line items
  - Extract cultural_context and social_scaffolding
  - Include complete agent_trace array
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 2.3 Write unit tests for state transformations
  - Test request-to-state conversion with various input combinations
  - Test state-to-response conversion with complete and partial data
  - Verify session_id generation and uniqueness
  - Test budget_range tuple creation
  - _Requirements: 4.3, 4.4_

- [ ] 3. Implement coordinator workflow orchestration
- [ ] 3.1 Implement sequential discovery agent execution
  - Call run_discovery() with initial state
  - Merge discovered_experiences into state
  - Handle discovery errors and append to errors array
  - Add trace entry with experiences_found count
  - _Requirements: 5.1, 6.1, 6.2, 6.3, 6.4, 7.3, 8.2_

- [ ] 3.2 Implement parallel agent execution for Cultural Context and Community
  - Use asyncio.gather() to run both agents concurrently
  - Pass state copies to prevent race conditions
  - Merge cultural_context and social_scaffolding back into state
  - Merge trace entries from both agents
  - Merge errors arrays from both agents
  - _Requirements: 5.2, 7.1, 7.2, 7.3, 8.2_

- [ ] 3.3 Implement sequential Plot-Builder execution
  - Call run_plot_builder() with enriched state
  - Update narrative_itinerary in state
  - Handle plot-builder errors gracefully
  - Add trace entry with narrative length metric
  - _Requirements: 5.3, 7.3, 8.2_

- [ ] 3.4 Implement sequential Budget Optimizer execution
  - Call run_budget_optimizer() with complete state
  - Update budget_breakdown in state
  - Handle budget optimizer errors gracefully
  - Add trace entry with budget metrics
  - _Requirements: 5.4, 7.3, 8.2_

- [ ] 3.5 Implement workflow finalization and trace completion
  - Calculate total workflow latency
  - Count agents_succeeded and agents_failed from trace
  - Add final coordinator trace entry with summary metrics
  - Call _state_to_response() to convert state to API response
  - _Requirements: 5.5, 8.3_

- [ ] 3.6 Write integration tests for coordinator workflow
  - Test full workflow with mock agent responses
  - Test parallel execution timing and state merging
  - Test error handling when individual agents fail
  - Verify trace entries are created correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4. Enhance Discovery Agent implementation
- [ ] 4.1 Implement robust JSON parsing and error handling
  - Add try-catch for JSON parsing with detailed error messages
  - Handle malformed JSON responses from Gemini
  - Return empty experiences array with error details on failure
  - Log response text snippet on parsing errors
  - _Requirements: 6.5, 7.5_

- [ ] 4.2 Add input sanitization and validation
  - Validate user_query is not empty
  - Sanitize query to remove potentially harmful content
  - Validate budget_range tuple has valid min/max values
  - Add logging for input parameters
  - _Requirements: 6.1, 4.2_

- [ ] 4.3 Implement experience validation
  - Validate each experience has required fields (name, category, budget, location)
  - Filter out experiences with missing critical data
  - Ensure budget values are integers
  - Validate category is one of allowed values
  - Ensure solo_friendly is boolean
  - _Requirements: 6.4_

- [ ] 4.4 Write unit tests for Discovery Agent
  - Test with various user queries and budget ranges
  - Test JSON parsing error handling
  - Test empty response handling
  - Test experience validation logic
  - Mock Gemini API responses
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5. Implement error handling and graceful degradation
- [ ] 5.1 Implement agent-level error handling
  - Wrap each agent call in try-catch block
  - Append error details to state.errors array with agent name and timestamp
  - Mark agent status as "error" in trace
  - Continue workflow execution after non-critical agent failures
  - _Requirements: 7.5, 10.1_

- [ ] 5.2 Implement partial response generation
  - Allow workflow to complete with partial data when agents fail
  - Return available experiences even if narrative generation fails
  - Return narrative without budget if budget optimizer fails
  - Include error details in response for debugging
  - _Requirements: 10.2_

- [ ] 5.3 Enhance API error responses
  - Return HTTP 400 for validation errors with Pydantic details
  - Return HTTP 500 for critical failures with descriptive messages
  - Include session_id in error responses for traceability
  - Log all errors with structured logging
  - _Requirements: 4.5, 10.3_

- [ ] 5.4 Write error handling tests
  - Test workflow continues when Cultural Context fails
  - Test workflow continues when Community Agent fails
  - Test partial response when Plot-Builder fails
  - Test error array population
  - Test HTTP error responses
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 6. Implement trace management and observability
- [ ] 6.1 Enhance trace entry creation
  - Add timestamp to all trace entries in ISO format
  - Include agent-specific metrics (experiences_found, narrative_length, etc.)
  - Add execution time per agent
  - Include status (started, success, error) for each agent
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 6.2 Implement trace aggregation
  - Collect traces from all agents into single array
  - Maintain chronological order of trace entries
  - Include workflow start and end entries
  - Calculate total latency and per-agent latency
  - _Requirements: 8.3, 8.4_

- [ ] 6.3 Add structured logging
  - Log all API requests with session_id
  - Log agent execution start/end with timing
  - Log errors with full stack traces
  - Use JSON format for log entries
  - _Requirements: 8.4_

- [ ] 6.4 Write tests for trace management
  - Test trace entry creation with correct timestamps
  - Test trace aggregation from multiple agents
  - Test latency calculations
  - Verify trace is included in API response
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 7. Implement frontend integration enhancements
- [ ] 7.1 Add CORS configuration validation
  - Verify CORS middleware allows frontend origins
  - Test preflight OPTIONS requests
  - Ensure credentials are handled correctly
  - Add environment-specific origin configuration
  - _Requirements: 4.1_

- [ ] 7.2 Implement response serialization
  - Ensure all response fields match ItineraryResponse schema
  - Handle None values for optional fields (budget_breakdown, collision_suggestion)
  - Serialize datetime objects to ISO strings
  - Validate response before returning
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 7.3 Write API integration tests
  - Test POST /api/generate-itinerary with valid payload
  - Test POST /api/generate-itinerary with invalid payload
  - Test CORS headers in response
  - Test response schema matches ItineraryResponse
  - Use FastAPI TestClient
  - _Requirements: 4.1, 4.2, 4.5_

- [ ] 8. Implement configuration and environment management
- [ ] 8.1 Add configuration validation
  - Validate GOOGLE_CLOUD_PROJECT is set on startup
  - Validate GOOGLE_API_KEY is present
  - Log warnings for missing optional config
  - Fail fast if critical config is missing
  - _Requirements: 4.3_

- [ ] 8.2 Implement model configuration per agent
  - Use AGENT_MODEL_CONFIG for all agent instantiations
  - Apply correct temperature and max_tokens per agent
  - Use Flash models for speed-critical agents
  - Use Pro models for reasoning-heavy agents
  - _Requirements: 6.2_

- [ ] 8.3 Write configuration tests
  - Test Settings loads from .env correctly
  - Test default values are applied
  - Test AGENT_MODEL_CONFIG has all required agents
  - Test Vertex AI initialization with valid config
  - _Requirements: 4.3_

- [ ] 9. Implement health check and monitoring endpoints
- [ ] 9.1 Enhance health check endpoint
  - Add Vertex AI connectivity check
  - Include service version in response
  - Add timestamp to health check response
  - Return HTTP 503 if Vertex AI is unreachable
  - _Requirements: 4.1_

- [ ] 9.2 Write health check tests
  - Test GET /health returns 200 with correct payload
  - Test health check includes all required fields
  - Mock Vertex AI connectivity for testing
  - _Requirements: 4.1_

- [ ] 10. Wire all components together and validate end-to-end flow
- [ ] 10.1 Integrate all agent implementations
  - Ensure all agents follow common pattern (extract inputs, call model, update state, add trace)
  - Verify agent dependencies are respected in coordinator
  - Test state flows correctly through all agents
  - Validate final response includes all agent outputs
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3_

- [ ] 10.2 Implement end-to-end validation
  - Test complete flow from API request to response
  - Verify all requirements are met
  - Test with various user queries and preferences
  - Validate response structure and content
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10.3 Write end-to-end integration tests
  - Test full user journey with real Gemini API
  - Test with different cities and budget ranges
  - Test with solo_preference true/false
  - Test with various interest_pods combinations
  - Verify agent_trace is complete and accurate
  - _Requirements: All requirements_
