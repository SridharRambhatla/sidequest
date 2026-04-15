"""City registry configuration for multi-city support."""

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class CityConfig:
    """Configuration for a supported city."""
    id: str
    display_name: str
    country: str
    default_coordinates: Dict[str, float]  # {"lat": float, "lng": float}
    timezone: str
    currency: str
    enabled: bool = True
    known_places: List[str] = None
    
    def __post_init__(self):
        """Initialize known_places if not provided."""
        if self.known_places is None:
            self.known_places = []
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "display_name": self.display_name,
            "country": self.country,
            "coordinates": self.default_coordinates,
            "timezone": self.timezone,
            "currency": self.currency
        }


# City registry with all supported cities
SUPPORTED_CITIES: Dict[str, CityConfig] = {
    "bangalore": CityConfig(
        id="bangalore",
        display_name="Bangalore",
        country="India",
        default_coordinates={"lat": 12.9716, "lng": 77.5946},
        timezone="Asia/Kolkata",
        currency="INR",
        enabled=True,
        known_places=[
            "Cubbon Park", "Lalbagh", "Bangalore Palace", "ISKCON Temple",
            "Vidhana Soudha", "UB City", "Commercial Street", "MG Road",
            "Indiranagar", "Koramangala", "Whitefield", "Electronic City"
        ]
    ),
    "rishikesh": CityConfig(
        id="rishikesh",
        display_name="Rishikesh",
        country="India",
        default_coordinates={"lat": 30.0869, "lng": 78.2676},
        timezone="Asia/Kolkata",
        currency="INR",
        enabled=True,
        known_places=[
            "Laxman Jhula", "Ram Jhula", "Parmarth Niketan", "Beatles Ashram",
            "Triveni Ghat", "Neelkanth Mahadev Temple", "Rajaji National Park",
            "Shivpuri", "Rishikund", "Swarg Ashram"
        ]
    ),
    "kasol": CityConfig(
        id="kasol",
        display_name="Kasol",
        country="India",
        default_coordinates={"lat": 32.0100, "lng": 77.3150},
        timezone="Asia/Kolkata",
        currency="INR",
        enabled=True,
        known_places=[
            "Parvati Valley", "Chalal", "Tosh", "Malana", "Kheerganga",
            "Manikaran Sahib", "Kasol Market", "Parvati River", "Rasol",
            "Grahan Village"
        ]
    ),
    "gokarna": CityConfig(
        id="gokarna",
        display_name="Gokarna",
        country="India",
        default_coordinates={"lat": 14.5479, "lng": 74.3188},
        timezone="Asia/Kolkata",
        currency="INR",
        enabled=True,
        known_places=[
            "Om Beach", "Kudle Beach", "Half Moon Beach", "Paradise Beach",
            "Gokarna Beach", "Mahabaleshwar Temple", "Mirjan Fort",
            "Yana Caves", "Vibhooti Falls", "Nirvana Beach"
        ]
    ),
    "rameshwaram": CityConfig(
        id="rameshwaram",
        display_name="Rameshwaram",
        country="India",
        default_coordinates={"lat": 9.2876, "lng": 79.3129},
        timezone="Asia/Kolkata",
        currency="INR",
        enabled=True,
        known_places=[
            "Ramanathaswamy Temple", "Pamban Bridge", "Dhanushkodi",
            "Agni Theertham", "Gandhamadhana Parvatham", "Kothandaramaswamy Temple",
            "Adam's Bridge", "Ariyaman Beach", "Lakshmana Tirtham", "Five-faced Hanuman Temple"
        ]
    )
}


def get_supported_cities() -> List[CityConfig]:
    """
    Return list of all enabled cities.
    
    Returns:
        List of CityConfig objects for enabled cities
    """
    return [city for city in SUPPORTED_CITIES.values() if city.enabled]


def get_city_config(city_id: str) -> Optional[CityConfig]:
    """
    Get configuration for a specific city.
    
    Args:
        city_id: City identifier (e.g., "bangalore", "rishikesh")
    
    Returns:
        CityConfig object if city exists and is enabled, None otherwise
    """
    city_id_lower = city_id.lower() if city_id else ""
    city = SUPPORTED_CITIES.get(city_id_lower)
    
    if city and city.enabled:
        return city
    return None


def validate_city(city_id: str) -> bool:
    """
    Check if a city is supported and enabled.
    
    Args:
        city_id: City identifier to validate
    
    Returns:
        True if city is supported and enabled, False otherwise
    """
    return get_city_config(city_id) is not None
