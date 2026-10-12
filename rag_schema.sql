-- ============================================================
-- RAG (Retrieval-Augmented Generation) Schema for SmartTutorAI
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable pgvector extension (needed for vector embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Document chunks table with embeddings for semantic search
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    learning_space_id UUID NOT NULL REFERENCES public.learning_space(id) ON DELETE CASCADE,
    -- Content
    content TEXT NOT NULL,
    content_tokens INT DEFAULT 0,          -- approximate token count
    -- Source metadata
    source_type TEXT NOT NULL,             -- 'pdf', 'youtube', 'topic'
    source_url TEXT,                       -- original PDF URL or YouTube URL
    -- Position metadata for citations
    chunk_index INT NOT NULL DEFAULT 0,    -- order within the document
    page_number INT,                       -- for PDFs: page 1-indexed
    timestamp_start FLOAT,                 -- for YouTube: seconds into video
    timestamp_end FLOAT,                   -- for YouTube: end seconds
    section_title TEXT,                    -- inferred section heading
    -- Embedding (Google text-embedding-004 = 768 dims)
    embedding VECTOR(768),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_doc_chunks_learning_space 
    ON public.document_chunks(learning_space_id);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_source_type 
    ON public.document_chunks(learning_space_id, source_type);

-- IVFFlat index for approximate nearest-neighbour vector search
-- (Use cosine distance for normalized embeddings)
CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding 
    ON public.document_chunks 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- 4. Full-text search index (BM25-style keyword search via tsvector)
ALTER TABLE public.document_chunks 
    ADD COLUMN IF NOT EXISTS content_tsv TSVECTOR 
    GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX IF NOT EXISTS idx_doc_chunks_fts 
    ON public.document_chunks USING GIN (content_tsv);

-- 5. RAG citations table — links AI responses to their source chunks
CREATE TABLE IF NOT EXISTS public.rag_citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Parent message context
    learning_space_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    query TEXT NOT NULL,                   -- the question asked
    response_type TEXT DEFAULT 'doubt',    -- 'doubt', 'summary', 'quiz'
    -- Citation detail
    chunk_id UUID NOT NULL REFERENCES public.document_chunks(id) ON DELETE CASCADE,
    relevance_score FLOAT NOT NULL,        -- cosine similarity score 0-1
    excerpt TEXT NOT NULL,                 -- short snippet from the chunk
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rag_citations_ls 
    ON public.rag_citations(learning_space_id, user_id);

-- 6. Row Level Security
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_citations ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (used by backend)
CREATE POLICY "service_role_full_access_chunks" 
    ON public.document_chunks FOR ALL 
    USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "service_role_full_access_citations" 
    ON public.rag_citations FOR ALL 
    USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 7. Hybrid search function — combines pgvector similarity + BM25 full-text
-- Returns chunks ordered by Reciprocal Rank Fusion (RRF) score
CREATE OR REPLACE FUNCTION public.hybrid_search(
    query_embedding VECTOR(768),
    query_text TEXT,
    p_learning_space_id UUID,
    match_count INT DEFAULT 8
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source_type TEXT,
    source_url TEXT,
    page_number INT,
    timestamp_start FLOAT,
    timestamp_end FLOAT,
    section_title TEXT,
    chunk_index INT,
    similarity FLOAT,
    rrf_score FLOAT
)
LANGUAGE SQL STABLE AS $$
    WITH 
    -- Dense vector search results
    vector_results AS (
        SELECT 
            dc.id,
            dc.content,
            dc.source_type,
            dc.source_url,
            dc.page_number,
            dc.timestamp_start,
            dc.timestamp_end,
            dc.section_title,
            dc.chunk_index,
            1 - (dc.embedding <=> query_embedding) AS similarity,
            ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding) AS vector_rank
        FROM public.document_chunks dc
        WHERE dc.learning_space_id = p_learning_space_id
          AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    -- Full-text BM25 keyword search results
    fts_results AS (
        SELECT 
            dc.id,
            ROW_NUMBER() OVER (
                ORDER BY ts_rank(dc.content_tsv, websearch_to_tsquery('english', query_text)) DESC
            ) AS fts_rank
        FROM public.document_chunks dc
        WHERE dc.learning_space_id = p_learning_space_id
          AND dc.content_tsv @@ websearch_to_tsquery('english', query_text)
        LIMIT match_count * 2
    ),
    -- Reciprocal Rank Fusion (k=60 is standard)
    rrf AS (
        SELECT
            vr.id,
            vr.content,
            vr.source_type,
            vr.source_url,
            vr.page_number,
            vr.timestamp_start,
            vr.timestamp_end,
            vr.section_title,
            vr.chunk_index,
            vr.similarity,
            COALESCE(1.0 / (60 + vr.vector_rank), 0) + 
            COALESCE(1.0 / (60 + fr.fts_rank), 0) AS rrf_score
        FROM vector_results vr
        LEFT JOIN fts_results fr ON vr.id = fr.id
    )
    SELECT * FROM rrf
    ORDER BY rrf_score DESC
    LIMIT match_count;
$$;
