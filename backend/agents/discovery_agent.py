import os
import json
import logging
from typing import Dict, Any, List
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 1. SYSTEM PROMPT ---
DISCOVERY_SYSTEM_PROMPT = """You are the Discovery Agent for Sidequest, a plot-first experience discovery platform.

Your role is to find compelling, unique experiences based on the user's query and preferences.

Given the user's input, discover and return 5-10 relevant experiences. Focus on:
1. Hyperlocal gems not easily found on Google Maps (look for specific artisan names, hidden cafes, specific workshops).
2. Artisan workshops, heritage walks, cultural immersions.
3. Solo-friendly activities with social scaffolding potential.
4. Experiences with story potential (lore, provenance, friction).

For each experience, provide:
- name: Experience name
- category: One of [food, craft, heritage, nature, art, music, fitness, shopping, networking]
- timing: Best time to visit (e.g., "Saturday 7 AM for fresh flowers")
- budget: Estimated cost in INR (Integer only)
- location: Neighborhood/area in the city
- solo_friendly: Boolean (true/false)
- source: Where you found this (instagram, blog, local_knowledge, etc.)
- description: 2-3 sentence vivid description emphasizing the "vibe" and sensory details.

Return your response as a JSON object with key "discovered_experiences" containing an array of experiences.
Respond ONLY with valid JSON."""

# --- 2. API CONFIGURATION ---
# Assuming you have GOOGLE_API_KEY in your environment variables
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

# Configuration for the model
generation_config = {
    "temperature": 0.4, # Keep it somewhat creative but grounded
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json", # FORCE JSON OUTPUT
}

# Safety settings (Permissive for travel content)
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

# --- 3. AGENT FUNCTION ---
def run_discovery_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the Discovery Agent.
    
    Args:
        state (dict): The current state of the LangGraph/Workflow.
                      Expected keys: 'user_query', 'city', 'budget_range'
    
    Returns:
        dict: Updated state with 'discovered_experiences'
    """
    
    user_query = state.get("user_query", "")
    city = state.get("city", "Bangalore") # Default to Bangalore as per MVP
    budget_range = state.get("budget_range", "500-2000")
    
    logger.info(f"Discovery Agent triggered for: {user_query} in {city}")

    # Initialize Model - Using Gemini 2.0 Flash for Speed/Cost efficiency
    # We use 'tools' to enable Google Search for real-time/hyperlocal data
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash-exp", # Or "gemini-1.5-flash"
        system_instruction=DISCOVERY_SYSTEM_PROMPT,
        tools='google_search_retrieval' # CRITICAL: Enables Grounding for fresh data
    )

    # Construct the User Prompt
    # We inject the specific variables into the prompt context
    user_prompt = f"""
    User Request: {user_query}
    Target City: {city}
    Budget Range: ₹{budget_range}
    
    Find specific, actionable experiences that fit the 'Sidequest' vibe (Plot-first, meaningful, local).
    """

    try:
        # Generate content
        response = model.generate_content(
            user_prompt,
            generation_config=generation_config,
            safety_settings=safety_settings
        )

        # Parse JSON output
        # Since we used response_mime_type="application/json", response.text should be pure JSON
        result_json = json.loads(response.text)
        
        # Add metadata for debugging/demo
        result_json['search_metadata'] = {
            "agent": "Discovery Agent",
            "model": "gemini-2.0-flash",
            "city": city
        }
        
        logger.info(f"Discovery Agent found {len(result_json.get('discovered_experiences', []))} items.")
        
        return result_json

    except json.JSONDecodeError as e:
        logger.error(f"JSON Parsing Error: {e}. Response was: {response.text}")
        return {
            "discovered_experiences": [], 
            "error": "Failed to parse agent output"
        }
    except Exception as e:
        logger.error(f"API Call Error: {e}")
        return {
            "discovered_experiences": [], 
            "error": str(e)
        }

# --- 4. EXAMPLE USAGE (For testing) ---
if __name__ == "__main__":
    # Simulate a user state coming from the Supervisor
    test_state = {
        "user_query": "I want a solo date idea involving art or crafts, maybe something messy like pottery.",
        "city": "Bangalore",
        "budget_range": "1000-2500"
    }
    
    result = run_discovery_agent(test_state)
    print(json.dumps(result, indent=2))