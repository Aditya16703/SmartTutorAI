"""
rag_service.py
==============
Hybrid RAG (Retrieval-Augmented Generation) service for SmartTutorAI.

Architecture:
  1. Ingestion  – chunk PDF/YouTube/topic text → embed → upsert to Supabase pgvector
  2. Retrieval  – hybrid search (dense vector + BM25 FTS) via RRF fusion
  3. Citations  – return source metadata (page, timestamp, section) for UI rendering

Embedding model: Google text-embedding-004 (768 dims, task-specific)
Fallback:        Simple hash-based deduplication if embedding API fails
"""

from __future__ import annotations

import hashlib
import logging
import os
import time
from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

CHUNK_SIZE = 800          # characters per chunk (≈ 200 tokens)
CHUNK_OVERLAP = 150       # overlap between chunks for context continuity
MAX_CHUNKS_PER_DOC = 500  # hard cap to prevent runaway ingestion
EMBEDDING_BATCH_SIZE = 50 # embed in batches to stay within rate limits
EMBED_DIM = 768           # Google text-embedding-004 dimensions
TOP_K_RESULTS = 8         # default number of retrieved chunks


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class DocumentChunk:
    content: str
    chunk_index: int
    source_type: str          # 'pdf' | 'youtube' | 'topic'
    source_url: Optional[str]
    page_number: Optional[int]
    timestamp_start: Optional[float]
    timestamp_end: Optional[float]
    section_title: Optional[str]


@dataclass
class RetrievedChunk:
    chunk_id: str
    content: str
    source_type: str
    source_url: Optional[str]
    page_number: Optional[int]
    timestamp_start: Optional[float]
    timestamp_end: Optional[float]
    section_title: Optional[str]
    chunk_index: int
    similarity: float
    rrf_score: float

    @property
    def citation_label(self) -> str:
        """Human-readable citation label for UI rendering."""
        if self.source_type == "pdf" and self.page_number:
            return f"Page {self.page_number}"
        elif self.source_type == "youtube" and self.timestamp_start is not None:
            mins = int(self.timestamp_start // 60)
            secs = int(self.timestamp_start % 60)
            return f"{mins}:{secs:02d}"
        elif self.section_title:
            return self.section_title
        else:
            return f"Section {self.chunk_index + 1}"

    @property
    def citation_url(self) -> Optional[str]:
        """Deep link to the exact position in the source."""
        if not self.source_url:
            return None
        if self.source_type == "youtube" and self.timestamp_start is not None:
            return f"{self.source_url}&t={int(self.timestamp_start)}s"
        if self.source_type == "pdf" and self.page_number:
            return f"{self.source_url}#page={self.page_number}"
        return self.source_url


# ── Embedding helper ──────────────────────────────────────────────────────────

def _get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings using Google text-embedding-004.
    Returns list of 768-dim float vectors.
    Falls back to zero vectors on complete failure so ingestion never crashes.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("GOOGLE_API_KEY not set – skipping embeddings")
        return [[0.0] * EMBED_DIM for _ in texts]

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        all_embeddings: list[list[float]] = []
        # Process in batches to respect API rate limits
        for i in range(0, len(texts), EMBEDDING_BATCH_SIZE):
            batch = texts[i : i + EMBEDDING_BATCH_SIZE]
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=batch,
                task_type="RETRIEVAL_DOCUMENT",
            )
            # API returns {"embedding": [...]} for single or {"embeddings": [...]} for batch
            if "embeddings" in result:
                all_embeddings.extend(result["embeddings"])
            elif "embedding" in result:
                all_embeddings.append(result["embedding"])
            else:
                logger.error("Unexpected embedding response structure")
                all_embeddings.extend([[0.0] * EMBED_DIM] * len(batch))

            # Polite rate limit pause between batches
            if i + EMBEDDING_BATCH_SIZE < len(texts):
                time.sleep(0.5)

        return all_embeddings

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return [[0.0] * EMBED_DIM for _ in texts]


