---

# Tasks: AI StudyMate MVP (User Auth + P0)

**Input**: Design documents from `/specs/001-user-auth/`

**Prerequisites**: plan.md (optional in this repo snapshot), spec.md, checklists/requirements.md

## Format
- Tasks are grouped by user story and ordered by dependency.
- Every task follows: `- [ ] T### [P?] [US?] Description with file path`.

## User Stories
- **[US1]** Sign up/login/logout + protected dashboard
- **[US2]** Upload PDF + document list/status/delete
- **[US3]** RAG tutor chat with citations + graceful insufficient-context fallback
- **[US4]** Quiz generation + submission/score + evaluation (weak/strong/recommendations)

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Setup repo scaffolding for modular monolith (create `apps/`, `apps/web/`, `apps/api/`, `supabase/`) at `apps/`
- [ ] T002 Create frontend workspace with Next.js + Tailwind + shadcn/ui at `apps/web/`
- [ ] T003 Create backend workspace with FastAPI + Pydantic at `apps/api/`
- [ ] T004 Add shared types package or folder for API contracts at `apps/shared/` (minimal) 
- [ ] T005 Add root README sections for local dev + environment variables at `README.md`
- [ ] T006 [P] Add basic lint/format scripts (no new CI) at `package.json` and `pyproject.toml`

**Acceptance criteria (Phase 1 Done):**
- Project builds locally for frontend and backend skeletons (even if endpoints are stubbed).
- Environment variable files are documented.

**Verification commands (placeholder until code exists):**
- Frontend: `cd apps/web && npm run dev`
- Backend: `cd apps/api && python -m uvicorn app.main:app --reload`

---

## Phase 2: Foundational (Blocking prerequisites)

- [ ] T007 Create Supabase project placeholders + local setup docs at `supabase/README.md`
- [ ] T008 [P] Define database migration skeletons + create RLS strategy docs at `supabase/migrations/README.md`
- [ ] T009 Define API error response model contract at `apps/shared/errors.ts` and `apps/api/app/schemas/errors.py`
- [ ] T010 Define auth/session verification contract for backend at `apps/api/app/middleware/auth.py`
- [ ] T010a [P] Create backend service-role Supabase client (server-only) at `apps/api/app/core/supabase.py` for admin endpoints and document processing; ensure `SUPABASE_SERVICE_ROLE_KEY` is loaded from server-side env only and never exposed to frontend
- [ ] T011 [P] Create backend base router structure for P0 endpoints at `apps/api/app/api/routes/`
- [ ] T012 [P] Create frontend base UI shell (layout + navigation) at `apps/web/app/layout.tsx` and `apps/web/components/`

**Acceptance criteria (Phase 2 Done):**
- Backend has a single health endpoint that requires no auth.
- There is a consistent error shape and a consistent auth dependency hook.

**Verification commands:**
- `curl -s http://localhost:8000/health | jq .`

---

## Phase 3: [US1] Auth + Protected Dashboard (P0)

- [ ] T013 [US1] Implement Supabase Auth client integration for signup/login/logout in frontend at `apps/web/lib/auth.ts`
- [ ] T013a [US1] After successful signup, upsert profile row via `PUT /api/profiles/me` with display_name; after login, fetch profile via `GET /api/profiles/me` at `apps/web/app/(auth)/signup/page.tsx` and `apps/web/app/(auth)/login/page.tsx`
- [ ] T014 [US1] Implement protected route guard in frontend at `apps/web/middleware.ts` (or equivalent)
- [ ] T015 [US1] Create Signup UI with loading/error states at `apps/web/app/(auth)/signup/page.tsx`
- [ ] T016 [US1] Create Login UI with loading/error states at `apps/web/app/(auth)/login/page.tsx`
- [ ] T017 [US1] Implement Logout action/button at `apps/web/app/(app)/dashboard/components/LogoutButton.tsx`

- [ ] T018 [US1] Implement backend auth middleware/JWT verification extracting current user id at `apps/api/app/middleware/auth.py`
- [ ] T019 [US1] Implement backend dependency `get_current_user()` at `apps/api/app/api/deps.py`
- [ ] T020 [P] Add backend auth-protected route example for P0 dashboard at `apps/api/app/api/routes/auth_guard_test.py` (or embed in dashboard route)

- [ ] T021 [US1] Create dashboard page that shows basic sections and user greeting at `apps/web/app/(app)/dashboard/page.tsx`
- [ ] T022 [US1] Add a “session expired” UI fallback path (clear user data + redirect) at `apps/web/components/SessionExpired.tsx`

### Backend DB/RLS for US1
- [ ] T023 Create `profiles` table (owner id = auth user id) with RLS and ownership at `supabase/migrations/001_create_profiles_and_rls.sql`
- [ ] T024 [P] Implement profile upsert logic endpoint contract (minimal) at `apps/api/app/api/routes/profiles.py`

