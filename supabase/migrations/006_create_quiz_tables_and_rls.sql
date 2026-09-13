-- Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_count INTEGER NOT NULL CHECK (question_count BETWEEN 1 AND 20),
    status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.quizzes IS 'Quiz configurations and generation status';

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quizzes" ON public.quizzes
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own quizzes" ON public.quizzes
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own quizzes" ON public.quizzes
    FOR UPDATE USING (owner_id = auth.uid());

CREATE INDEX idx_quizzes_owner_id ON public.quizzes(owner_id);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    topic_tag TEXT,
    order_index INTEGER NOT NULL
);

COMMENT ON TABLE public.quiz_questions IS 'Questions within a quiz';

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz questions" ON public.quiz_questions
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own quiz questions" ON public.quiz_questions
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_owner_id ON public.quiz_questions(owner_id);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    total_correct INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.quiz_attempts IS 'User quiz submission attempts';

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON public.quiz_attempts
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_owner_id ON public.quiz_attempts(owner_id);

-- Quiz evaluations table
CREATE TABLE IF NOT EXISTS public.quiz_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL UNIQUE REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weak_topics JSONB NOT NULL,
    strong_topics JSONB NOT NULL,
    recommendations JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.quiz_evaluations IS 'AI-generated evaluation of quiz attempts';

ALTER TABLE public.quiz_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evaluations" ON public.quiz_evaluations
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own evaluations" ON public.quiz_evaluations
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_quiz_evaluations_attempt_id ON public.quiz_evaluations(attempt_id);
CREATE INDEX idx_quiz_evaluations_owner_id ON public.quiz_evaluations(owner_id);
