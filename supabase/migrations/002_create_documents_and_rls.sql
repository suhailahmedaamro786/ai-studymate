-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
    page_count INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.documents IS 'User-uploaded PDF documents';
COMMENT ON COLUMN public.documents.owner_id IS 'Owner user ID for RLS';

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (owner_id = auth.uid());

CREATE INDEX idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX idx_documents_status ON public.documents(status);
