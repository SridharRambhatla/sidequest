# Requirements Document

## Introduction

This document describes the user prompt flow in the Sidequest application, from when a user enters their query in the frontend prompt box through the agent processing pipeline to displaying the final output. The system orchestrates multiple AI agents to transform user input into a narrative-driven, personalized itinerary with cultural context, budget optimization, and social scaffolding.

## Glossary

- **Frontend**: The Next.js React application that provides the user interface
- **Backend**: The FastAPI Python server that handles API requests and agent orchestration
- **Coordinator**: The supervisor agent that orchestrates the execution of all specialized agents in sequence
- **Discovery Agent**: AI agent responsible for finding unique, hyperlocal experiences based on user query
- **Cultural Context Agent**: AI agent that enriches experiences with local cultural information
- **Community Agent**: AI agent that adds social scaffolding and solo-friendly recommendations
- **Plot-Builder Agent**: AI agent that crafts narrative-driven itineraries with story arcs
- **Budget Optimizer Agent**: AI agent that provides cost breakdowns and budget optimization
- **Agent State**: The shared data structure passed between agents containing user inputs and agent outputs
- **Session ID**: Unique identifier for each itinerary generation request
- **Vertex AI**: Google Cloud's AI platform used for Gemini model access
- **LangGraph**: Framework for building multi-agent workflows with state management

## Requirements

### Requirement 1

**User Story:** As a user, I want to enter my travel preferences through a simple interface, so that I can quickly start generating my personalized itinerary.

#### Acceptance Criteria

1. WHEN the user navigates to the home page, THE Frontend SHALL display an input interface with text description and URL paste options
2. WHEN the user enters a text query, THE Frontend SHALL accept natural language descriptions of travel preferences
3. WHEN the user pastes a social media URL, THE Frontend SHALL validate that the URL is from Instagram, YouTube, or TikTok
4. WHEN the user submits the form with valid input, THE Frontend SHALL store the form state in sessionStorage
5. WHEN the user submits the form, THE Frontend SHALL navigate to the generate page

### Requirement 2

**User Story:** As a user, I want to customize my preferences for budget, solo travel, and interests, so that the generated itinerary matches my specific needs.

#### Acceptance Criteria

1. WHEN the user expands the preferences section, THE Frontend SHALL display budget range slider with minimum 200 INR and maximum 10000 INR
2. WHEN the user adjusts the budget slider, THE Frontend SHALL update the displayed budget range in real-time
3. WHEN the user toggles solo preference, THE Frontend SHALL mark the request for solo-friendly experiences only
4. WHEN the user selects interest pods, THE Frontend SHALL allow multiple selections from predefined categories
5. WHEN the user submits with preferences, THE Frontend SHALL include all preference data in the API request

### Requirement 3

**User Story:** As a user, I want to see real-time progress of my itinerary generation, so that I understand what the system is doing and how long it will take.

#### Acceptance Criteria

1. WHEN the generate page loads with form data, THE Frontend SHALL automatically initiate the generation process
2. WHEN generation starts, THE Frontend SHALL display agent progress indicators for all five agents
3. WHILE generation is in progress, THE Frontend SHALL show the current agent status and overall progress percentage
4. WHEN an agent completes its task, THE Frontend SHALL update the progress indicator to show completion
5. WHEN all agents complete, THE Frontend SHALL navigate to the itinerary results page

### Requirement 4

**User Story:** As a system, I want to receive and validate user requests through a REST API, so that I can process itinerary generation requests reliably.

#### Acceptance Criteria

1. WHEN the Frontend sends a POST request to /api/generate-itinerary, THE Backend SHALL accept the request with ItineraryRequest schema
2. WHEN the Backend receives a request, THE Backend SHALL validate that required fields (query or social_media_urls) are present
3. WHEN validation succeeds, THE Backend SHALL create an initial AgentState with user inputs and empty agent outputs
4. WHEN validation succeeds, THE Backend SHALL generate a unique session_id for the request
5. IF validation fails, THEN THE Backend SHALL return HTTP 400 error with validation details

### Requirement 5

**User Story:** As a coordinator, I want to orchestrate multiple agents in the correct sequence, so that each agent has the necessary context from previous agents.