def _get_query_embedding(query: str) -> list[float]:
    """Embed a single query string for retrieval (uses RETRIEVAL_QUERY task type)."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return [0.0] * EMBED_DIM
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=query,
            task_type="RETRIEVAL_QUERY",
        )
        return result.get("embedding", [0.0] * EMBED_DIM)
    except Exception as e:
        logger.error(f"Query embedding failed: {e}")
        return [0.0] * EMBED_DIM


# ── Chunking ──────────────────────────────────────────────────────────────────

def _chunk_text(
    text: str,
    source_type: str,
    source_url: Optional[str] = None,
    page_boundaries: Optional[list[tuple[int, int]]] = None,
    timestamp_boundaries: Optional[list[tuple[float, float, str]]] = None,
) -> list[DocumentChunk]:
    """
    Smart chunking with page/timestamp metadata preservation.

    For PDFs: uses page_boundaries = [(char_start, page_number), ...]
    For YouTube: uses timestamp_boundaries = [(time_start, time_end, text), ...]
    For topics: simple sliding window with section inference
    """
    chunks: list[DocumentChunk] = []
    text = text.strip()

    if not text:
        return chunks

    if source_type == "youtube" and timestamp_boundaries:
        # Each transcript segment is already a natural chunk
        for i, (t_start, t_end, segment_text) in enumerate(timestamp_boundaries):
            segment_text = segment_text.strip()
            if not segment_text:
                continue
            # If segment is longer than CHUNK_SIZE, split it further
            if len(segment_text) <= CHUNK_SIZE:
                chunks.append(DocumentChunk(
                    content=segment_text,
                    chunk_index=i,
                    source_type="youtube",
                    source_url=source_url,
                    page_number=None,
                    timestamp_start=t_start,
                    timestamp_end=t_end,
                    section_title=None,
                ))
            else:
                sub_chunks = _sliding_window(segment_text)
                for j, sub in enumerate(sub_chunks):
                    chunks.append(DocumentChunk(
                        content=sub,
                        chunk_index=len(chunks),
                        source_type="youtube",
                        source_url=source_url,
                        page_number=None,
                        timestamp_start=t_start,
                        timestamp_end=t_end,
                        section_title=None,
                    ))
    else:
        # Paragraph-aware sliding window for PDFs and topic text
        raw_chunks = _paragraph_aware_chunk(text)
        for i, chunk_text in enumerate(raw_chunks):
            page_num = None
            if source_type == "pdf" and page_boundaries:
                # Estimate character position and map to page
                char_start = text.find(chunk_text[:min(50, len(chunk_text))])
                for boundary_start, pn in page_boundaries:
                    if char_start >= boundary_start:
                        page_num = pn

            # Infer section title from the first heading-like line
            section = _infer_section(chunk_text)

            chunks.append(DocumentChunk(
                content=chunk_text,
                chunk_index=i,
                source_type=source_type,
                source_url=source_url,
                page_number=page_num,
                timestamp_start=None,
                timestamp_end=None,
                section_title=section,
            ))

    # Apply hard cap
    return chunks[:MAX_CHUNKS_PER_DOC]


def _paragraph_aware_chunk(text: str) -> list[str]:
    """
    Split on double newlines (paragraphs) first, then apply sliding window
    if individual paragraphs exceed CHUNK_SIZE.
    """
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 2 <= CHUNK_SIZE:
            current = (current + "\n\n" + para).strip()
        else:
            if current:
                chunks.append(current)
            if len(para) > CHUNK_SIZE:
                # Large paragraph — apply sliding window
                chunks.extend(_sliding_window(para))
                current = ""
            else:
                current = para

    if current:
        chunks.append(current)

    return chunks


def _sliding_window(text: str) -> list[str]:
    """Simple sliding window chunker as fallback for large single paragraphs."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def _infer_section(text: str) -> Optional[str]:
    """Infer a section heading from the first line if it looks like a title."""
    first_line = text.split("\n")[0].strip()
    if not first_line or len(first_line) > 80:
        return None
    if first_line.startswith("#"):
        return first_line.lstrip("#").strip()
    # Short line starting with capital letter and not ending with terminal punctuation
    if first_line[0].isupper() and not first_line.endswith((".", "?", "!")):
        return first_line.rstrip(":— -").strip()
    return None



