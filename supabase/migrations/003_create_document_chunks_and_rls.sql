-- Document chunks table
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding extensions.vector(1536),
    page_number INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.document_chunks IS 'Text chunks from processed documents with embeddings for RAG';
COMMENT ON COLUMN public.document_chunks.owner_id IS 'Denormalized owner_id for RLS without joins';

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chunks" ON public.document_chunks
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own chunks" ON public.document_chunks
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX idx_chunks_owner_id ON public.document_chunks(owner_id);
