from fastapi import APIRouter, HTTPException
from tools.foursquare import get_place_details, get_place_photos

router = APIRouter(prefix="/api/experiences", tags=["experiences"])


@router.get("/{fsq_id}")
async def get_experience_detail(fsq_id: str):
    place = await get_place_details(fsq_id)
    if not place:
        raise HTTPException(status_code=404, detail="Experience not found")

    photos = await get_place_photos(fsq_id, limit=6)

    geocodes = place.get("geocodes", {}).get("main", {})
    location = place.get("location", {})
    categories = place.get("categories", [])
    hours = place.get("hours", {})
    tips = place.get("tips", [])

    return {
        "fsq_id": place.get("fsq_id"),
        "name": place.get("name"),
        "categories": [c.get("name") for c in categories],
        "description": place.get("description", ""),
        "photos": photos,
        "location": {
            "address": location.get("formatted_address", ""),
            "neighborhood": location.get("neighborhood", []),
            "lat": geocodes.get("latitude"),
            "lng": geocodes.get("longitude"),
            "cross_street": location.get("cross_street", ""),
            "locality": location.get("locality", ""),
        },
        "contact": {
            "tel": place.get("tel"),
            "website": place.get("website"),
            "social_media": place.get("social_media", {}),
        },
        "hours": {
            "display": hours.get("display", ""),
            "is_open": hours.get("open_now", None),
            "regular": hours.get("regular", []),
        },
        "hours_popular": place.get("hours_popular", []),
        "rating": place.get("rating"),
        "price": place.get("price"),
        "stats": place.get("stats", {}),
        "features": place.get("features", {}),
        "tips": [
            {"text": t.get("text", ""), "created_at": t.get("created_at", "")}
            for t in tips[:5]
        ],
        "tastes": place.get("tastes", []),
        "booking_links": {
            "google_maps": f"https://www.google.com/maps/search/?api=1&query={geocodes.get('latitude', 0)},{geocodes.get('longitude', 0)}&query_place_id={fsq_id}",
            "directions": f"https://www.google.com/maps/dir/?api=1&destination={geocodes.get('latitude', 0)},{geocodes.get('longitude', 0)}",
        },
    }
