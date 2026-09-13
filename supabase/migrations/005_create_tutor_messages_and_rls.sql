-- Tutor messages table
CREATE TABLE IF NOT EXISTS public.tutor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.tutor_chats(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    is_grounded BOOLEAN NOT NULL DEFAULT false,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tutor_messages IS 'Messages within tutor chat sessions';

ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.tutor_messages
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own messages" ON public.tutor_messages
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_tutor_messages_chat_id ON public.tutor_messages(chat_id);
CREATE INDEX idx_tutor_messages_owner_id ON public.tutor_messages(owner_id);
