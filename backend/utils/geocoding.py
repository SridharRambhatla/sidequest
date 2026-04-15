"""
Geocoding Service for Sidequest

Converts location names to lat/lng coordinates using Google Geocoding API.
Includes caching to minimize API calls.
"""

import os
import logging
import hashlib
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta
import requests
from dotenv import load_dotenv

# Import city registry for multi-city support
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from config.cities import get_city_config

load_dotenv()

logger = logging.getLogger(__name__)

# In-memory cache for geocoding results
# Key: location string hash, Value: (lat, lng, timestamp)
_geocoding_cache: Dict[str, Tuple[float, float, datetime]] = {}
CACHE_TTL_HOURS = 24  # Cache geocoding results for 24 hours


def _get_cache_key(location: str, city: str) -> str:
    """Generate a cache key from location string."""
    full_location = f"{location}, {city}".lower().strip()
    return hashlib.md5(full_location.encode()).hexdigest()


def _is_cache_valid(timestamp: datetime) -> bool:
    """Check if cached result is still valid."""
    return datetime.now() - timestamp < timedelta(hours=CACHE_TTL_HOURS)


def _get_known_place_fallback(location: str, city: str) -> Optional[Tuple[float, float]]:
    """
    Get fallback coordinates from city's known places.
    
    Args:
        location: Location string to search for
        city: City ID to get known places from
    
    Returns:
        Tuple of (lat, lng) if found, None otherwise
    """
    city_config = get_city_config(city)
    if not city_config:
        return None
    
    location_lower = location.lower()
    
    # Check if any known place is mentioned in the location
    for known_place in city_config.known_places:
        if known_place.lower() in location_lower:
            logger.info(f"Using known place fallback for '{location}' in {city}: {known_place}")
            # Return city center as we don't have specific coordinates for known places
            # This is better than returning None as it keeps the experience in the right city
            return (city_config.default_coordinates["lat"], city_config.default_coordinates["lng"])
    
    return None


def geocode_location(
    location: str,
    city: str,
    use_cache: bool = True
) -> Optional[Dict[str, float]]:
    """
    Geocode a location string to lat/lng coordinates.
    
    Args:
        location: Location name (e.g., "Clay Station, Indiranagar")
        city: City ID (required, no default) for context (e.g., "bangalore", "rishikesh")
        use_cache: Whether to use cached results
    
    Returns:
        Dict with 'lat' and 'lng' keys, or None if geocoding fails
    """
    if not location:
        return None
    
    if not city:
        logger.error("City parameter is required for geocoding")
        return None
    
    cache_key = _get_cache_key(location, city)
    
    # Check cache first
    if use_cache and cache_key in _geocoding_cache:
        lat, lng, timestamp = _geocoding_cache[cache_key]
        if _is_cache_valid(timestamp):
            logger.debug(f"Geocoding cache hit for '{location}' in {city}")
            return {"lat": lat, "lng": lng}
    
    # Get city config for context
    city_config = get_city_config(city)
    if not city_config:
        logger.error(f"Invalid city: {city}")
        return None
    
    # Try Google Geocoding API
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
    
    if api_key:
        try:
            # Include city name in query for better accuracy
            full_address = f"{location}, {city_config.display_name}, {city_config.country}"
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                "address": full_address,
                "key": api_key,
                "region": "in",  # Bias towards India
            }
            
            response = requests.get(url, params=params, timeout=5)
            data = response.json()
            
            if data.get("status") == "OK" and data.get("results"):
                result = data["results"][0]
                lat = result["geometry"]["location"]["lat"]
                lng = result["geometry"]["location"]["lng"]
                
                # Cache the result
                _geocoding_cache[cache_key] = (lat, lng, datetime.now())
                
                logger.info(f"Geocoded '{location}' in {city} to ({lat}, {lng})")
                return {"lat": lat, "lng": lng}
            else:
                logger.warning(f"Geocoding API returned no results for '{location}' in {city}: {data.get('status')}")
        
        except requests.RequestException as e:
            logger.error(f"Geocoding API request failed: {e}")
        except (KeyError, IndexError) as e:
            logger.error(f"Error parsing geocoding response: {e}")
    
    # Fallback to known places in the city
    fallback = _get_known_place_fallback(location, city)
    if fallback:
        lat, lng = fallback
        _geocoding_cache[cache_key] = (lat, lng, datetime.now())
        return {"lat": lat, "lng": lng}
    
    # Ultimate fallback: city center from registry
    logger.warning(f"Using {city_config.display_name} center fallback for '{location}'")
    lat = city_config.default_coordinates["lat"]
    lng = city_config.default_coordinates["lng"]
    return {"lat": lat, "lng": lng}


def geocode_experiences(
    experiences: list,
    city: str
) -> list:
    """
    Add coordinates to a list of experiences using city-specific defaults.
    
    Args:
        experiences: List of experience dicts with 'name' and 'location' fields
        city: City ID (required) for geocoding context (e.g., "bangalore", "rishikesh")
    
    Returns:
        Same list with 'coordinates' added to each experience
    """
    if not city:
        logger.error("City parameter is required for geocoding experiences")
        return experiences
    
    city_config = get_city_config(city)
    if not city_config:
        logger.error(f"Invalid city: {city}")
        return experiences
    
    for exp in experiences:
        if exp.get("coordinates"):
            continue  # Already has coordinates
        
        # Try geocoding with both name and location for better accuracy
        location = exp.get("location", "")
        name = exp.get("name", "")
        
        # First try: name + location (more specific)
        search_query = f"{name}, {location}" if name and location else location or name
        coords = geocode_location(search_query, city)
        
        if coords:
            exp["coordinates"] = coords
        else:
            # Fallback: just location
            coords = geocode_location(location, city)
            if coords:
                exp["coordinates"] = coords
            else:
                # Ultimate fallback: use city center
                logger.warning(f"Using city center for experience '{name}' in {city}")
                exp["coordinates"] = city_config.default_coordinates
    
    return experiences


def clear_geocoding_cache():
    """Clear all cached geocoding results."""
    global _geocoding_cache
    _geocoding_cache = {}
    logger.info("Geocoding cache cleared")


def get_cache_stats() -> Dict:
    """Get statistics about the geocoding cache."""
    valid_count = sum(1 for _, _, ts in _geocoding_cache.values() if _is_cache_valid(ts))
    return {
        "total_entries": len(_geocoding_cache),
        "valid_entries": valid_count,
        "expired_entries": len(_geocoding_cache) - valid_count,
    }
