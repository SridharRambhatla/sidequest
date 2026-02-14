"""
Sidequest Backend Configuration

Vertex AI initialization and model configuration for all agents.
"""

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Google Cloud
    google_cloud_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    google_cloud_location: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

    # Server
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))
    backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")

    # Model Configuration
    # Flash models — fast, used for all agents
    flash_model: str = "gemini-2.0-flash"
    # Pro models — using flash as fallback since pro may not be available
    # To use pro models, set VERTEX_PRO_MODEL env var
    pro_model: str = os.getenv("VERTEX_PRO_MODEL", "gemini-2.0-flash")

    # Agent Settings
    max_retries: int = 3
    agent_timeout_seconds: int = 30

    # LangSmith (optional tracing)
    langsmith_api_key: str = os.getenv("LANGSMITH_API_KEY", "")
    langsmith_project: str = os.getenv("LANGSMITH_PROJECT", "sidequest-dev")
    langsmith_tracing: bool = os.getenv("LANGSMITH_TRACING", "false").lower() == "true"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Singleton settings instance
settings = Settings()


# Vertex AI model configs per agent role
AGENT_MODEL_CONFIG = {
    "coordinator": {
        "model_name": settings.flash_model,
        "temperature": 0.1,
        "max_output_tokens": 1024,
    },
    "discovery": {
        "model_name": settings.flash_model,
        "temperature": 0.3,
        "max_output_tokens": 4096,
    },
    "cultural_context": {
        "model_name": settings.pro_model,
        "temperature": 0.4,
        "max_output_tokens": 2048,  # Reduced from 4096 - context is concise
    },
    "plot_builder": {
        "model_name": settings.pro_model,
        "temperature": 0.7,
        "max_output_tokens": 8192,
    },
    "budget": {
        "model_name": settings.flash_model,
        "temperature": 0.1,
        "max_output_tokens": 2048,
    },
    "community": {
        "model_name": settings.flash_model,
        "temperature": 0.2,
        "max_output_tokens": 2048,
    },
}
