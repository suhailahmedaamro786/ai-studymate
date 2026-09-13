-- pgvector similarity search function for RAG retrieval
-- Used by tutor/retrieval.py for document chunk search

CREATE OR REPLACE FUNCTION match_document_chunks(
    p_owner_id UUID,
    p_query_embedding extensions.vector(1536),
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
