# Generate text to speech using gTTS (Google Text-to-Speech)
import logging
import os
import tempfile
from gtts import gTTS
from src.services.supabase_service import supabase_service
from datetime import datetime

logger = logging.getLogger(__name__)

# Map language names to gTTS language codes
LANGUAGE_MAP = {
    # Standard codes
    'en-IN': 'en',
    'hi-IN': 'hi',
    'en': 'en',
    'hi': 'hi',
    # Language names (lowercase) → gTTS codes
    'english': 'en',
    'hindi': 'hi',
    'tamil': 'ta',
    'telugu': 'te',
    'marathi': 'mr',
    'bengali': 'bn',
    'kannada': 'kn',
    'gujarati': 'gu',
    'malayalam': 'ml',
    'punjabi': 'pa',
    'odia': 'or',      # gTTS uses 'or' for Odia (formerly Oriya)
    'assamese': 'as',   # Note: gTTS may have limited Assamese support
    'urdu': 'ur',
}


def generate_tts(text_input: str, language_code: str):
    """
    Generates audio overview using Google Text-to-Speech (gTTS).

    Args:
        text_input : script text to convert to speech
        language_code : language code (e.g., 'en-IN', 'hi-IN', 'english', 'hindi')
    
    Returns:
        dict with success, filename, and public_url
    """

    # Resolve language code
    lang = LANGUAGE_MAP.get(language_code.lower(), 'en')
    
    # Truncate very long text to avoid timeouts (gTTS limit)
    max_chars = 5000
    if len(text_input) > max_chars:
        logger.warning(f"Text too long ({len(text_input)} chars), truncating to {max_chars}")
        text_input = text_input[:max_chars]

    # Try the requested language, then fall back to Hindi, then English
    fallback_chain = [lang]
    if lang != 'hi':
        fallback_chain.append('hi')
    if lang != 'en':
        fallback_chain.append('en')

    audio_data = None
    used_lang = lang

    for try_lang in fallback_chain:
        try:
            logger.info(f"🔊 Generating TTS audio in language: {try_lang} (requested: {language_code})")
            tts = gTTS(text=text_input, lang=try_lang, slow=False)
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
                tts.save(tmp_file.name)
                tmp_path = tmp_file.name

            # Read the audio data
            with open(tmp_path, 'rb') as f:
                audio_data = f.read()

            # Clean up temp file
            os.unlink(tmp_path)
            used_lang = try_lang
            break  # Success — stop trying fallbacks

        except Exception as e:
            logger.warning(f"⚠️ TTS failed for language '{try_lang}': {e}")
            if try_lang == fallback_chain[-1]:
                # Last fallback also failed — re-raise
                logger.error(f"❌ All TTS fallbacks failed for: {language_code}")
                raise e
            logger.info(f"🔄 Falling back to next language...")

    if used_lang != lang:
        logger.info(f"ℹ️ Used fallback language '{used_lang}' instead of '{lang}'")

    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"audio_{timestamp}.mp3"

    # Upload to Supabase storage
    upload_response = supabase_service.upload_file(
        file_path=filename,
        file_data=audio_data
    )

    # Get public URL
    public_url = supabase_service.get_public_url(filename)

    logger.info(f"✅ TTS audio uploaded successfully: {filename}")

    return {
        "success": True,
        "filename": filename,
        "public_url": public_url,
        "upload_response": upload_response
    }