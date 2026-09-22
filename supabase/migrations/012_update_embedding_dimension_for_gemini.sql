-- Migration: Update RAG embedding dimension for Gemini text-embedding-004
--
-- Background: Gemini text-embedding-004 returns 768-dimensional vectors.
-- The existing schema used vector(1536) for OpenAI text-embedding-3-small.
-- This migration updates the column, function signature, and index.
--
-- SAFETY: ALTER COLUMN TYPE will fail if existing non-NULL embeddings have
-- the wrong dimension. Since the previous GeminiProvider.embed() raised
-- NotImplementedError, no valid Gemini embeddings were stored. If any
-- OpenAI embeddings were stored (unlikely with exhausted credits), this
-- migration will abort and must be resolved by clearing those rows or
-- re-embedding with a compatible model.

-- 1. Drop existing HNSW index if it exists (required before altering column type)
DROP INDEX IF EXISTS public.idx_chunks_embedding;

-- 2. Alter embedding column from vector(1536) to vector(768)
--    NULL embeddings pass through. Non-NULL rows with the wrong dimension
--    will cause PostgreSQL to abort with a dimension mismatch error.
ALTER TABLE public.document_chunks
    ALTER COLUMN embedding TYPE vector(768);

-- 3. Update the vector search function to accept vector(768)
CREATE OR REPLACE FUNCTION match_document_chunks(
    p_owner_id UUID,
    p_query_embedding vector(768),
    p_match_threshold FLOAT DEFAULT 0.7,
    p_match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_index INTEGER,
    content TEXT,
    page_number INTEGER,
    similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_index,
        dc.content,
        dc.page_number,
        1 - (dc.embedding OPERATOR(extensions.<=>) p_query_embedding) AS similarity
    FROM public.document_chunks dc
    WHERE dc.owner_id = p_owner_id
      AND dc.embedding IS NOT NULL
      AND 1 - (dc.embedding OPERATOR(extensions.<=>) p_query_embedding) >= p_match_threshold
    ORDER BY dc.embedding OPERATOR(extensions.<=>) p_query_embedding
    LIMIT p_match_count;
$$;

-- 4. Recreate HNSW index with updated vector dimension
CREATE INDEX idx_chunks_embedding
    ON public.document_chunks
    USING hnsw (embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 5. Add a comment documenting the embedding dimension
COMMENT ON COLUMN public.document_chunks.embedding IS '768-dim vector from Gemini text-embedding-004 for RAG';
