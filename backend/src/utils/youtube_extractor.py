import re
from youtube_transcript_api import YouTubeTranscriptApi
from typing import Optional

def extract_video_id(url: str) -> Optional[str]:
    """
    Extract the video ID from a YouTube URL.
    Supports various formats: youtube.com, youtu.be, etc.
    """
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/|v\/|youtu.be\/)([0-9A-Za-z_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def fetch_youtube_transcript(url: str, languages=['en', 'hi', 'te', 'ta', 'kn', 'ml']) -> str:
    """
    Fetches the transcript for a YouTube video.
    Attempts common Indian languages if English is not primary.
    """
    video_id = extract_video_id(url)
    if not video_id:
        return ""

    try:
        # Try to get the transcript
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to find a manual or generated transcript in the requested languages
        try:
            transcript = transcript_list.find_transcript(languages)
            data = transcript.fetch()
            return " ".join([item['text'] for item in data])
        except:
            # Fallback to the first available transcript
            transcript = next(iter(transcript_list))
            data = transcript.fetch()
            return " ".join([item['text'] for item in data])
            
    except Exception as e:
        print(f"Error fetching YouTube transcript: {e}")
        return ""
