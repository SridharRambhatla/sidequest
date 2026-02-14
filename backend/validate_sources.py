import json
import os
import glob

def validate_sources():
    """Generate a validation report for fetched source data"""
    
    # Find the latest summary file dynamically
    summary_files = sorted(glob.glob("sources/summary_*.json"), reverse=True)
    
    if not summary_files:
        print("No summary file found in sources/ directory!")
        return
    
    summary_file = summary_files[0]  # Most recent file
    print(f"Using summary file: {summary_file}")
    
    with open(summary_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("\n" + "="*60)
    print("DATA VALIDATION REPORT")
    print("="*60)
    
    print(f"\nTimestamp: {data['timestamp']}")
    print(f"City: {data['city']}")
    print(f"Query: {data['query']}")
    
    # Reddit validation
    print("\n" + "-"*60)
    print("REDDIT DATA:")
    print("-"*60)
    reddit = data['sources']['reddit']
    print(f"  Posts fetched: {reddit['count']}")
    print(f"  Raw file: {reddit['raw_file']}")
    
    if reddit['posts']:
        subreddits = set([p['subreddit'] for p in reddit['posts'][:10]])
        print(f"  Sample subreddits: {', '.join(subreddits)}")
        
        print("\n  Top 3 posts:")
        for i, post in enumerate(reddit['posts'][:3], 1):
            print(f"    {i}. [{post['subreddit']}] {post['title'][:60]}...")
            print(f"       Score: {post['score']} | Comments: {post['num_comments']}")
    
    # Karnataka Tourism validation
    print("\n" + "-"*60)
    print("KARNATAKA TOURISM DATA:")
    print("-"*60)
    kt = data['sources']['karnataka_tourism']
    print(f"  Status: {kt['status']}")
    print(f"  Content size: {kt['content_length']:,} bytes")
    print(f"  Raw file: {kt['raw_file']}")
    
    # Bangalore Tourism validation
    print("\n" + "-"*60)
    print("BANGALORE TOURISM DATA:")
    print("-"*60)
    bt = data['sources']['bangalore_tourism']
    print(f"  Sources attempted: {len(bt['results'])}")
    
    for result in bt['results']:
        status_icon = "✓" if result['status'] == 'success' else "✗"
        print(f"  {status_icon} {result['url']}")
        if result['status'] == 'success':
            print(f"    Content size: {result['content_length']:,} bytes")
            print(f"    File: {result['raw_file']}")
        else:
            print(f"    Error: {result.get('error', 'Unknown')}")
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY:")
    print("="*60)
    total_sources = 0
    successful_sources = 0
    
    if reddit['count'] > 0:
        total_sources += 1
        successful_sources += 1
    
    if kt['status'] == 'fetched':
        total_sources += 1
        successful_sources += 1
    
    for result in bt['results']:
        total_sources += 1
        if result['status'] == 'success':
            successful_sources += 1
    
    print(f"  Total sources attempted: {total_sources}")
    print(f"  Successful fetches: {successful_sources}")
    print(f"  Success rate: {(successful_sources/total_sources)*100:.1f}%")
    print(f"\n  All data saved to: sources/")
    print("="*60 + "\n")

if __name__ == "__main__":
    validate_sources()