**Acceptance criteria (US1 Done):**
1. Unauthenticated user cannot access dashboard route (redirect or access denied).
2. Signed-up user can log in and see dashboard.
3. Logout terminates session and dashboard access is blocked.

**Verification commands:**
- Manual: signup → login → dashboard visible
- API: `curl -i http://localhost:8000/api/dashboard` (expect 401 without token)

---

## Phase 4: [US2] Document Management (Upload + List + Status + Delete) (P0)

### Supabase Storage + DB tables
- [ ] T025 [US2] Create Supabase storage bucket policy + permissions plan in `supabase/README.md`
- [ ] T026 Create `documents` table with owner_id, status lifecycle, timestamps, and RLS at `supabase/migrations/002_create_documents_and_rls.sql`
- [ ] T027 Create `document_chunks` table with owner_id and RLS at `supabase/migrations/003_create_document_chunks_and_rls.sql`

### Backend endpoints
- [ ] T028 [US2] Implement “create document record” endpoint (upload initiation) at `apps/api/app/api/routes/documents.py` (`POST /documents/upload`)
- [ ] T029 [US2] Implement “list documents with status” endpoint at `apps/api/app/api/routes/documents.py` (`GET /documents`)
- [ ] T030 [US2] Implement “delete document” endpoint (and cascade chunk cleanup) at `apps/api/app/api/routes/documents.py` (`DELETE /documents/{id}`)
- [ ] T031 [P] Implement document status update endpoint internal helper at `apps/api/app/domain/documents/status.py`

### Document upload flow (frontend)
- [ ] T032 [US2] Build documents UI list with processing status and delete buttons at `apps/web/app/(app)/documents/page.tsx`
- [ ] T033 [US2] Implement upload UI with validation (PDF only) + clear loading/error states at `apps/web/app/(app)/documents/components/UploadDocumentForm.tsx`
- [ ] T034 [US2] Wire frontend to backend endpoints and update UI status via polling or refresh at `apps/web/lib/api.ts`

### Document processing MVP (minimal)
- [ ] T035 [US2] Implement PDF ingestion stub for demo (extract text, split into chunks, store chunks) at `apps/api/app/domain/documents/processing.py`
- [ ] T036 [US2] Implement status transition logic queued → processing → ready/failed at `apps/api/app/domain/documents/processing.py`

**Acceptance criteria (US2 Done):**
1. User can upload a PDF.
2. Document appears in list with a progressing status and transitions to ready.
3. User can delete the document; it disappears from list and cannot be used for tutor.

**Verification commands:**
- Manual: upload PDF → refresh documents list until ready
- API: `curl -s -H 'Authorization: Bearer <token>' http://localhost:8000/documents | jq .`

---

## Phase 5: [US3] AI Tutor (RAG chat with citations + fallback) (P0)

- [ ] T037 [US3] Create `tutor_chats` table + RLS (owner_id) at `supabase/migrations/004_create_tutor_tables_and_rls.sql`
- [ ] T038 Create `tutor_messages` table at `supabase/migrations/005_create_tutor_messages_and_rls.sql`

### Backend RAG + tutor
- [ ] T039 [US3] Implement chat initiation/listing contract (minimal: store chat id) at `apps/api/app/api/routes/tutor.py`
- [ ] T040 [US3] Implement RAG retrieval over document_chunks scoped by owner_id at `apps/api/app/domain/tutor/retrieval.py`
- [ ] T041 [US3] Implement grounding gate and “insufficient context” fallback policy at `apps/api/app/domain/tutor/grounding.py`
- [ ] T042 [US3] Implement tutor chat endpoint returning answer + grounded flag + citations or fallback reason at `apps/api/app/api/routes/tutor.py` (`POST /tutor/chat`)
- [ ] T043 [US3] Implement recording of tutor messages including grounded/citations metadata at `apps/api/app/domain/tutor/recording.py`

### AI provider/agent adapter + safety
- [ ] T044 [US3] Implement minimal AI provider adapter interface with timeout + retry hooks at `apps/api/app/domain/tutor/ai_adapter.py`
- [ ] T045 [US3] Implement strict output shaping for tutor responses (answer text + citations) at `apps/api/app/domain/tutor/response_schema.py`

### Frontend tutor chat
- [ ] T046 [US3] Build tutor chat UI rendering citations when grounded and fallback message otherwise at `apps/web/app/(app)/tutor/page.tsx`
- [ ] T047 [US3] Implement message send action with retry button for AI/provider failures at `apps/web/app/(app)/tutor/components/ChatComposer.tsx`
- [ ] T048 [US3] Implement chat history display at `apps/web/app/(app)/tutor/components/ChatHistory.tsx`

**Acceptance criteria (US3 Done):**
1. When question is answerable from uploaded docs, response includes citations.
2. When question is not supported, response explicitly indicates insufficient context and does not fabricate.
3. AI failures show a clear error and allow retry.

