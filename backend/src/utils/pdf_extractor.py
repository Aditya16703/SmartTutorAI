import logging
import requests
import tempfile
import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)

# Max characters to extract - roughly ~5,000 words
MAX_EXTRACT_CHARS = 25000

def extract_text_from_url(pdf_url: str) -> str:
    """
    Downloads a PDF securely, extracts its text, and returns a truncated string
    safe for LLM context windows.
    """
    if not pdf_url:
        return ""
    
    try:
        logger.info(f"Downloading PDF from {pdf_url}")
        
        # 1. Download file securely into memory/temp file
        response = requests.get(pdf_url, timeout=15)
        response.raise_for_status()

        extracted_text = ""
        
        # write to temp file since PyPDFLoader requires a file path
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(response.content)
            tmp_file_path = tmp_file.name

        # 2. Extract text block by block
        try:
            loader = PyPDFLoader(tmp_file_path)
            pages = loader.load()
            
            for page in pages:
                extracted_text += page.page_content + "\n\n"
                
                # Stop parsing if we hit the limit to save CPU overhead
                if len(extracted_text) > MAX_EXTRACT_CHARS:
                    break
        finally:
            # 3. Always clean up the temp file
            try:
                os.remove(tmp_file_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp PDF file {tmp_file_path}: {e}")

        # 4. Truncate to exact character limit safely
        truncated_text = extracted_text[:MAX_EXTRACT_CHARS]
        
        if len(extracted_text) > MAX_EXTRACT_CHARS:
            logger.info(f"Truncated PDF text limit reached, returning {MAX_EXTRACT_CHARS} chars.")
            truncated_text += "\n\n[... DOCUMENT TRUNCATED DUE TO LENGTH ...]"
            
        logger.info(f"Successfully extracted {len(truncated_text)} characters from PDF.")
        return truncated_text

    except requests.exceptions.RequestException as e:
        logger.error(f"Network error downloading PDF: {e}")
        return ""
    except Exception as e:
        logger.error(f"Failed to parse PDF text: {e}")
        return ""

def describe_pdf_visuals(pdf_url: str) -> str:
    """
    Uses Gemini 1.5 Flash to 'look' at the PDF and describe any 
    diagrams, charts, or formulas found.
    """
    if not pdf_url:
        return ""

    try:
        logger.info(f"Generating visual descriptions for PDF: {pdf_url}")
        
        # Initialize Gemini 1.5 Flash with multimodal support
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)
        
        # Prepare the multimodal message
        # Gemini 1.5 can take PDF URLs/bytes directly in some configurations, 
        # but the most stable way in LangChain is via file contents.
        
        message = HumanMessage(
            content=[
                {"type": "text", "text": "Please provide a detailed description of all diagrams, charts, chemical formulas, and mathematical equations found in this document. Explain what each visual element is and what it represents. Focus on educational value."},
                {"type": "file_url", "file_url": {"url": pdf_url, "mime_type": "application/pdf"}},
            ]
        )
        
        response = llm.invoke([message])
        descriptions = response.content if hasattr(response, 'content') else str(response)
        
        logger.info("Successfully generated visual descriptions.")
        return f"\n\nVisual Analysis of Document:\n---\n{descriptions}\n---\n"

    except Exception as e:
        logger.warning(f"Visual analysis failed: {e}. Falling back to text-only.")
        return ""
