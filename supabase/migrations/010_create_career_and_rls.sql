-- Career recommendations table
CREATE TABLE IF NOT EXISTS public.career_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recommended_roles JSONB NOT NULL,
    skill_gaps JSONB NOT NULL,
    recommended_skills JSONB NOT NULL,
    learning_paths JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.career_recommendations IS 'AI-generated career guidance for users';

ALTER TABLE public.career_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own career recommendations" ON public.career_recommendations
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own career recommendations" ON public.career_recommendations
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_career_recommendations_owner_id ON public.career_recommendations(owner_id);
