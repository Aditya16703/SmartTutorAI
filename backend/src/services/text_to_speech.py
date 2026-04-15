# Generate text to speech
# Primary: ElevenLabs  |  Fallback: gTTS (Google Text-to-Speech)
import logging
import os
import tempfile
from src.services.supabase_service import supabase_service
from datetime import datetime

logger = logging.getLogger(__name__)

# ── Language maps ──────────────────────────────────────────────────────

# gTTS language codes (fallback)
GTTS_LANGUAGE_MAP = {
    'en-IN': 'en', 'hi-IN': 'hi',
    'en': 'en', 'hi': 'hi',
    'english': 'en', 'hindi': 'hi',
    'tamil': 'ta', 'telugu': 'te', 'marathi': 'mr',
    'bengali': 'bn', 'kannada': 'kn', 'gujarati': 'gu',
    'malayalam': 'ml', 'punjabi': 'pa', 'odia': 'or',
    'assamese': 'as', 'urdu': 'ur',
}

# ElevenLabs language codes (ISO 639-1)
ELEVENLABS_LANGUAGE_MAP = {
    'english': 'en', 'hindi': 'hi', 'tamil': 'ta', 'telugu': 'te',
    'marathi': 'mr', 'bengali': 'bn', 'kannada': 'kn', 'gujarati': 'gu',
    'malayalam': 'ml', 'punjabi': 'pa', 'urdu': 'ur',
    'en': 'en', 'hi': 'hi', 'ta': 'ta', 'te': 'te',
    'en-IN': 'en', 'hi-IN': 'hi',
}

# ── ElevenLabs helper ──────────────────────────────────────────────────

def _generate_elevenlabs_audio(text: str, language: str) -> bytes:
    """
    Calls the ElevenLabs REST API to synthesise speech.
    Returns raw MP3 bytes.
    Raises on any error so the caller can fallback to gTTS.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set")

    # Multilingual v2 voices work best across Indian languages
    VOICE_ID = "EXAVITQu4vr4xnSDxMaL"   # "Bella" — multilingual, clear, friendly

    import httpx

    lang_code = ELEVENLABS_LANGUAGE_MAP.get(language.lower(), "en")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text[:5000],          # ElevenLabs limit
        "model_id": "eleven_multilingual_v2",
        "language_code": lang_code,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.3,
            "use_speaker_boost": True,
        },
    }

    with httpx.Client(timeout=60) as client:
        response = client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.content


# ── gTTS fallback helper ───────────────────────────────────────────────

def _generate_gtts_audio(text: str, language: str) -> bytes:
    """Generates audio using gTTS as fallback. Returns raw MP3 bytes."""
    from gtts import gTTS

    lang_code = GTTS_LANGUAGE_MAP.get(language.lower(), 'en')

    fallback_chain = [lang_code]
    if lang_code != 'hi':
        fallback_chain.append('hi')
    if lang_code != 'en':
        fallback_chain.append('en')

    max_chars = 5000
    if len(text) > max_chars:
        logger.warning(f"Text too long ({len(text)} chars), truncating to {max_chars}")
        text = text[:max_chars]

    for try_lang in fallback_chain:
        try:
            logger.info(f"🔊 gTTS generating in language: {try_lang}")
            tts = gTTS(text=text, lang=try_lang, slow=False)
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
                tts.save(tmp.name)
                tmp_path = tmp.name
            with open(tmp_path, 'rb') as f:
                audio_data = f.read()
            os.unlink(tmp_path)
            return audio_data
        except Exception as e:
            logger.warning(f"⚠️ gTTS failed for '{try_lang}': {e}")
            if try_lang == fallback_chain[-1]:
                raise
            logger.info("🔄 gTTS falling back to next language...")

    raise RuntimeError("All gTTS fallbacks exhausted")


# ── Public API ─────────────────────────────────────────────────────────

def generate_tts(text_input: str, language_code: str) -> dict:
    """
    Generates audio from text.
    1. Tries ElevenLabs (best quality, multi-lingual).
    2. Falls back to gTTS on any failure.
    Uploads to Supabase Storage and returns public URL.
    """
    audio_data: bytes | None = None
    provider_used = "unknown"

    # ── 1. Try ElevenLabs ──
    try:
        logger.info(f"🎙️ Attempting ElevenLabs TTS for language: {language_code}")
        audio_data = _generate_elevenlabs_audio(text_input, language_code)
        provider_used = "elevenlabs"
        logger.info("✅ ElevenLabs TTS succeeded")
    except Exception as el_err:
        logger.warning(f"⚠️ ElevenLabs TTS failed ({el_err}), falling back to gTTS...")

    # ── 2. Fall back to gTTS ──
    if audio_data is None:
        try:
            audio_data = _generate_gtts_audio(text_input, language_code)
            provider_used = "gtts"
            logger.info("✅ gTTS fallback succeeded")
        except Exception as gtts_err:
            logger.error(f"❌ gTTS also failed: {gtts_err}")
            raise gtts_err

    # ── 3. Upload to Supabase Storage ──
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"audio_{timestamp}.mp3"

    upload_response = supabase_service.upload_file(
        file_path=filename,
        file_data=audio_data,
    )
    public_url = supabase_service.get_public_url(filename)

    logger.info(f"✅ TTS audio uploaded ({provider_used}): {filename}")

    return {
        "success": True,
        "filename": filename,
        "public_url": public_url,
        "provider": provider_used,
        "upload_response": upload_response,
    }