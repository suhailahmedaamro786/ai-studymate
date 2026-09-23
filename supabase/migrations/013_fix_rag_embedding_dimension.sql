-- Fix production RAG schema for Gemini Embedding 2 (768 dimensions).
--
-- The application now generates 768-dim query/document embeddings, but the
-- production database is still rejecting queries with:
--   different vector dimensions 1536 and 768
--
-- Existing chunks cannot be safely cast from vector(1536) to vector(768).
-- They must be regenerated with the current embedding model, so remove the
-- incompatible vectors first. Documents remain intact and can be reprocessed.

DROP INDEX IF EXISTS public.idx_chunks_embedding;

-- Remove old vectors before changing the column dimension.
-- document_chunks are derived data; the source documents remain untouched.
DELETE FROM public.document_chunks;

ALTER TABLE public.document_chunks
    ALTER COLUMN embedding TYPE vector(768);

-- A changed vector argument type requires dropping the old function overload.
DROP FUNCTION IF EXISTS public.match_document_chunks(UUID, vector(1536), FLOAT, INT);
DROP FUNCTION IF EXISTS public.match_document_chunks(UUID, vector(768), FLOAT, INT);

CREATE OR REPLACE FUNCTION public.match_document_chunks(
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

CREATE INDEX idx_chunks_embedding
    ON public.document_chunks
    USING hnsw (embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

COMMENT ON COLUMN public.document_chunks.embedding IS
    '768-dim vector from Gemini Embedding 2 for RAG';
