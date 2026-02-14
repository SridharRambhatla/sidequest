"""
Sidequest — Social Media Tools

Helpers for extracting experience data from Instagram Reels and YouTube URLs.
These are stubs for hackathon — real implementations would use APIs/scraping.
"""

import re
from typing import Optional


async def extract_from_instagram_url(url: str) -> Optional[dict]:
    """
    Extract experience information from an Instagram Reel URL.

    In production, this would:
    1. Use Instagram Graph API or scraping to get video frames
    2. Send frames to Gemini Vision for experience extraction
    3. Return structured experience data

    For now, returns a stub with metadata parsed from the URL.
    """
    # Validate Instagram URL pattern
    instagram_pattern = r"(?:https?://)?(?:www\.)?instagram\.com/(?:reel|p)/([A-Za-z0-9_-]+)"
    match = re.match(instagram_pattern, url)

    if not match:
        return None

    post_id = match.group(1)

    return {
        "source": "instagram",
        "post_id": post_id,
        "url": url,
        "extracted_text": "",  # Would be populated by Gemini Vision
        "experiences": [],  # Would be populated by vision extraction
        "status": "stub",
        "message": "Instagram extraction is stubbed — connect Gemini Vision for full extraction",
    }


async def extract_from_youtube_url(url: str) -> Optional[dict]:
    """
    Extract experience information from a YouTube URL.

    In production, this would:
    1. Use YouTube Data API for video metadata + transcript
    2. Send key frames to Gemini Vision
    3. Use long-context Gemini Pro to synthesize experience data

    For now, returns a stub with metadata parsed from the URL.
    """
    # Validate YouTube URL patterns
    youtube_patterns = [
        r"(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([A-Za-z0-9_-]+)",
        r"(?:https?://)?youtu\.be/([A-Za-z0-9_-]+)",
    ]

    video_id = None
    for pattern in youtube_patterns:
        match = re.match(pattern, url)
        if match:
            video_id = match.group(1)
            break

    if not video_id:
        return None

    return {
        "source": "youtube",
        "video_id": video_id,
        "url": url,
        "extracted_text": "",  # Would be populated by transcript + Vision
        "experiences": [],  # Would be populated by content extraction
        "status": "stub",
        "message": "YouTube extraction is stubbed — connect YouTube API + Gemini for full extraction",
    }


async def extract_from_url(url: str) -> Optional[dict]:
    """Route URL to the appropriate extractor."""
    if "instagram.com" in url:
        return await extract_from_instagram_url(url)
    elif "youtube.com" in url or "youtu.be" in url:
        return await extract_from_youtube_url(url)
    else:
        return {
            "source": "unknown",
            "url": url,
            "status": "unsupported",
            "message": f"URL type not supported: {url}",
        }
