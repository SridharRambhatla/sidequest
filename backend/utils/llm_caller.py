"""
Shared Gemini LLM caller for all Sidequest agents via Vertex AI.

Replaces Perplexity API with cost-effective Gemini models.
"""

import os
import re
import logging
from typing import Optional

import vertexai
from vertexai.generative_models import GenerativeModel

logger = logging.getLogger(__name__)

# Initialize Vertex AI once at module load
vertexai.init(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
)


def _strip_fences(text: str) -> str:
    """
    Remove markdown code fences from LLM response.
    
    Extracts JSON content from markdown code blocks like:
    ```json
    {"key": "value"}
    ```
    
    Args:
        text: Raw LLM response text
        
    Returns:
        Cleaned text with code fences removed
    """
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    return match.group(1) if match else text


async def call_llm(
    system_prompt: str,
    user_prompt: str,
    model: str = "gemini-2.0-flash-001",
    temperature: float = 0.4,
    max_output_tokens: int = 8192,
) -> str:
    """
    Call Gemini LLM via Vertex AI asynchronously.
    
    This function replaces acall_perplexity() with a Gemini-based implementation
    using the same interface for easy migration.
    
    Args:
        system_prompt: System instructions for the model
        user_prompt: User query/request
        model: Gemini model name (default: gemini-pro)
        temperature: Sampling temperature (0.0-1.0)
        max_output_tokens: Maximum tokens in response
        
    Returns:
        Cleaned response text with code fences removed
        
    Raises:
        Exception: If Vertex AI call fails
    """
    try:
        # Initialize model
        gemini_model = GenerativeModel(model)
        
        # Combine system and user prompts
        # Gemini doesn't have separate system/user roles in the same way,
        # so we concatenate them with clear separation
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # Make async call to Gemini
        response = await gemini_model.generate_content_async(
            full_prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_output_tokens,
            }
        )
        
        # Extract text from response
        content = response.text
        
        # Clean up markdown code fences
        content = _strip_fences(content)
        
        logger.info(f"Gemini call successful: model={model}, tokens_approx={len(content)//4}")
        
        return content
        
    except Exception as e:
        logger.error(f"Gemini LLM call failed: {str(e)}")
        raise


def call_llm_sync(
    system_prompt: str,
    user_prompt: str,
    model: str = "gemini-pro",
    temperature: float = 0.4,
    max_output_tokens: int = 8192,
) -> str:
    """
    Call Gemini LLM via Vertex AI synchronously.
    
    Synchronous version for agents that don't use async/await.
    
    Args:
        system_prompt: System instructions for the model
        user_prompt: User query/request
        model: Gemini model name (default: gemini-pro)
        temperature: Sampling temperature (0.0-1.0)
        max_output_tokens: Maximum tokens in response
        
    Returns:
        Cleaned response text with code fences removed
        
    Raises:
        Exception: If Vertex AI call fails
    """
    try:
        # Initialize model
        gemini_model = GenerativeModel(model)
        
        # Combine system and user prompts
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # Make synchronous call to Gemini
        response = gemini_model.generate_content(
            full_prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_output_tokens,
            }
        )
        
        # Extract text from response
        content = response.text
        
        # Clean up markdown code fences
        content = _strip_fences(content)
        
        logger.info(f"Gemini call successful: model={model}, tokens_approx={len(content)//4}")
        
        return content
        
    except Exception as e:
        logger.error(f"Gemini LLM call failed: {str(e)}")
        raise