**Verification commands:**
- Manual: upload small PDF → ask known question → expect grounded/citations
- Manual: ask unrelated question → expect grounded=false + fallback
- API: `curl -s -H 'Authorization: Bearer <token>' -X POST http://localhost:8000/tutor/chat ...`

---

## Phase 6: [US4] Quiz Generation + Evaluation (weak/strong/recommendations) (P0)

- [ ] T049 Create `quizzes`, `quiz_questions`, `quiz_attempts`, `quiz_evaluations` tables with RLS at `supabase/migrations/006_create_quiz_tables_and_rls.sql`
- [ ] T050 Implement quiz configuration validation rules (topic non-empty, difficulty range, question count range) at `apps/api/app/domain/quiz/validation.py`

### Backend quiz
- [ ] T051 [US4] Implement “generate quiz” endpoint at `apps/api/app/api/routes/quiz.py` (`POST /quiz/generate`)
- [ ] T052 [US4] Implement MCQ storage or generation output persistence at `apps/api/app/domain/quiz/generation.py`
- [ ] T053 [US4] Implement “submit quiz attempt + score + evaluation” endpoint at `apps/api/app/api/routes/quiz.py` (`POST /quiz/attempt`)
- [ ] T054 [US4] Implement evaluation logic producing weak_topics, strong_topics, recommendations at `apps/api/app/domain/quiz/evaluation.py`

### AI provider adapter for quiz
- [ ] T055 [US4] Implement strict output shaping for quiz generation/evaluation at `apps/api/app/domain/quiz/response_schema.py`

### Frontend quiz + evaluation UI
- [ ] T056 [US4] Build quiz configuration form (topic/difficulty/count) at `apps/web/app/(app)/quiz/page.tsx`
- [ ] T057 [US4] Render MCQs and capture answer submissions at `apps/web/app/(app)/quiz/components/QuizAttempt.tsx`
- [ ] T058 [US4] Build results view showing score + weak/strong topics + recommendations at `apps/web/app/(app)/quiz/components/QuizResults.tsx`

**Acceptance criteria (US4 Done):**
1. User can generate a quiz with selected settings.
2. User submits answers; system computes score.
3. System returns evaluation with weak/strong topics + recommendations.

**Verification commands:**
- Manual: generate quiz → submit → results appear
- API: `curl -s -H 'Authorization: Bearer <token>' -X POST http://localhost:8000/quiz/generate ...`

---

## Phase 7: Polish & Cross-Cutting (P0)

- [ ] T059 Implement global error boundary + user-friendly messages at `apps/web/app/error.tsx`
- [ ] T060 Implement consistent loading states for tutor/quiz/doc upload at `apps/web/components/LoadingStates.tsx`
- [ ] T061 Security: enforce server-side auth checks on all student endpoints (review checklist) at `apps/api/app/api/routes/*`
- [ ] T062 Security: add request size/file size limits for uploads at `apps/api/app/api/routes/documents.py`
- [ ] T063 Security: add audit logging for auth failures + AI provider failures at `apps/api/app/core/logging.py`
- [ ] T064 Observability: add structured logging request/user ids at `apps/api/app/core/logging.py`
- [ ] T065 Accessibility: verify ARIA labels/keyboard nav for interactive widgets at `apps/web/components/*`

### Admin/demo view (lightweight totals + system health)
- [ ] T066 [US1] Create admin health totals endpoint at `apps/api/app/api/routes/admin.py` (`GET /admin/health`)
- [ ] T067 [US1] Create admin/demo page rendering totals + health at `apps/web/app/(app)/admin/page.tsx`

**Acceptance criteria (Phase 7 Done):**
- End-to-end P0 walkthrough works (auth → upload → tutor → quiz → evaluation → admin totals).
- Error/fallback states are visible and actionable.

**Verification commands:**
- Manual walkthrough + screenshots
- API: `curl -s http://localhost:8000/admin/health | jq .`

---

## Phase 8: P1 Work (deferred; not required for P0 MVP)

- [ ] T068 [P1] Add study planner UI and backend endpoints (defer until P0 complete) at `apps/web/app/(app)/planner/page.tsx` and `apps/api/app/api/routes/planner.py`
- [ ] T069 [P1] Add career assistant endpoints + UI at `apps/web/app/(app)/career/page.tsx` and `apps/api/app/api/routes/career.py`
- [ ] T070 [P1] Add progress analytics (weak topics trends) at `apps/web/app/(app)/analytics/page.tsx` and `apps/api/app/api/routes/analytics.py`

**Acceptance criteria:**
- Not started until Checkpoint 3 is green.

---

## Phase 9: P2 Work (deferred)

- [ ] T071 [P2] Advanced personalization at `apps/web/app/(app)/personalize/page.tsx` (defer)
- [ ] T072 [P2] Admin analytics expansion (defer)
- [ ] T073 [P2] Additional integrations (defer)
