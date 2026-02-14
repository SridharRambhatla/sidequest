import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create sources directory if it doesn't exist
SOURCES_DIR = "sources"
os.makedirs(SOURCES_DIR, exist_ok=True)

class SourceFetcher:
    """Fetches data from multiple sources for validation"""
    
    def __init__(self, city: str = "Bangalore"):
        self.city = city
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
    def fetch_reddit_data(self, query: str) -> Dict[str, Any]:
        """Fetch data from Reddit using their JSON API"""
        logger.info(f"Fetching Reddit data for: {query}")
        
        try:
            # Reddit JSON API (no auth needed for public posts)
            search_query = f"{query} {self.city}"
            url = f"https://www.reddit.com/search.json"
            params = {
                "q": search_query,
                "limit": 25,
                "sort": "relevance"
            }
            
            headers = {
                "User-Agent": "SidequestDiscoveryBot/1.0"
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
            
            # Save raw data
            filename = f"{SOURCES_DIR}/reddit_{self.timestamp}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Reddit data saved to {filename}")
            
            # Extract relevant posts
            posts = []
            for child in data.get('data', {}).get('children', []):
                post_data = child.get('data', {})
                posts.append({
                    "title": post_data.get('title'),
                    "subreddit": post_data.get('subreddit'),
                    "url": post_data.get('url'),
                    "selftext": post_data.get('selftext', '')[:500],  # First 500 chars
                    "score": post_data.get('score'),
                    "num_comments": post_data.get('num_comments'),
                    "created_utc": post_data.get('created_utc')
                })
            
            return {
                "source": "reddit",
                "query": search_query,
                "count": len(posts),
                "posts": posts,
                "raw_file": filename
            }
            
        except Exception as e:
            logger.error(f"Reddit fetch error: {e}")
            return {"source": "reddit", "error": str(e), "posts": []}
    
    def fetch_karnataka_tourism(self) -> Dict[str, Any]:
        """Fetch data from Karnataka Tourism website"""
        logger.info("Fetching Karnataka Tourism data")
        
        try:
            # Karnataka Tourism official site
            url = "https://www.karnatakatourism.org/"
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                html_content = response.text
            
            # Save raw HTML
            filename = f"{SOURCES_DIR}/karnataka_tourism_{self.timestamp}.html"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            logger.info(f"Karnataka Tourism data saved to {filename}")
            
            return {
                "source": "karnataka_tourism",
                "url": url,
                "status": "fetched",
                "content_length": len(html_content),
                "raw_file": filename
            }
            
        except Exception as e:
            logger.error(f"Karnataka Tourism fetch error: {e}")
            return {"source": "karnataka_tourism", "error": str(e)}
    
    def fetch_bangalore_tourism(self) -> Dict[str, Any]:
        """Fetch data from Bangalore tourism sources"""
        logger.info("Fetching Bangalore Tourism data")
        
        try:
            # Try multiple Bangalore tourism endpoints
            urls = [
                "https://www.bengaluru.gov.in/",
                "https://tourism.karnataka.gov.in/Bangalore"
            ]
            
            results = []
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            for url in urls:
                try:
                    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                        response = client.get(url, headers=headers)
                        response.raise_for_status()
                        
                        # Save each source
                        safe_name = url.replace("https://", "").replace("/", "_")
                        filename = f"{SOURCES_DIR}/bangalore_{safe_name}_{self.timestamp}.html"
                        with open(filename, 'w', encoding='utf-8') as f:
                            f.write(response.text)
                        
                        results.append({
                            "url": url,
                            "status": "success",
                            "content_length": len(response.text),
                            "raw_file": filename
                        })
                        logger.info(f"Saved {url} to {filename}")
                        
                except Exception as e:
                    logger.warning(f"Failed to fetch {url}: {e}")
                    results.append({"url": url, "status": "failed", "error": str(e)})
            
            return {
                "source": "bangalore_tourism",
                "results": results
            }
            
        except Exception as e:
            logger.error(f"Bangalore Tourism fetch error: {e}")
            return {"source": "bangalore_tourism", "error": str(e)}
    
    def fetch_all_sources(self, query: str) -> Dict[str, Any]:
        """Fetch from all sources and compile results"""
        logger.info(f"Starting multi-source fetch for query: {query}")
        
        results = {
            "timestamp": self.timestamp,
            "city": self.city,
            "query": query,
            "sources": {}
        }
        
        # Fetch from each source
        results["sources"]["reddit"] = self.fetch_reddit_data(query)
        results["sources"]["karnataka_tourism"] = self.fetch_karnataka_tourism()
        results["sources"]["bangalore_tourism"] = self.fetch_bangalore_tourism()
        
        # Save compiled results
        summary_file = f"{SOURCES_DIR}/summary_{self.timestamp}.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Summary saved to {summary_file}")
        
        return results


def test_discovery_with_sources():
    """Test the discovery agent with real source data"""
    
    test_queries = [
        "pottery workshop art crafts",
        "heritage walk cultural experience",
        "hidden cafes local food"
    ]
    
    fetcher = SourceFetcher(city="Bangalore")
    
    all_results = []
    
    for query in test_queries:
        logger.info(f"\n{'='*60}")
        logger.info(f"Testing query: {query}")
        logger.info(f"{'='*60}\n")
        
        result = fetcher.fetch_all_sources(query)
        all_results.append(result)
        
        # Print summary
        print(f"\nQuery: {query}")
        print(f"Reddit posts found: {result['sources']['reddit'].get('count', 0)}")
        print(f"Karnataka Tourism: {result['sources']['karnataka_tourism'].get('status', 'error')}")
        print(f"Bangalore Tourism sources: {len(result['sources']['bangalore_tourism'].get('results', []))}")
    
    # Final summary
    print(f"\n{'='*60}")
    print(f"All source data saved to: {SOURCES_DIR}/")
    print(f"Total queries tested: {len(test_queries)}")
    print(f"{'='*60}\n")
    
    return all_results


if __name__ == "__main__":
    results = test_discovery_with_sources()
    print("\nTest complete! Check the sources/ directory for all fetched data.")
