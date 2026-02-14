"""
Experience Cache Service for Sidequest

In-memory cache with TTL for experiences fetched from multiple sources.
Supports background refresh every 10 minutes.
"""

import logging
import threading
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Cache TTL in seconds (10 minutes)
CACHE_TTL_SECONDS = 10 * 60

# Background refresh interval (10 minutes)
REFRESH_INTERVAL_SECONDS = 10 * 60


@dataclass
class CacheEntry:
    """Single cache entry with TTL tracking."""
    data: List[Dict[str, Any]]
    created_at: datetime = field(default_factory=datetime.now)
    expires_at: datetime = field(default=None)
    
    def __post_init__(self):
        if self.expires_at is None:
            self.expires_at = self.created_at + timedelta(seconds=CACHE_TTL_SECONDS)
    
    @property
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at
    
    @property
    def ttl_remaining(self) -> int:
        """Seconds remaining until expiry."""
        remaining = (self.expires_at - datetime.now()).total_seconds()
        return max(0, int(remaining))


class ExperienceCache:
    """
    In-memory cache for experiences with auto-refresh capability.
    
    Key structure: "{city}:{category}" or "{city}" for all categories
    """
    
    def __init__(self, auto_refresh: bool = False):
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = threading.Lock()
        self._refresh_thread: Optional[threading.Thread] = None
        self._stop_refresh = threading.Event()
        self._fetcher = None
        
        if auto_refresh:
            self.start_background_refresh()
    
    def _get_fetcher(self):
        """Lazy load the fetcher to avoid circular imports."""
        if self._fetcher is None:
            from services.experience_sources import get_experience_fetcher
            self._fetcher = get_experience_fetcher()
        return self._fetcher
    
    def _make_key(self, city: str, category: Optional[str] = None) -> str:
        """Generate cache key from city and optional category."""
        key = city.lower().strip()
        if category:
            key = f"{key}:{category.lower().strip()}"
        return key
    
    def get(
        self,
        city: str,
        category: Optional[str] = None,
        force_refresh: bool = False
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get experiences from cache.
        
        Args:
            city: City to get experiences for
            category: Optional category filter
            force_refresh: If True, fetch fresh data even if cached
        
        Returns:
            List of experiences or None if not cached
        """
        key = self._make_key(city, category)
        
        with self._lock:
            entry = self._cache.get(key)
            
            if entry is None or entry.is_expired or force_refresh:
                logger.debug(f"Cache miss for key: {key}")
                return None
            
            logger.debug(f"Cache hit for key: {key}, TTL: {entry.ttl_remaining}s")
            return entry.data
    
    def set(
        self,
        city: str,
        experiences: List[Dict[str, Any]],
        category: Optional[str] = None
    ) -> None:
        """
        Store experiences in cache.
        
        Args:
            city: City for the experiences
            experiences: List of experience dictionaries
            category: Optional category for filtered storage
        """
        key = self._make_key(city, category)
        
        with self._lock:
            self._cache[key] = CacheEntry(data=experiences)
            logger.info(f"Cached {len(experiences)} experiences for key: {key}")
    
    def get_or_fetch(
        self,
        city: str,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get from cache or fetch from sources if not cached.
        
        Args:
            city: City to get experiences for
            category: Optional category filter
        
        Returns:
            List of experiences
        """
        # Try cache first
        cached = self.get(city, category)
        if cached is not None:
            return cached
        
        # Fetch from sources
        logger.info(f"Fetching fresh experiences for {city}")
        fetcher = self._get_fetcher()
        experiences = fetcher.fetch_all(city)
        
        # Filter by category if specified
        if category:
            experiences = [
                exp for exp in experiences
                if exp.get("category", "").lower() == category.lower()
            ]
        
        # Cache the results
        self.set(city, experiences, category)
        
        return experiences
    
    def invalidate(self, city: str, category: Optional[str] = None) -> None:
        """Invalidate cache for a specific key."""
        key = self._make_key(city, category)
        
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                logger.info(f"Invalidated cache for key: {key}")
    
    def invalidate_all(self) -> None:
        """Clear entire cache."""
        with self._lock:
            self._cache.clear()
            logger.info("Cleared all cache entries")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            total_entries = len(self._cache)
            expired_entries = sum(1 for e in self._cache.values() if e.is_expired)
            total_experiences = sum(len(e.data) for e in self._cache.values())
            
            return {
                "total_entries": total_entries,
                "expired_entries": expired_entries,
                "valid_entries": total_entries - expired_entries,
                "total_experiences_cached": total_experiences,
                "keys": list(self._cache.keys()),
            }
    
    def start_background_refresh(self, cities: List[str] = None) -> None:
        """
        Start background thread to refresh cache periodically.
        
        Args:
            cities: List of cities to refresh (default: Bangalore)
        """
        if self._refresh_thread is not None and self._refresh_thread.is_alive():
            logger.warning("Background refresh already running")
            return
        
        cities = cities or ["Bangalore"]
        self._stop_refresh.clear()
        
        def refresh_loop():
            logger.info(f"Starting background refresh for cities: {cities}")
            
            while not self._stop_refresh.is_set():
                for city in cities:
                    if self._stop_refresh.is_set():
                        break
                    
                    try:
                        logger.info(f"Background refresh: fetching {city}")
                        fetcher = self._get_fetcher()
                        experiences = fetcher.fetch_all(city)
                        self.set(city, experiences)
                    except Exception as e:
                        logger.error(f"Background refresh failed for {city}: {e}")
                
                # Wait for next refresh interval
                self._stop_refresh.wait(timeout=REFRESH_INTERVAL_SECONDS)
            
            logger.info("Background refresh stopped")
        
        self._refresh_thread = threading.Thread(target=refresh_loop, daemon=True)
        self._refresh_thread.start()
    
    def stop_background_refresh(self) -> None:
        """Stop the background refresh thread."""
        self._stop_refresh.set()
        if self._refresh_thread is not None:
            self._refresh_thread.join(timeout=5)
            self._refresh_thread = None
            logger.info("Background refresh thread stopped")


# Singleton cache instance
_cache_instance: Optional[ExperienceCache] = None

def get_experience_cache(auto_refresh: bool = False) -> ExperienceCache:
    """Get or create the singleton cache instance."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = ExperienceCache(auto_refresh=auto_refresh)
    return _cache_instance


# CLI testing
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    cache = get_experience_cache()
    
    print("Testing cache...")
    print(f"Stats: {cache.get_stats()}")
    
    # Test get_or_fetch
    print("\nFetching experiences...")
    experiences = cache.get_or_fetch("Bangalore")
    print(f"Fetched {len(experiences)} experiences")
    print(f"Stats: {cache.get_stats()}")
    
    # Test cache hit
    print("\nSecond fetch (should be cached)...")
    experiences2 = cache.get_or_fetch("Bangalore")
    print(f"Got {len(experiences2)} experiences from cache")
