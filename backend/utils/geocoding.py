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

load_dotenv()

logger = logging.getLogger(__name__)

# In-memory cache for geocoding results
# Key: location string hash, Value: (lat, lng, timestamp)
_geocoding_cache: Dict[str, Tuple[float, float, datetime]] = {}
CACHE_TTL_HOURS = 24  # Cache geocoding results for 24 hours

# Bangalore neighborhood centers (fallback coordinates)
BANGALORE_NEIGHBORHOODS = {
    "indiranagar": (12.9784, 77.6408),
    "koramangala": (12.9352, 77.6245),
    "malleshwaram": (13.0067, 77.5677),
    "malleswaram": (13.0067, 77.5677),
    "jayanagar": (12.9308, 77.5838),
    "basavanagudi": (12.9422, 77.5675),
    "mg road": (12.9757, 77.6061),
    "cubbon park": (12.9763, 77.5929),
    "lalbagh": (12.9507, 77.5848),
    "whitefield": (12.9698, 77.7500),
    "hsr layout": (12.9116, 77.6389),
    "btm layout": (12.9166, 77.6101),
    "jp nagar": (12.9063, 77.5857),
    "electronic city": (12.8399, 77.6770),
    "marathahalli": (12.9591, 77.6971),
    "ulsoor": (12.9825, 77.6200),
    "shivajinagar": (12.9833, 77.6073),
    "richmond town": (12.9633, 77.6006),
    "brigade road": (12.9716, 77.6078),
    "church street": (12.9750, 77.6054),
    "commercial street": (12.9833, 77.6073),
    "sadashivanagar": (13.0108, 77.5727),
    "vasanth nagar": (12.9988, 77.5921),
    "rajajinagar": (12.9914, 77.5521),
    "vijayanagar": (12.9707, 77.5364),
    "banashankari": (12.9255, 77.5468),
    "yelahanka": (13.1007, 77.5963),
    "hebbal": (13.0358, 77.5970),
    "bangalore": (12.9716, 77.5946),  # City center fallback
}


def _get_cache_key(location: str, city: str) -> str:
    """Generate a cache key from location string."""
    full_location = f"{location}, {city}".lower().strip()
    return hashlib.md5(full_location.encode()).hexdigest()


def _is_cache_valid(timestamp: datetime) -> bool:
    """Check if cached result is still valid."""
    return datetime.now() - timestamp < timedelta(hours=CACHE_TTL_HOURS)


def _get_neighborhood_fallback(location: str) -> Optional[Tuple[float, float]]:
    """Get fallback coordinates from neighborhood name."""
    location_lower = location.lower()
    
    for neighborhood, coords in BANGALORE_NEIGHBORHOODS.items():
        if neighborhood in location_lower:
            logger.info(f"Using neighborhood fallback for '{location}': {neighborhood}")
            return coords
    
    return None


def geocode_location(
    location: str,
    city: str = "Bangalore",
    use_cache: bool = True
) -> Optional[Dict[str, float]]:
    """
    Geocode a location string to lat/lng coordinates.
    
    Args:
        location: Location name (e.g., "Clay Station, Indiranagar")
        city: City name for context (default: Bangalore)
        use_cache: Whether to use cached results
    
    Returns:
        Dict with 'lat' and 'lng' keys, or None if geocoding fails
    """
    if not location:
        return None
    
    cache_key = _get_cache_key(location, city)
    
    # Check cache first
    if use_cache and cache_key in _geocoding_cache:
        lat, lng, timestamp = _geocoding_cache[cache_key]
        if _is_cache_valid(timestamp):
            logger.debug(f"Geocoding cache hit for '{location}'")
            return {"lat": lat, "lng": lng}
    
    # Try Google Geocoding API
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
    
    if api_key:
        try:
            full_address = f"{location}, {city}, India"
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
                
                logger.info(f"Geocoded '{location}' to ({lat}, {lng})")
                return {"lat": lat, "lng": lng}
            else:
                logger.warning(f"Geocoding API returned no results for '{location}': {data.get('status')}")
        
        except requests.RequestException as e:
            logger.error(f"Geocoding API request failed: {e}")
        except (KeyError, IndexError) as e:
            logger.error(f"Error parsing geocoding response: {e}")
    
    # Fallback to neighborhood coordinates
    fallback = _get_neighborhood_fallback(location)
    if fallback:
        lat, lng = fallback
        _geocoding_cache[cache_key] = (lat, lng, datetime.now())
        return {"lat": lat, "lng": lng}
    
    # Ultimate fallback: Bangalore city center
    logger.warning(f"Using Bangalore center fallback for '{location}'")
    return {"lat": 12.9716, "lng": 77.5946}


def geocode_experiences(
    experiences: list,
    city: str = "Bangalore"
) -> list:
    """
    Add coordinates to a list of experiences.
    
    Args:
        experiences: List of experience dicts with 'name' and 'location' fields
        city: City name for geocoding context
    
    Returns:
        Same list with 'coordinates' added to each experience
    """
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
