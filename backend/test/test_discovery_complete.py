"""
Complete test for discovery agent with multi-source data fetching
Tests Reddit, Government tourism sites, and validates data quality
"""
import os
import json
from test_discovery_sources import SourceFetcher

def analyze_reddit_quality(posts):
    """Analyze quality of Reddit posts"""
    if not posts:
        return {"quality": "no_data"}
    
    # Check for relevant keywords
    relevant_keywords = ['hidden', 'local', 'gem', 'experience', 'workshop', 
                        'craft', 'heritage', 'artisan', 'cafe', 'food']
    
    relevant_count = 0
    high_engagement = 0
    
    for post in posts:
        title_lower = post['title'].lower()
        text_lower = post['selftext'].lower()
        
        # Check relevance
        if any(kw in title_lower or kw in text_lower for kw in relevant_keywords):
            relevant_count += 1
        
        # Check engagement
        if post['score'] > 5 or post['num_comments'] > 3:
            high_engagement += 1
    
    return {
        "total_posts": len(posts),
        "relevant_posts": relevant_count,
        "high_engagement": high_engagement,
        "relevance_rate": f"{(relevant_count/len(posts)*100):.1f}%",
        "engagement_rate": f"{(high_engagement/len(posts)*100):.1f}%"
    }

def test_complete_discovery():
    """Run complete discovery test with quality analysis"""
    
    print("\n" + "="*70)
    print("COMPLETE DISCOVERY AGENT TEST - MULTI-SOURCE DATA VALIDATION")
    print("="*70)
    
    # Test queries focused on Sidequest use cases
    test_queries = [
        "pottery workshop art crafts",
        "heritage walk cultural experience", 
        "hidden cafes local food"
    ]
    
    fetcher = SourceFetcher(city="Bangalore")
    
    all_results = []
    
    for idx, query in enumerate(test_queries, 1):
        print(f"\n{'─'*70}")
        print(f"TEST {idx}/3: {query}")
        print(f"{'─'*70}")
        
        result = fetcher.fetch_all_sources(query)
        all_results.append(result)
        
        # Analyze Reddit data quality
        reddit_posts = result['sources']['reddit'].get('posts', [])
        quality = analyze_reddit_quality(reddit_posts)
        
        print(f"\n📊 REDDIT DATA QUALITY:")
        print(f"   Total posts: {quality.get('total_posts', 0)}")
        print(f"   Relevant posts: {quality.get('relevant_posts', 0)} ({quality.get('relevance_rate', '0%')})")
        print(f"   High engagement: {quality.get('high_engagement', 0)} ({quality.get('engagement_rate', '0%')})")
        
        # Show sample posts
        if reddit_posts:
            print(f"\n   📝 Sample relevant posts:")
            for i, post in enumerate(reddit_posts[:3], 1):
                print(f"      {i}. r/{post['subreddit']}: {post['title'][:55]}...")
                print(f"         ↑{post['score']} 💬{post['num_comments']}")
        
        # Karnataka Tourism status
        kt_status = result['sources']['karnataka_tourism'].get('status', 'error')
        kt_size = result['sources']['karnataka_tourism'].get('content_length', 0)
        print(f"\n🏛️  KARNATAKA TOURISM:")
        print(f"   Status: {kt_status}")
        if kt_size > 0:
            print(f"   Data size: {kt_size:,} bytes ({kt_size/1024:.1f} KB)")
        
        # Bangalore Tourism status
        bt_results = result['sources']['bangalore_tourism'].get('results', [])
        successful_bt = sum(1 for r in bt_results if r['status'] == 'success')
        print(f"\n🏙️  BANGALORE TOURISM:")
        print(f"   Sources attempted: {len(bt_results)}")
        print(f"   Successful: {successful_bt}")
    
    # Final summary
    print(f"\n{'='*70}")
    print("FINAL SUMMARY")
    print(f"{'='*70}")
    
    total_reddit_posts = sum(r['sources']['reddit'].get('count', 0) for r in all_results)
    total_kt_success = sum(1 for r in all_results if r['sources']['karnataka_tourism'].get('status') == 'fetched')
    
    print(f"\n✅ Total Reddit posts fetched: {total_reddit_posts}")
    print(f"✅ Karnataka Tourism fetches: {total_kt_success}/{len(test_queries)}")
    print(f"\n📁 All raw data saved to: sources/")
    print(f"   - Reddit JSON files (full post data)")
    print(f"   - Karnataka Tourism HTML (full website)")
    print(f"   - Summary JSON (aggregated results)")
    
    print(f"\n💡 NEXT STEPS:")
    print(f"   1. Review sources/ directory for raw data")
    print(f"   2. Validate data quality manually")
    print(f"   3. Integrate with discovery_agent.py to use real sources")
    print(f"   4. Add more sources (Instagram, blogs, local directories)")
    
    print(f"\n{'='*70}\n")
    
    return all_results

if __name__ == "__main__":
    results = test_complete_discovery()