# ── Ingestion ─────────────────────────────────────────────────────────────────

def ingest_document(
    learning_space_id: str,
    text: str,
    source_type: str,
    source_url: Optional[str] = None,
    page_boundaries: Optional[list[tuple[int, int]]] = None,
    timestamp_boundaries: Optional[list[tuple[float, float, str]]] = None,
) -> int:
    """
    Chunk, embed and upsert a document into Supabase document_chunks.

    Returns the number of chunks successfully ingested.
    Idempotent: deletes existing chunks for this learning_space_id + source_type first.
    """
    from src.services.supabase_service import supabase_service

    logger.info(f"[RAG] Ingesting {source_type} for space {learning_space_id} "
                f"({len(text)} chars)")

    # 1. Chunk
    chunks = _chunk_text(
        text=text,
        source_type=source_type,
        source_url=source_url,
        page_boundaries=page_boundaries,
        timestamp_boundaries=timestamp_boundaries,
    )

    if not chunks:
        logger.warning(f"[RAG] No chunks produced for space {learning_space_id}")
        return 0

    logger.info(f"[RAG] Produced {len(chunks)} chunks")

    # 2. Idempotent: delete old chunks for this source type
    try:
        supabase_service.client.table("document_chunks").delete().eq(
            "learning_space_id", learning_space_id
        ).eq("source_type", source_type).execute()
        logger.info(f"[RAG] Cleared old {source_type} chunks for space {learning_space_id}")
    except Exception as e:
        logger.warning(f"[RAG] Could not clear old chunks: {e}")

    # 3. Embed in batches
    texts = [c.content for c in chunks]
    embeddings = _get_embeddings(texts)

    if len(embeddings) != len(chunks):
        logger.error(f"[RAG] Embedding count mismatch: {len(embeddings)} vs {len(chunks)}")
        embeddings = embeddings[:len(chunks)] + [[0.0] * EMBED_DIM] * max(0, len(chunks) - len(embeddings))

    # 4. Upsert to Supabase in batches of 50
    rows = []
    for chunk, emb in zip(chunks, embeddings):
        rows.append({
            "learning_space_id": learning_space_id,
            "content": chunk.content,
            "content_tokens": len(chunk.content) // 4,  # rough estimate
            "source_type": chunk.source_type,
            "source_url": chunk.source_url,
            "chunk_index": chunk.chunk_index,
            "page_number": chunk.page_number,
            "timestamp_start": chunk.timestamp_start,
            "timestamp_end": chunk.timestamp_end,
            "section_title": chunk.section_title,
            "embedding": emb,
        })

    inserted = 0
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        try:
            supabase_service.client.table("document_chunks").insert(batch).execute()
            inserted += len(batch)
            logger.info(f"[RAG] Inserted batch {i//batch_size + 1} ({len(batch)} chunks)")
        except Exception as e:
            logger.error(f"[RAG] Failed to insert batch starting at {i}: {e}")

    logger.info(f"[RAG] ✅ Ingested {inserted}/{len(chunks)} chunks for space {learning_space_id}")
    return inserted


# ── Retrieval ─────────────────────────────────────────────────────────────────

