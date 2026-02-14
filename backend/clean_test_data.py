"""
Sidequest Backend — Clean Test Data

Utility to clean up test discovery results from sources/ directory.
"""

import os
from pathlib import Path
from datetime import datetime


def clean_sources_directory():
    """Clean up discovery result files from sources/ directory."""
    sources_dir = Path("sources")
    
    if not sources_dir.exists():
        print("📁 sources/ directory doesn't exist. Nothing to clean.")
        return
    
    # Find all discovery JSON files
    json_files = list(sources_dir.glob("discovery_*.json"))
    
    if not json_files:
        print("📁 No discovery result files found in sources/")
        return
    
    print(f"\n🗑️  Found {len(json_files)} discovery result file(s):\n")
    
    for i, file in enumerate(json_files, 1):
        file_size = file.stat().st_size
        modified_time = datetime.fromtimestamp(file.stat().st_mtime)
        print(f"{i}. {file.name}")
        print(f"   Size: {file_size:,} bytes")
        print(f"   Modified: {modified_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print()
    
    # Ask for confirmation
    response = input("Delete all these files? (y/N): ").strip().lower()
    
    if response == 'y':
        deleted_count = 0
        for file in json_files:
            try:
                file.unlink()
                deleted_count += 1
                print(f"✅ Deleted: {file.name}")
            except Exception as e:
                print(f"❌ Error deleting {file.name}: {e}")
        
        print(f"\n✅ Cleaned up {deleted_count} file(s)")
    else:
        print("\n❌ Cancelled. No files deleted.")


def show_sources_summary():
    """Show summary of discovery results in sources/ directory."""
    sources_dir = Path("sources")
    
    if not sources_dir.exists():
        print("📁 sources/ directory doesn't exist.")
        return
    
    json_files = list(sources_dir.glob("discovery_*.json"))
    
    if not json_files:
        print("📁 No discovery result files found in sources/")
        return
    
    print(f"\n📊 Discovery Results Summary\n")
    print(f"Total files: {len(json_files)}")
    
    total_size = sum(f.stat().st_size for f in json_files)
    print(f"Total size: {total_size:,} bytes ({total_size/1024:.2f} KB)")
    
    # Show oldest and newest
    if json_files:
        oldest = min(json_files, key=lambda f: f.stat().st_mtime)
        newest = max(json_files, key=lambda f: f.stat().st_mtime)
        
        print(f"\nOldest: {oldest.name}")
        print(f"  {datetime.fromtimestamp(oldest.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')}")
        
        print(f"\nNewest: {newest.name}")
        print(f"  {datetime.fromtimestamp(newest.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')}")
    
    print()


def main():
    """Main menu."""
    print("\n" + "="*60)
    print("  SIDEQUEST TEST DATA CLEANER")
    print("="*60)
    
    while True:
        print("\n1. Show summary of discovery results")
        print("2. Clean up all discovery results")
        print("3. Exit")
        print()
        
        choice = input("Select option (1-3): ").strip()
        
        if choice == "1":
            show_sources_summary()
        elif choice == "2":
            clean_sources_directory()
        elif choice == "3":
            print("\n👋 Goodbye!\n")
            break
        else:
            print("\n❌ Invalid option. Please select 1-3.\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted. Goodbye!\n")