#### Acceptance Criteria

1. WHEN the Coordinator receives an AgentState, THE Coordinator SHALL execute the Discovery Agent first
2. WHEN the Discovery Agent completes, THE Coordinator SHALL execute Cultural Context Agent and Community Agent in parallel
3. WHEN both parallel agents complete, THE Coordinator SHALL execute the Plot-Builder Agent
4. WHEN the Plot-Builder Agent completes, THE Coordinator SHALL execute the Budget Optimizer Agent
5. WHEN all agents complete, THE Coordinator SHALL return the final ItineraryResponse to the API endpoint

### Requirement 6

**User Story:** As a discovery agent, I want to find unique hyperlocal experiences based on user preferences, so that users discover meaningful activities beyond typical tourist attractions.

#### Acceptance Criteria

1. WHEN the Discovery Agent receives an AgentState, THE Discovery Agent SHALL extract user_query, city, and budget_range from the state
2. WHEN the Discovery Agent processes the query, THE Discovery Agent SHALL call Vertex AI Gemini 2.0 Flash model with the discovery system prompt
3. WHEN the Gemini API returns results, THE Discovery Agent SHALL parse the JSON response containing discovered_experiences array
4. WHEN parsing succeeds, THE Discovery Agent SHALL return 5-10 experiences with name, category, timing, budget, location, solo_friendly, source, and description fields
5. IF the API call fails, THEN THE Discovery Agent SHALL return an empty experiences array with error details

### Requirement 7

**User Story:** As an agent in the pipeline, I want to access shared state from previous agents, so that I can build upon their outputs to create a cohesive itinerary.

#### Acceptance Criteria

1. WHEN an agent receives the AgentState, THE agent SHALL have read access to all user inputs from the initial request
2. WHEN an agent receives the AgentState, THE agent SHALL have read access to outputs from all previously executed agents
3. WHEN an agent completes processing, THE agent SHALL update the AgentState with its outputs in the designated fields
4. WHEN an agent completes processing, THE agent SHALL append a trace entry with agent name, status, and timestamp
5. IF an agent encounters an error, THEN THE agent SHALL append error details to the errors array in AgentState

### Requirement 8

**User Story:** As a system, I want to track agent execution with detailed traces, so that I can provide observability and debug issues in the pipeline.

#### Acceptance Criteria

1. WHEN the Coordinator starts workflow execution, THE Coordinator SHALL append a trace entry with workflow start timestamp
2. WHEN each agent completes, THE Coordinator SHALL append a trace entry with agent name, status, execution time, and key metrics
3. WHEN the workflow completes, THE Coordinator SHALL append a final trace entry with total latency and success/failure counts
4. WHEN the Backend returns the response, THE Backend SHALL include the complete agent_trace array in the ItineraryResponse
5. WHEN errors occur, THE Backend SHALL include error details in both the trace and errors array

### Requirement 9

**User Story:** As a user, I want to see my generated itinerary with all enriched details, so that I can review the narrative, experiences, budget, and cultural context.

#### Acceptance Criteria

1. WHEN the Frontend receives the ItineraryResponse, THE Frontend SHALL store the complete response in sessionStorage
2. WHEN the itinerary page loads, THE Frontend SHALL display the narrative_itinerary as the main content
3. WHEN the itinerary page loads, THE Frontend SHALL display all discovered experiences with their details
4. WHEN the itinerary page loads, THE Frontend SHALL display the budget_breakdown with total estimate and line items
5. WHEN the itinerary page loads, THE Frontend SHALL display cultural_context and social_scaffolding information

### Requirement 10

**User Story:** As a system, I want to handle errors gracefully at each stage, so that users receive helpful feedback when something goes wrong.

#### Acceptance Criteria

1. WHEN an agent fails, THE Coordinator SHALL continue executing remaining agents where possible
2. WHEN a critical agent fails, THE Coordinator SHALL return a partial response with available data and error details
3. WHEN the Backend encounters an exception, THE Backend SHALL return HTTP 500 with a descriptive error message
4. WHEN the Frontend receives an error response, THE Frontend SHALL display an error state with retry option
5. WHEN the user clicks retry, THE Frontend SHALL reinitiate the generation process with the same form data
