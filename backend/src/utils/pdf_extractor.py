"""
pdf_extractor.py
================
Extracts text from PDF URLs with accurate page-level metadata
for RAG chunk positioning and citations.
"""

import logging
import requests
import tempfile
import os
from typing import Optional

logger = logging.getLogger(__name__)

# Max characters for legacy (non-RAG) full-text extract
MAX_EXTRACT_CHARS = 25000
# Per-page character limit for RAG chunking (no global truncation)
MAX_CHARS_PER_PAGE = 8000


def extract_text_from_url(pdf_url: str) -> str:
    """
    Legacy: Downloads a PDF and returns a single truncated string (~5,000 words).
    Used as fallback when RAG is not available.
    """
    if not pdf_url:
        return ""

    try:
        logger.info(f"Downloading PDF from {pdf_url}")
        response = requests.get(pdf_url, timeout=20)
        response.raise_for_status()

        extracted_text = ""

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(response.content)
            tmp_file_path = tmp_file.name

        try:
            from pypdf import PdfReader
            reader = PdfReader(tmp_file_path)
            for page in reader.pages:
                extracted_text += (page.extract_text() or "") + "\n\n"
                if len(extracted_text) > MAX_EXTRACT_CHARS:
                    break
        finally:
            try:
                os.remove(tmp_file_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp PDF: {e}")

        truncated = extracted_text[:MAX_EXTRACT_CHARS]
        if len(extracted_text) > MAX_EXTRACT_CHARS:
            truncated += "\n\n[... DOCUMENT TRUNCATED DUE TO LENGTH ...]"

        logger.info(f"Extracted {len(truncated)} chars from PDF")
        return truncated

    except requests.exceptions.RequestException as e:
        logger.error(f"Network error downloading PDF: {e}")
        return ""
    except Exception as e:
        logger.error(f"Failed to parse PDF: {e}")
        return ""


def extract_text_with_pages(
    pdf_url: str,
) -> tuple[str, list[tuple[int, int]], list[tuple[int, int]]]:
    """
    Downloads a PDF and extracts full text with page-level boundaries.

    Returns:
        full_text: complete document text (no truncation for RAG use)
        page_boundaries: list of (char_start_offset, page_number) pairs
        page_char_counts: list of (page_number, char_count) for diagnostics

    Edge cases handled:
        - Empty pages → skipped, boundary still recorded
        - Pages with only images (no extractable text) → placeholder inserted
        - Network errors → returns ("", [], [])
        - Encrypted / password-protected PDFs → caught and logged
    """
    if not pdf_url:
        return "", [], []

    try:
        logger.info(f"[PDF] Downloading with page tracking: {pdf_url}")
        response = requests.get(pdf_url, timeout=30, stream=True)
        response.raise_for_status()

        content_length = int(response.headers.get("content-length", 0))
        if content_length > 50 * 1024 * 1024:  # 50 MB guard
            logger.warning(f"[PDF] File too large ({content_length} bytes), using legacy extractor")
            fallback = extract_text_from_url(pdf_url)
            return fallback, [], []

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            for chunk in response.iter_content(chunk_size=8192):
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name

        full_text = ""
        page_boundaries: list[tuple[int, int]] = []
        page_char_counts: list[tuple[int, int]] = []

        try:
            from pypdf import PdfReader
            reader = PdfReader(tmp_file_path)

            # Guard: encrypted PDF
            if reader.is_encrypted:
                logger.warning(f"[PDF] Encrypted PDF, cannot extract text from {pdf_url}")
                return "", [], []

            total_pages = len(reader.pages)
            logger.info(f"[PDF] Processing {total_pages} pages")

            for page_num, page in enumerate(reader.pages, start=1):
                char_start = len(full_text)
                page_boundaries.append((char_start, page_num))

                page_text = page.extract_text() or ""
                page_text = page_text.strip()

                if not page_text:
                    # Image-only or empty page — insert placeholder
                    placeholder = f"\n[Page {page_num}: Image or diagram — no extractable text]\n\n"
                    full_text += placeholder
                    page_char_counts.append((page_num, 0))
                else:
                    # Truncate excessively long pages (scanned PDF with OCR errors)
                    if len(page_text) > MAX_CHARS_PER_PAGE:
                        page_text = page_text[:MAX_CHARS_PER_PAGE]
                        page_text += f"\n[Page {page_num} truncated]"

                    full_text += page_text + "\n\n"
                    page_char_counts.append((page_num, len(page_text)))

        finally:
            try:
                os.remove(tmp_file_path)
            except Exception as e:
                logger.warning(f"[PDF] Failed to clean temp file: {e}")

        logger.info(
            f"[PDF] ✅ Extracted {len(full_text)} chars over {len(page_boundaries)} pages"
        )
        return full_text, page_boundaries, page_char_counts

    except requests.exceptions.Timeout:
        logger.error(f"[PDF] Download timed out for {pdf_url}")
        return "", [], []
    except requests.exceptions.HTTPError as e:
        logger.error(f"[PDF] HTTP error {e.response.status_code} for {pdf_url}")
        return "", [], []
    except requests.exceptions.RequestException as e:
        logger.error(f"[PDF] Network error: {e}")
        return "", [], []
    except Exception as e:
        logger.error(f"[PDF] Unexpected error: {e}")
        return "", [], []


def describe_pdf_visuals(pdf_url: str) -> str:
    """
    Uses Gemini 1.5 Flash multimodal to describe diagrams, charts, and formulas
    in a PDF. Returns empty string on failure (non-critical enhancement).
    """
    if not pdf_url:
        return ""

    try:
        logger.info(f"[PDF] Generating visual descriptions for: {pdf_url}")

        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage

        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)

        message = HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": (
                        "Please provide a detailed description of all diagrams, charts, "
                        "chemical formulas, and mathematical equations found in this document. "
                        "Explain what each visual element represents in an educational context."
                    ),
                },
                {
                    "type": "file_url",
                    "file_url": {"url": pdf_url, "mime_type": "application/pdf"},
                },
            ]
        )

        response = llm.invoke([message])
        descriptions = response.content if hasattr(response, "content") else str(response)

        logger.info("[PDF] Visual descriptions generated successfully")
        return f"\n\nVisual Analysis:\n---\n{descriptions}\n---\n"

    except Exception as e:
        logger.warning(f"[PDF] Visual analysis failed (non-critical): {e}")
        return ""
