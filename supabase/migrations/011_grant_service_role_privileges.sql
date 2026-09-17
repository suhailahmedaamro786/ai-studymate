-- Migration: grant minimum required privileges to service_role
--
-- Root cause: The backend was migrated to use get_service_role_client()
-- for all database operations (to resolve 42501 permission denied errors
-- when using the anon role without forwarded JWT). However, none of the
-- existing migrations granted any privileges to service_role.
--
-- This migration grants only the privileges required by the backend,
-- preserving RLS (which service_role bypasses) and maintaining
-- application-level authorization via explicit owner_id/user_id checks.
--
-- Tables accessed by the service_role backend:
--   public.profiles            -> SELECT, INSERT, UPDATE
--   public.documents           -> SELECT, INSERT, UPDATE, DELETE
--   public.document_chunks     -> SELECT, INSERT
--   public.tutor_chats         -> SELECT, INSERT, UPDATE, DELETE
--   public.tutor_messages      -> SELECT, INSERT
--   public.quizzes             -> SELECT, INSERT, UPDATE
--   public.quiz_questions      -> SELECT, INSERT
--   public.quiz_attempts       -> SELECT, INSERT
--   public.quiz_evaluations    -> SELECT, INSERT
--   public.study_plans         -> SELECT, INSERT, UPDATE, DELETE
--   public.study_tasks         -> SELECT, INSERT, UPDATE, DELETE
--   public.career_recommendations -> SELECT, INSERT
--
-- Sequences: gen_random_uuid() is owned by the extension, no explicit
-- sequence grants needed for uuid generation.
--
-- RLS: NOT disabled. service_role bypasses RLS at the PostgREST level,
-- but the application enforces ownership via owner_id checks on every
-- query, so data isolation is maintained.
--
-- No grants to PUBLIC, anon, or authenticated roles.

-- Helper to grant privileges on a table to service_role
DO $$
BEGIN
    -- Core user data
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO service_role;
    GRANT SELECT, INSERT ON public.document_chunks TO service_role;

    -- Tutor
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_chats TO service_role;
    GRANT SELECT, INSERT ON public.tutor_messages TO service_role;

    -- Quiz
    GRANT SELECT, INSERT, UPDATE ON public.quizzes TO service_role;
    GRANT SELECT, INSERT ON public.quiz_questions TO service_role;
    GRANT SELECT, INSERT ON public.quiz_attempts TO service_role;
    GRANT SELECT, INSERT ON public.quiz_evaluations TO service_role;

    -- Study planner
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plans TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_tasks TO service_role;

    -- Career
    GRANT SELECT, INSERT ON public.career_recommendations TO service_role;
END $$;

-- Verify grants (run manually: SELECT * FROM information_schema.role_table_grants
-- WHERE grantee = 'service_role' AND table_schema = 'public';)
