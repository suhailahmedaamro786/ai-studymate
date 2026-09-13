-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    education_level TEXT,
    subjects TEXT[] NOT NULL DEFAULT '{}',
    goals TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profile data linked 1:1 to auth.users';
COMMENT ON COLUMN public.profiles.user_id IS 'References auth.users, unique per user';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own profile" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