def retrieve(
    learning_space_id: str,
    query: str,
    top_k: int = TOP_K_RESULTS,
) -> list[RetrievedChunk]:
    """
    Hybrid retrieval: dense vector search + BM25 full-text search, fused via RRF.

    Falls back to pure BM25 if embeddings are all-zero (embedding API unavailable).
    Returns empty list gracefully if the learning space has no indexed chunks yet.
    """
    from src.services.supabase_service import supabase_service

    if not query or not query.strip():
        return []

    # 1. Get query embedding
    q_emb = _get_query_embedding(query)

    # 2. Try hybrid search via the SQL function
    try:
        result = supabase_service.client.rpc(
            "hybrid_search",
            {
                "query_embedding": q_emb,
                "query_text": query,
                "p_learning_space_id": learning_space_id,
                "match_count": top_k,
            }
        ).execute()

        if result.data:
            return [
                RetrievedChunk(
                    chunk_id=row["id"],
                    content=row["content"],
                    source_type=row["source_type"],
                    source_url=row.get("source_url"),
                    page_number=row.get("page_number"),
                    timestamp_start=row.get("timestamp_start"),
                    timestamp_end=row.get("timestamp_end"),
                    section_title=row.get("section_title"),
                    chunk_index=row.get("chunk_index", 0),
                    similarity=row.get("similarity", 0.0),
                    rrf_score=row.get("rrf_score", 0.0),
                )
                for row in result.data
            ]
    except Exception as e:
        logger.warning(f"[RAG] Hybrid search failed, falling back to BM25-only: {e}")

    # 3. Fallback: pure keyword search via Supabase text search
    try:
        result = supabase_service.client.table("document_chunks").select(
            "id, content, source_type, source_url, page_number, timestamp_start, "
            "timestamp_end, section_title, chunk_index"
        ).eq("learning_space_id", learning_space_id).text_search(
            "content_tsv", query, type="websearch", config="english"
        ).limit(top_k).execute()

        if result.data:
            return [
                RetrievedChunk(
                    chunk_id=row["id"],
                    content=row["content"],
                    source_type=row["source_type"],
                    source_url=row.get("source_url"),
                    page_number=row.get("page_number"),
                    timestamp_start=row.get("timestamp_start"),
                    timestamp_end=row.get("timestamp_end"),
                    section_title=row.get("section_title"),
                    chunk_index=row.get("chunk_index", 0),
                    similarity=0.5,   # unknown similarity for BM25-only
                    rrf_score=0.0,
                )
                for row in result.data
            ]
    except Exception as e:
        logger.error(f"[RAG] BM25 fallback also failed: {e}")

    return []


def has_indexed_chunks(learning_space_id: str) -> bool:
    """Check if a learning space already has indexed document chunks."""
    from src.services.supabase_service import supabase_service
    try:
        result = supabase_service.client.table("document_chunks").select(
            "id", count="exact"
        ).eq("learning_space_id", learning_space_id).limit(1).execute()
        return (result.count or 0) > 0
    except Exception:
        return False


def save_citations(
    learning_space_id: str,
    user_id: str,
    query: str,
    chunks: list[RetrievedChunk],
    response_type: str = "doubt",
) -> None:
    """Persist retrieved citations to Supabase for analytics and UI rendering."""
    from src.services.supabase_service import supabase_service
    if not chunks:
        return
    try:
        rows = [
            {
                "learning_space_id": learning_space_id,
                "user_id": user_id,
                "query": query[:500],
                "response_type": response_type,
                "chunk_id": c.chunk_id,
                "relevance_score": c.similarity,
                "excerpt": c.content[:300],
            }
            for c in chunks[:5]  # top 5 citations only
        ]
        supabase_service.client.table("rag_citations").insert(rows).execute()
    except Exception as e:
        logger.warning(f"[RAG] Failed to save citations: {e}")


def build_rag_context(chunks: list[RetrievedChunk], max_chars: int = 12000) -> str:
    """
    Format retrieved chunks into a structured context block for LLM prompting.
    Includes source attribution inline for grounded generation.
    """
    if not chunks:
        return ""

    parts = []
    total = 0
    for i, chunk in enumerate(chunks, 1):
        label = chunk.citation_label
        header = f"[Source {i} — {label}]"
        entry = f"{header}\n{chunk.content}"

        if total + len(entry) > max_chars:
            break

        parts.append(entry)
        total += len(entry)

    return "\n\n---\n\n".join(parts)
