-- HNSW index for vector similarity search on document_chunks
-- Builds after data is present; adjust HNSW parameters for scale
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON public.document_chunks
    USING hnsw (embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
