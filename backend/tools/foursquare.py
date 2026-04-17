import os
import logging
from typing import Optional
from datetime import datetime, timezone, timedelta

import httpx

logger = logging.getLogger(__name__)

FSQ_API_KEY = os.getenv("FOURSQUARE_API_KEY", "")
FSQ_BASE = "https://api.foursquare.com/v3"

CATEGORY_MAP = {
    "Food & Drink": "13000",
    "Craft Workshop": "11000",
    "Heritage Walk": "12104",
    "Nature": "16000",
    "Art & Culture": "10000",
    "Nightlife": "10032",
    "Fitness": "18000",
    "Shopping": "17000",
    "Networking": "11000",
}

_cache: dict[str, tuple[datetime, list]] = {}
CACHE_TTL = timedelta(hours=24)


def _headers() -> dict:
    return {
        "Authorization": FSQ_API_KEY,
        "Accept": "application/json",
    }


async def search_places(
    query: str = "",
    city: str = "Bangalore",
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    categories: Optional[list[str]] = None,
    limit: int = 15,
    radius: int = 20000,
) -> list[dict]:
    cache_key = f"{query}:{city}:{','.join(categories or [])}:{limit}"
    if cache_key in _cache:
        ts, data = _cache[cache_key]
        if datetime.now(timezone.utc) - ts < CACHE_TTL:
            return data

    if not FSQ_API_KEY:
        logger.warning("FOURSQUARE_API_KEY not set, returning empty results")
        return []

    params: dict = {"limit": min(limit, 50)}

    if lat and lng:
        params["ll"] = f"{lat},{lng}"
        params["radius"] = radius
    else:
        params["near"] = city

    if query:
        params["query"] = query

    if categories:
        fsq_cats = [CATEGORY_MAP.get(c, "") for c in categories]
        fsq_cats = [c for c in fsq_cats if c]
        if fsq_cats:
            params["categories"] = ",".join(fsq_cats)

    params["fields"] = (
        "fsq_id,name,categories,location,geocodes,rating,stats,"
        "hours,tel,website,photos,tips,price,description,tastes"
    )

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{FSQ_BASE}/places/search",
                headers=_headers(),
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            _cache[cache_key] = (datetime.now(timezone.utc), results)
            return results
    except Exception as e:
        logger.error(f"Foursquare search failed: {e}")
        return []


async def get_place_details(fsq_id: str) -> Optional[dict]:
    cache_key = f"detail:{fsq_id}"
    if cache_key in _cache:
        ts, data = _cache[cache_key]
        if datetime.now(timezone.utc) - ts < CACHE_TTL:
            return data[0] if data else None

    if not FSQ_API_KEY:
        return None

    params = {
        "fields": (
            "fsq_id,name,categories,location,geocodes,rating,stats,"
            "hours,hours_popular,tel,website,photos,tips,price,"
            "description,tastes,features,social_media"
        )
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{FSQ_BASE}/places/{fsq_id}",
                headers=_headers(),
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()
            _cache[cache_key] = (datetime.now(timezone.utc), [data])
            return data
    except Exception as e:
        logger.error(f"Foursquare detail fetch failed for {fsq_id}: {e}")
        return None


async def get_place_photos(fsq_id: str, limit: int = 5) -> list[str]:
    if not FSQ_API_KEY:
        return []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{FSQ_BASE}/places/{fsq_id}/photos",
                headers=_headers(),
                params={"limit": limit},
            )
            resp.raise_for_status()
            photos = resp.json()
            return [
                f"{p['prefix']}original{p['suffix']}"
                for p in photos
                if "prefix" in p and "suffix" in p
            ]
    except Exception as e:
        logger.error(f"Foursquare photos failed for {fsq_id}: {e}")
        return []


def fsq_to_experience(place: dict, index: int = 0) -> dict:
    geocodes = place.get("geocodes", {}).get("main", {})
    location = place.get("location", {})
    categories = place.get("categories", [])
    category_name = categories[0]["name"] if categories else "Experience"

    cat_mapped = "Food & Drink"
    if categories:
        fsq_cat_id = str(categories[0].get("id", ""))[:3]
        reverse_map = {
            "130": "Food & Drink",
            "100": "Art & Culture",
            "110": "Craft Workshop",
            "121": "Heritage Walk",
            "160": "Nature",
            "180": "Fitness",
            "170": "Shopping",
        }
        cat_mapped = reverse_map.get(fsq_cat_id, "Food & Drink")

    photos = place.get("photos", [])
    image_url = ""
    if photos:
        p = photos[0]
        image_url = f"{p.get('prefix', '')}400x300{p.get('suffix', '')}"

    hours_display = ""
    hours_data = place.get("hours", {})
    if hours_data and hours_data.get("display"):
        hours_display = hours_data["display"]

    tips = place.get("tips", [])
    description = place.get("description", "")
    if not description and tips:
        description = tips[0].get("text", "")

    return {
        "fsq_id": place.get("fsq_id", ""),
        "name": place.get("name", "Unknown"),
        "category": cat_mapped,
        "category_detail": category_name,
        "description": description[:300],
        "image_url": image_url,
        "location": {
            "neighborhood": location.get("neighborhood", [location.get("locality", "")])[0]
            if isinstance(location.get("neighborhood"), list)
            else location.get("formatted_address", location.get("locality", "")),
            "address": location.get("formatted_address", ""),
            "coordinates": {
                "lat": geocodes.get("latitude", 0),
                "lng": geocodes.get("longitude", 0),
            },
        },
        "rating": place.get("rating"),
        "price": place.get("price"),
        "hours": hours_display,
        "tel": place.get("tel"),
        "website": place.get("website"),
        "stats": place.get("stats", {}),
    }
