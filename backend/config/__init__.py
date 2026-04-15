"""Configuration module for Sidequest application."""

from .cities import (
    CityConfig,
    SUPPORTED_CITIES,
    get_supported_cities,
    get_city_config,
    validate_city
)

__all__ = [
    "CityConfig",
    "SUPPORTED_CITIES",
    "get_supported_cities",
    "get_city_config",
    "validate_city"
]
