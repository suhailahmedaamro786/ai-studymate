-- Tutor chats table
CREATE TABLE IF NOT EXISTS public.tutor_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tutor_chats IS 'Tutor conversation sessions';

ALTER TABLE public.tutor_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats" ON public.tutor_chats
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own chats" ON public.tutor_chats
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own chats" ON public.tutor_chats
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own chats" ON public.tutor_chats
    FOR DELETE USING (owner_id = auth.uid());

CREATE INDEX idx_tutor_chats_owner_id ON public.tutor_chats(owner_id);
