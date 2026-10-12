"""
youtube_extractor.py
====================
Extracts YouTube transcripts with precise timestamp metadata
for RAG chunk positioning and citations.
"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract the 11-char video ID from any YouTube URL format.
    Handles: watch?v=, youtu.be/, embed/, shorts/, live/
    """
    patterns = [
        r"(?:v=|\/videos\/|embed\/|youtu\.be\/|\/v\/|\/e\/|watch\?v%3D|watch\?feature=player_embedded&v=|%2Fvideos%2F|embed%\u200C\u200B2F|youtu\.be%2F|%2Fv%2F)([0-9A-Za-z_-]{11})",
        r"(?:shorts\/|live\/)([0-9A-Za-z_-]{11})",
        r"([0-9A-Za-z_-]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            vid = match.group(1)
            if len(vid) == 11:
                return vid
    return None


def fetch_youtube_transcript(
    url: str,
    languages: list[str] = None,
) -> str:
    """
    Legacy: Fetch transcript as a single concatenated string (~5,000 words).
    Used when RAG is not available.
    Falls back through multiple language codes.
    """
    if languages is None:
        languages = ["en", "hi", "te", "ta", "kn", "ml"]

    video_id = extract_video_id(url)
    if not video_id:
        logger.warning(f"[YouTube] Could not extract video ID from URL: {url}")
        return ""

    try:
        from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        try:
            transcript = transcript_list.find_transcript(languages)
        except NoTranscriptFound:
            # Fall back to first available
            transcript = next(iter(transcript_list))

        data = transcript.fetch()
        return " ".join([item["text"] for item in data if item.get("text")])

    except Exception as e:
        logger.error(f"[YouTube] Transcript fetch failed for {video_id}: {e}")
        return ""


def fetch_youtube_transcript_with_timestamps(
    url: str,
    languages: list[str] = None,
) -> tuple[str, list[tuple[float, float, str]]]:
    """
    Fetch YouTube transcript with precise per-segment timestamps.

    Returns:
        full_text:  concatenated transcript text
        segments:   list of (start_seconds, end_seconds, text) tuples

    Edge cases:
        - Auto-generated captions → still works, lower quality
        - No captions → returns ("", [])
        - Multi-language playlists → tries preferred languages in order
        - Very long videos → all segments included (no truncation in RAG mode)
        - Segments with empty text → filtered out
    """
    if languages is None:
        languages = ["en", "hi", "te", "ta", "kn", "ml"]

    video_id = extract_video_id(url)
    if not video_id:
        logger.warning(f"[YouTube] Invalid URL, cannot extract video ID: {url}")
        return "", []

    try:
        from youtube_transcript_api import (
            YouTubeTranscriptApi,
            NoTranscriptFound,
            TranscriptsDisabled,
            VideoUnavailable,
        )

        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        except (TranscriptsDisabled, VideoUnavailable) as e:
            logger.warning(f"[YouTube] Transcripts unavailable for {video_id}: {e}")
            return "", []

        # Try preferred languages, fall back to any available
        try:
            transcript = transcript_list.find_transcript(languages)
            logger.info(f"[YouTube] Found transcript in language: {transcript.language_code}")
        except NoTranscriptFound:
            try:
                transcript = next(iter(transcript_list))
                logger.info(f"[YouTube] Fallback transcript: {transcript.language_code}")
            except StopIteration:
                logger.warning(f"[YouTube] No transcripts at all for {video_id}")
                return "", []

        raw_data = transcript.fetch()

        # Build (start, end, text) tuples, filtering empty segments
        segments: list[tuple[float, float, str]] = []
        full_parts: list[str] = []

        for item in raw_data:
            text = (item.get("text") or "").strip()
            if not text:
                continue
            start = float(item.get("start", 0))
            duration = float(item.get("duration", 0))
            end = start + duration
            segments.append((start, end, text))
            full_parts.append(text)

        full_text = " ".join(full_parts)
        logger.info(
            f"[YouTube] ✅ Fetched {len(segments)} transcript segments "
            f"({len(full_text)} chars) for {video_id}"
        )
        return full_text, segments

    except Exception as e:
        logger.error(f"[YouTube] Unexpected error for {video_id}: {e}")
        return "", []


def build_youtube_url_with_timestamp(base_url: str, seconds: float) -> str:
    """
    Construct a YouTube URL that deep-links to a specific timestamp.
    Works with both youtube.com and youtu.be formats.
    """
    video_id = extract_video_id(base_url)
    if video_id:
        t = int(seconds)
        return f"https://www.youtube.com/watch?v={video_id}&t={t}s"
    # Fallback: append t param to whatever URL we have
    separator = "&" if "?" in base_url else "?"
    return f"{base_url}{separator}t={int(seconds)}s"
