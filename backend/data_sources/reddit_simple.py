"""
Simple Reddit client for fetching travel posts.
Provides minimal functionality to enrich context with community insights.
"""

import os
from typing import List, Optional
import praw


class SimpleRedditClient:
    """Minimal Reddit client for fetching travel posts."""
    
    def __init__(self):
        """Initialize Reddit client with credentials from environment."""
        self.reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            user_agent="Sidequest/1.0"
        )
    
    def get_posts(self, city: str, query: str, limit: int = 5) -> List[dict]:
        """
        Fetch recent posts from city subreddit.
        
        Args:
            city: City name to search for
            query: Search query string
            limit: Maximum number of posts to retrieve (default: 5)
        
        Returns:
            List of dicts with: title, content, url, upvotes, source_label
        """
        subreddit_name = self._get_city_subreddit(city)
        if not subreddit_name:
            return []
        
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            posts = []
            
            # Search recent posts
            for post in subreddit.search(query, limit=limit, time_filter="month"):
                posts.append({
                    "title": post.title,
                    "content": post.selftext[:500],  # First 500 chars
                    "url": f"https://reddit.com{post.permalink}",
                    "upvotes": post.score,
                    "source_label": f"Reddit r/{subreddit_name}"
                })
            
            return posts
            
        except Exception as e:
            print(f"Reddit fetch failed: {e}")
            return []
    
    def _get_city_subreddit(self, city: str) -> Optional[str]:
        """
        Map city to subreddit name.
        
        Args:
            city: City name
        
        Returns:
            Subreddit name or None if not mapped
        """
        mapping = {
            "bangalore": "bangalore",
            "mumbai": "mumbai",
            "delhi": "delhi",
            "hyderabad": "hyderabad",
            "chennai": "chennai",
            "kolkata": "kolkata",
            "pune": "pune",
            "jaipur": "jaipur",
            "goa": "goa",
        }
        return mapping.get(city.lower())


def format_reddit_context(posts: List[dict]) -> str:
    """
    Format Reddit posts for LLM prompt.
    
    Args:
        posts: List of post dictionaries from get_posts()
    
    Returns:
        Formatted string with Reddit insights for LLM context
    """
    if not posts:
        return ""
    
    context = "\n\n--- Community Insights from Reddit ---\n"
    for post in posts:
        context += f"• {post['title']}\n"
        if post['content']:
            context += f"  {post['content'][:200]}...\n"
        context += f"  Source: {post['source_label']}\n\n"
    
    return context
