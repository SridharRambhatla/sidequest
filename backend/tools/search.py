"""
Sidequest — Experience Search Tools

In-memory experience search for hackathon MVP.
Production would use Gemini embeddings + Pinecone/MongoDB Atlas vector search.
"""

from typing import Optional


# ──────────────────────────────────────────────
# Sample Bangalore Experience Database
# ──────────────────────────────────────────────

EXPERIENCE_DB = [
    {
        "name": "CTR Benne Dosa",
        "category": "food",
        "timing": "7:00 AM - 11:00 AM",
        "budget": 150,
        "location": "Malleswaram",
        "solo_friendly": True,
        "source": "local_knowledge",
        "lore": "Since 1920, this Malleswaram institution has served benne dosa with the same recipe. The queue is part of the ritual.",
        "description": "Legendary butter dosa joint. Counter seating, fast service, locals-only morning crowd.",
    },
    {
        "name": "Atta Galatta Pottery Workshop",
        "category": "craft",
        "timing": "Saturday 11:00 AM - 1:00 PM",
        "budget": 800,
        "location": "Koramangala",
        "solo_friendly": True,
        "source": "instagram:@attagalatta",
        "lore": "Bangalore's beloved bookstore-café runs beginner pottery sessions where 60% of attendees come solo.",
        "description": "Hand-thrown pottery for beginners. Instructor facilitates intros. Clay-on-hands, conversation-optional.",
    },
    {
        "name": "Basavanagudi Heritage Walk",
        "category": "heritage",
        "timing": "8:00 AM - 10:30 AM",
        "budget": 300,
        "location": "Basavanagudi",
        "solo_friendly": True,
        "source": "local_knowledge",
        "lore": "Walk through 500+ year old Bull Temple neighborhood. Dravidian architecture, agrahara houses, and the famous Dodda Ganesha temple.",
        "description": "Guided heritage walk through one of Bangalore's oldest neighborhoods. Temple visits, architecture stories, local breakfast stop.",
    },
    {
        "name": "Indian Coffee House",
        "category": "food",
        "timing": "9:00 AM - 8:00 PM",
        "budget": 100,
        "location": "MG Road",
        "solo_friendly": True,
        "source": "local_knowledge",
        "lore": "A cooperative café from the 1950s workers' movement. The waiters in their trademark turbans are as much part of the experience as the filter coffee.",
        "description": "Counter seating, strong filter coffee, intellectual crowd. Solo dining is the norm here.",
    },
    {
        "name": "Sofar Sounds Bangalore",
        "category": "music",
        "timing": "Saturday 7:00 PM - 9:00 PM",
        "budget": 500,
        "location": "Various (secret location revealed 24hrs before)",
        "solo_friendly": True,
        "source": "instagram:@sofarsoundsbangalore",
        "lore": "Intimate living room concerts at secret locations. You don't know the venue until 24 hours before — that's the point.",
        "description": "Secret location indie music concerts. BYOB, sitting on the floor, 50-person crowd. 30% attendees come solo.",
    },
    {
        "name": "Cubbon Park Morning Run Club",
        "category": "fitness",
        "timing": "Saturday 6:00 AM - 7:30 AM",
        "budget": 0,
        "location": "Cubbon Park",
        "solo_friendly": True,
        "source": "community:telegram",
        "lore": "Started by 3 strangers who met on Strava. Now 200+ runners show up every Saturday. No pace pressure, just show up.",
        "description": "Free community run through heritage park. All paces welcome. Post-run filter coffee tradition at park café.",
    },
    {
        "name": "Rangoli Art Centre Workshop",
        "category": "art",
        "timing": "Sunday 10:00 AM - 12:30 PM",
        "budget": 600,
        "location": "Jayanagar",
        "solo_friendly": True,
        "source": "local_knowledge",
        "lore": "Traditional Rangoli patterns taught by artisans from Mysore. Each pattern encodes a story — harvest, monsoon, celebration.",
        "description": "Learn traditional Kolam and Rangoli patterns from master artisan. Materials provided. Meditative, hands-on experience.",
    },
    {
        "name": "Blossoms Book House",
        "category": "shopping",
        "timing": "10:00 AM - 9:00 PM",
        "budget": 200,
        "location": "Church Street",
        "solo_friendly": True,
        "source": "local_knowledge",
        "lore": "India's largest secondhand bookstore. Three floors, 200,000 books. Regulars have been coming for 20+ years. The owner remembers your taste.",
        "description": "Legendary used bookstore. Get lost in three floors of books. The staff recommendations are always spot on.",
    },
    {
        "name": "Mavalli Tiffin Rooms (MTR)",
        "category": "food",
        "timing": "6:30 AM - 11:00 AM, 3:30 PM - 7:30 PM",
        "budget": 250,
        "location": "Lalbagh Road",
        "solo_friendly": True,
        "source": "local_knowledge",
        "lore": "Since 1924. They invented the rava idli during WWII rice shortage. The queue wraps around the building on weekends.",
        "description": "Living heritage restaurant. Rava idli birthplace. Paper dosa, filter coffee, 100-year legacy. Weekend queue is 30 mins.",
    },
    {
        "name": "Channapatna Toy Workshop Visit",
        "category": "craft",
        "timing": "10:00 AM - 4:00 PM (weekdays)",
        "budget": 1500,
        "location": "Channapatna (60km from Bangalore)",
        "solo_friendly": False,
        "source": "artisan_registry",
        "lore": "GI-tagged lacquer toys made the same way for 200+ years. Artisans use vegetable dyes and ivory wood. UNESCO recognized craft.",
        "description": "Visit artisan workshops making traditional lacquer toys. Watch master craftsmen, try your hand at turning. Buy direct from makers.",
    },
]


async def search_experiences(
    query: str,
    city: str = "Bangalore",
    budget_max: int = 5000,
    solo_only: bool = False,
    categories: Optional[list[str]] = None,
) -> list[dict]:
    """
    Search the experience database.

    This is a simple in-memory search for hackathon MVP.
    Production would use Gemini embeddings + vector similarity search.
    """
    results = []

    query_lower = query.lower()

    for exp in EXPERIENCE_DB:
        # Budget filter
        if exp["budget"] > budget_max:
            continue

        # Solo filter
        if solo_only and not exp["solo_friendly"]:
            continue

        # Category filter
        if categories and exp["category"] not in categories:
            continue

        # Simple keyword matching (would be vector similarity in prod)
        score = 0
        searchable = f"{exp['name']} {exp['category']} {exp['description']} {exp['lore']}".lower()
        for word in query_lower.split():
            if word in searchable:
                score += 1

        if score > 0 or not query.strip():
            results.append({**exp, "_score": score})

    # Sort by relevance score
    results.sort(key=lambda x: x.get("_score", 0), reverse=True)

    # Remove score from output
    for r in results:
        r.pop("_score", None)

    return results[:10]
