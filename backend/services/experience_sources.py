"""
Multi-Source Experience Fetcher for Sidequest

Fetches experiences from various sources:
- Reddit (r/bangalore, r/IndianFood, etc.)
- Karnataka Tourism website
- Bangalore Tourism
- Instagram (mock data - requires API approval)
- X/Twitter (mock data - requires API approval)
"""

import os
import logging
import asyncio
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


@dataclass
class SourceExperience:
    """Normalized experience from any source."""
    id: str
    name: str
    category: str
    description: str
    location: str
    source: str
    source_url: Optional[str] = None
    budget_min: int = 0
    budget_max: int = 1000
    timing: str = "Flexible"
    time_of_day: str = "flexible"
    solo_friendly: bool = True
    image_url: Optional[str] = None
    rating: Optional[float] = None
    fetched_at: str = None
    
    def __post_init__(self):
        if not self.id:
            self.id = hashlib.md5(f"{self.name}{self.source}".encode()).hexdigest()[:12]
        if not self.fetched_at:
            self.fetched_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class RedditFetcher:
    """Fetch experiences mentioned on Reddit."""
    
    BASE_URL = "https://www.reddit.com"
    SUBREDDITS = ["bangalore", "IndianFood", "india"]
    SEARCH_TERMS = [
        "hidden gem bangalore",
        "best experience bangalore",
        "things to do bangalore",
        "weekend bangalore",
        "solo activities bangalore",
        "workshop bangalore"
    ]
    
    def __init__(self):
        self.client_id = os.getenv("REDDIT_CLIENT_ID")
        self.client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        self.access_token = None
    
    def _get_access_token(self) -> Optional[str]:
        """Get Reddit API access token."""
        if not self.client_id or not self.client_secret:
            logger.warning("Reddit API credentials not configured")
            return None
        
        try:
            auth = requests.auth.HTTPBasicAuth(self.client_id, self.client_secret)
            data = {"grant_type": "client_credentials"}
            headers = {"User-Agent": "Sidequest/1.0"}
            
            response = requests.post(
                "https://www.reddit.com/api/v1/access_token",
                auth=auth,
                data=data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                self.access_token = response.json().get("access_token")
                return self.access_token
        except Exception as e:
            logger.error(f"Failed to get Reddit access token: {e}")
        
        return None
    
    def fetch_experiences(self, city: str = "Bangalore", limit: int = 10) -> List[SourceExperience]:
        """Fetch experiences from Reddit using JSON API (no auth required for public data)."""
        experiences = []
        
        for subreddit in self.SUBREDDITS[:1]:  # Limit to first subreddit for speed
            try:
                # Use Reddit's public JSON API
                url = f"https://www.reddit.com/r/{subreddit}/search.json"
                params = {
                    "q": f"things to do {city} OR hidden gem {city} OR experience {city}",
                    "restrict_sr": "true",
                    "sort": "relevance",
                    "limit": limit
                }
                headers = {"User-Agent": "Sidequest/1.0 (Experience Discovery)"}
                
                response = requests.get(url, params=params, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    posts = data.get("data", {}).get("children", [])
                    
                    for post in posts[:limit]:
                        post_data = post.get("data", {})
                        title = post_data.get("title", "")
                        selftext = post_data.get("selftext", "")
                        permalink = post_data.get("permalink", "")
                        
                        # Skip if too short
                        if len(title) < 10:
                            continue
                        
                        # Categorize based on keywords
                        category = self._categorize_post(title + " " + selftext)
                        
                        exp = SourceExperience(
                            id=f"reddit_{post_data.get('id', '')}",
                            name=title[:100],
                            category=category,
                            description=selftext[:300] if selftext else title,
                            location=city,
                            source="reddit",
                            source_url=f"https://www.reddit.com{permalink}",
                            solo_friendly=True,
                        )
                        experiences.append(exp)
                else:
                    logger.warning(f"Reddit API returned {response.status_code}")
                    
            except Exception as e:
                logger.error(f"Error fetching from r/{subreddit}: {e}")
        
        logger.info(f"Fetched {len(experiences)} experiences from Reddit")
        return experiences
    
    def _categorize_post(self, text: str) -> str:
        """Categorize a post based on keywords."""
        text_lower = text.lower()
        
        if any(kw in text_lower for kw in ['food', 'restaurant', 'cafe', 'eat', 'biryani', 'dosa']):
            return 'food'
        if any(kw in text_lower for kw in ['workshop', 'class', 'pottery', 'art', 'craft']):
            return 'craft'
        if any(kw in text_lower for kw in ['heritage', 'history', 'temple', 'palace', 'walk']):
            return 'heritage'
        if any(kw in text_lower for kw in ['nature', 'park', 'garden', 'trek', 'lake']):
            return 'nature'
        if any(kw in text_lower for kw in ['music', 'concert', 'bar', 'nightlife', 'pub']):
            return 'music'
        if any(kw in text_lower for kw in ['gym', 'fitness', 'yoga', 'run', 'sport']):
            return 'fitness'
        if any(kw in text_lower for kw in ['shop', 'market', 'mall', 'buy']):
            return 'shopping'
        
        return 'art'  # Default


class TravelGuideFetcher:
    """Fetch experiences from travel guide websites."""
    
    SOURCES = [
        {
            "name": "Karnataka Tourism",
            "url": "https://www.karnatakatourism.org/destinations/bengaluru/",
            "selector": ".destination-card, .attraction-item, article"
        },
        {
            "name": "Thrillophilia Bangalore",
            "url": "https://www.thrillophilia.com/cities/bangalore/things-to-do",
            "selector": ".activity-card, .tour-card"
        }
    ]
    
    # Fallback curated experiences when scraping fails
    CURATED_EXPERIENCES = [
        {
            "name": "Bangalore Palace Audio Tour",
            "category": "heritage",
            "description": "Explore the Tudor-style palace built in 1887 with an immersive audio guide. Marvel at the wood carvings, stained glass windows, and royal artifacts.",
            "location": "Vasanth Nagar",
            "budget_min": 230,
            "budget_max": 460,
            "timing": "10 AM - 5:30 PM",
            "time_of_day": "afternoon",
        },
        {
            "name": "Lalbagh Botanical Garden",
            "category": "nature", 
            "description": "240 acres of century-old trees, the famous Glass House, and Sunday flower shows. One of the finest botanical gardens in India.",
            "location": "Lalbagh",
            "budget_min": 20,
            "budget_max": 50,
            "timing": "6 AM - 7 PM",
            "time_of_day": "morning",
        },
        {
            "name": "Nandi Hills Sunrise Trek",
            "category": "nature",
            "description": "Wake up at 4 AM for a breathtaking sunrise at Nandi Hills. Popular cycling and trekking destination just 60km from the city.",
            "location": "Nandi Hills",
            "budget_min": 200,
            "budget_max": 500,
            "timing": "4 AM - 10 AM",
            "time_of_day": "morning",
        },
        {
            "name": "Vidyarthi Bhavan Masala Dosa",
            "category": "food",
            "description": "Since 1943. Queue for the legendary butter-drenched masala dosa at this iconic Basavanagudi institution.",
            "location": "Basavanagudi",
            "budget_min": 100,
            "budget_max": 200,
            "timing": "7:30 AM - 12 PM, 2:30 PM - 8 PM",
            "time_of_day": "morning",
        },
        {
            "name": "Rangoli Metro Art Center",
            "category": "art",
            "description": "Free art gallery under the MG Road metro station. Rotating exhibitions, weekend workshops, and cultural events.",
            "location": "MG Road",
            "budget_min": 0,
            "budget_max": 200,
            "timing": "10 AM - 8 PM",
            "time_of_day": "afternoon",
        },
        {
            "name": "Chickpet Saree Shopping",
            "category": "shopping",
            "description": "Navigate the chaotic lanes of old Bangalore's textile district. Silk sarees, traditional jewelry, and wholesale fabric at bargain prices.",
            "location": "Chickpet",
            "budget_min": 500,
            "budget_max": 5000,
            "timing": "10 AM - 8 PM",
            "time_of_day": "afternoon",
        },
        {
            "name": "Kempegowda Museum",
            "category": "heritage",
            "description": "Learn about Bangalore's founder and the city's transformation from a mud fort to Silicon Valley of India.",
            "location": "Bangalore Fort",
            "budget_min": 25,
            "budget_max": 50,
            "timing": "10 AM - 5:30 PM",
            "time_of_day": "afternoon",
        },
        {
            "name": "Toit Brewpub Experience",
            "category": "music",
            "description": "Bangalore's most popular microbrewery. Craft beers brewed on-site, great food, and a buzzing atmosphere.",
            "location": "Indiranagar",
            "budget_min": 800,
            "budget_max": 1500,
            "timing": "12 PM - 11:30 PM",
            "time_of_day": "evening",
        }
    ]
    
    def fetch_experiences(self, city: str = "Bangalore") -> List[SourceExperience]:
        """Fetch experiences from travel guides. Falls back to curated list if scraping fails."""
        experiences = []
        
        # Try scraping first
        for source in self.SOURCES:
            try:
                scraped = self._scrape_source(source, city)
                experiences.extend(scraped)
            except Exception as e:
                logger.warning(f"Failed to scrape {source['name']}: {e}")
        
        # If scraping failed or returned few results, use curated experiences
        if len(experiences) < 5:
            logger.info("Using curated travel guide experiences")
            for exp_data in self.CURATED_EXPERIENCES:
                exp = SourceExperience(
                    id=f"curated_{hashlib.md5(exp_data['name'].encode()).hexdigest()[:8]}",
                    name=exp_data["name"],
                    category=exp_data["category"],
                    description=exp_data["description"],
                    location=exp_data["location"],
                    source="travel_guide",
                    budget_min=exp_data.get("budget_min", 0),
                    budget_max=exp_data.get("budget_max", 1000),
                    timing=exp_data.get("timing", "Flexible"),
                    time_of_day=exp_data.get("time_of_day", "flexible"),
                )
                experiences.append(exp)
        
        logger.info(f"Fetched {len(experiences)} experiences from travel guides")
        return experiences
    
    def _scrape_source(self, source: Dict, city: str) -> List[SourceExperience]:
        """Scrape a single travel guide source."""
        experiences = []
        
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            }
            response = requests.get(source["url"], headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                items = soup.select(source["selector"])
                
                for item in items[:10]:
                    title_elem = item.select_one("h2, h3, .title, .name")
                    desc_elem = item.select_one("p, .description, .excerpt")
                    
                    if title_elem:
                        name = title_elem.get_text(strip=True)
                        description = desc_elem.get_text(strip=True) if desc_elem else name
                        
                        if len(name) > 5:
                            exp = SourceExperience(
                                id=f"guide_{hashlib.md5(name.encode()).hexdigest()[:8]}",
                                name=name,
                                category="heritage",  # Default
                                description=description[:300],
                                location=city,
                                source=source["name"].lower().replace(" ", "_"),
                                source_url=source["url"],
                            )
                            experiences.append(exp)
        except Exception as e:
            logger.error(f"Scraping error for {source['name']}: {e}")
        
        return experiences


class SocialMediaFetcher:
    """
    Mock social media fetcher for Instagram and X/Twitter.
    Real implementation requires API approval and is rate-limited.
    """
    
    # Curated experiences that could come from social media
    MOCK_INSTAGRAM_EXPERIENCES = [
        {
            "name": "Third Wave Coffee Roasters",
            "category": "food",
            "description": "Instagram-worthy specialty coffee with single-origin beans. The avocado toast is as good as the aesthetics.",
            "location": "Indiranagar",
            "budget_min": 300,
            "budget_max": 600,
            "time_of_day": "morning",
            "source": "instagram",
        },
        {
            "name": "The Pottery Lab Workshop",
            "category": "craft",
            "description": "Get your hands dirty at this trending pottery studio. 2-hour wheel throwing sessions with take-home pieces.",
            "location": "Koramangala",
            "budget_min": 1200,
            "budget_max": 1800,
            "time_of_day": "afternoon",
            "source": "instagram",
        },
        {
            "name": "Cubbon Reads Sunday Book Exchange",
            "category": "art",
            "description": "Bring a book, take a book. Community reading sessions under the trees every Sunday morning.",
            "location": "Cubbon Park",
            "budget_min": 0,
            "budget_max": 100,
            "time_of_day": "morning",
            "source": "instagram",
        }
    ]
    
    MOCK_TWITTER_EXPERIENCES = [
        {
            "name": "Bangalore Astronomy Club Stargazing",
            "category": "nature",
            "description": "Monthly stargazing sessions outside the city. Telescopes provided, learn constellations from experts.",
            "location": "Nandi Hills",
            "budget_min": 500,
            "budget_max": 800,
            "time_of_day": "night",
            "source": "twitter",
        },
        {
            "name": "Silent Disco at Cubbon Park",
            "category": "music",
            "description": "Trending: wireless headphone party in the park. Three DJ channels, choose your vibe.",
            "location": "Cubbon Park",
            "budget_min": 400,
            "budget_max": 600,
            "time_of_day": "evening",
            "source": "twitter",
        }
    ]
    
    def fetch_instagram_experiences(self, city: str = "Bangalore") -> List[SourceExperience]:
        """Return mock Instagram experiences."""
        experiences = []
        
        for exp_data in self.MOCK_INSTAGRAM_EXPERIENCES:
            exp = SourceExperience(
                id=f"ig_{hashlib.md5(exp_data['name'].encode()).hexdigest()[:8]}",
                name=exp_data["name"],
                category=exp_data["category"],
                description=exp_data["description"],
                location=exp_data["location"],
                source=exp_data["source"],
                budget_min=exp_data.get("budget_min", 0),
                budget_max=exp_data.get("budget_max", 1000),
                time_of_day=exp_data.get("time_of_day", "flexible"),
            )
            experiences.append(exp)
        
        logger.info(f"Fetched {len(experiences)} experiences from Instagram (mock)")
        return experiences
    
    def fetch_twitter_experiences(self, city: str = "Bangalore") -> List[SourceExperience]:
        """Return mock Twitter/X experiences."""
        experiences = []
        
        for exp_data in self.MOCK_TWITTER_EXPERIENCES:
            exp = SourceExperience(
                id=f"tw_{hashlib.md5(exp_data['name'].encode()).hexdigest()[:8]}",
                name=exp_data["name"],
                category=exp_data["category"],
                description=exp_data["description"],
                location=exp_data["location"],
                source=exp_data["source"],
                budget_min=exp_data.get("budget_min", 0),
                budget_max=exp_data.get("budget_max", 1000),
                time_of_day=exp_data.get("time_of_day", "flexible"),
            )
            experiences.append(exp)
        
        logger.info(f"Fetched {len(experiences)} experiences from Twitter (mock)")
        return experiences


class ExperienceSourceFetcher:
    """
    Unified fetcher that aggregates experiences from all sources.
    """
    
    def __init__(self):
        self.reddit = RedditFetcher()
        self.travel_guides = TravelGuideFetcher()
        self.social_media = SocialMediaFetcher()
    
    def fetch_all(self, city: str = "Bangalore") -> List[Dict[str, Any]]:
        """
        Fetch experiences from all sources and return deduplicated list.
        
        Returns:
            List of experience dictionaries ready for the frontend/cache
        """
        all_experiences: List[SourceExperience] = []
        
        # Fetch from all sources
        try:
            all_experiences.extend(self.travel_guides.fetch_experiences(city))
        except Exception as e:
            logger.error(f"Travel guide fetch failed: {e}")
        
        try:
            all_experiences.extend(self.social_media.fetch_instagram_experiences(city))
        except Exception as e:
            logger.error(f"Instagram fetch failed: {e}")
        
        try:
            all_experiences.extend(self.social_media.fetch_twitter_experiences(city))
        except Exception as e:
            logger.error(f"Twitter fetch failed: {e}")
        
        # Reddit last (can be slow)
        try:
            all_experiences.extend(self.reddit.fetch_experiences(city, limit=5))
        except Exception as e:
            logger.error(f"Reddit fetch failed: {e}")
        
        # Deduplicate by name similarity
        unique_experiences = self._deduplicate(all_experiences)
        
        logger.info(f"Total unique experiences fetched: {len(unique_experiences)}")
        
        return [exp.to_dict() for exp in unique_experiences]
    
    def _deduplicate(self, experiences: List[SourceExperience]) -> List[SourceExperience]:
        """Remove duplicate experiences based on name similarity."""
        seen_names = set()
        unique = []
        
        for exp in experiences:
            # Normalize name for comparison
            normalized = exp.name.lower().strip()
            normalized = ''.join(c for c in normalized if c.isalnum() or c.isspace())
            
            # Simple dedup: exact match after normalization
            if normalized not in seen_names:
                seen_names.add(normalized)
                unique.append(exp)
        
        return unique
    
    async def fetch_all_async(self, city: str = "Bangalore") -> List[Dict[str, Any]]:
        """Async version of fetch_all for use in async contexts."""
        # Run sync fetchers in thread pool
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.fetch_all, city)


# Singleton instance
_fetcher_instance: Optional[ExperienceSourceFetcher] = None

def get_experience_fetcher() -> ExperienceSourceFetcher:
    """Get or create the singleton fetcher instance."""
    global _fetcher_instance
    if _fetcher_instance is None:
        _fetcher_instance = ExperienceSourceFetcher()
    return _fetcher_instance


# CLI testing
if __name__ == "__main__":
    import json
    
    logging.basicConfig(level=logging.INFO)
    
    fetcher = get_experience_fetcher()
    experiences = fetcher.fetch_all("Bangalore")
    
    print(f"\n{'='*60}")
    print(f"Fetched {len(experiences)} experiences")
    print('='*60)
    
    for exp in experiences[:5]:
        print(f"\n{exp['name']}")
        print(f"  Source: {exp['source']}")
        print(f"  Category: {exp['category']}")
        print(f"  Location: {exp['location']}")
