# AI StudyMate P0 End-to-End Verification Checklist

Use this checklist for final demo verification. All items must pass before submission.

## Pre-requisites

- [ ] Supabase cloud project created, migrations applied, pgvector enabled
- [ ] Backend deployed with correct env vars (`SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`)
- [ ] Frontend deployed with correct env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`)
- [ ] OAuth provider(s) configured in Supabase Auth

---

## Flow 1: Authentication (Social Login)

- [ ] **F1.1** Open `/` → redirected to `/login`
- [ ] **F1.2** Click "Continue with Google" → redirected to Google OAuth consent
- [ ] **F1.3** Complete Google sign-in → redirected to `/dashboard`
- [ ] **F1.4** User sees their display name/greeting on dashboard
- [ ] **F1.5** Logout → redirected to `/login`
- [ ] **F1.6** After logout, direct navigation to `/dashboard` → redirected to `/login`

**API check:**
```bash
curl -i http://<backend>/api/documents  # expect 401 without auth
```

---

## Flow 2: Document Upload and Processing

- [ ] **F2.1** Navigate to `/documents`
- [ ] **F2.2** Upload a small PDF (<10 pages, <10MB)
- [ ] **F2.3** Document appears in list with `queued` or `processing` status
- [ ] **F2.4** Status transitions to `ready` within 2 minutes
- [ ] **F2.5** Page count appears for processed document
- [ ] **F2.6** Attempt to upload a non-PDF file → validation error, no document created

**API check:**
```bash
curl -s -H 'Authorization: Bearer <token>' http://<backend>/api/documents | jq .
```

---

## Flow 3: RAG Tutor Chat

- [ ] **F3.1** Navigate to `/tutor`
- [ ] **F3.2** Ask a question whose answer is in the uploaded PDF
- [ ] **F3.3** Response includes citations (document name, page/excerpt)
- [ ] **F3.4** Ask a question unrelated to uploaded materials
- [ ] **F3.5** Response explicitly states insufficient context (no fabricated answer)
- [ ] **F3.6** Continue conversation → assistant references prior messages where relevant
- [ ] **F3.7** AI provider failure shows clear error with retry button

**API check:**
```bash
curl -s -H 'Authorization: Bearer <token>' \
  -X POST http://<backend>/api/tutor/chats \
  -H 'Content-Type: application/json' \
  -d '{"content": "test question"}'
```

---

## Flow 4: Quiz Generation and Evaluation

- [ ] **F4.1** Navigate to `/quiz`
- [ ] **F4.2** Select topic, difficulty, question count → generate
- [ ] **F4.3** Quiz generates within 2 minutes with correct question count
- [ ] **F4.4** Answer all questions → submit
- [ ] **F4.5** Score is computed and displayed correctly
- [ ] **F4.6** Results show weak topics, strong topics, and recommendations

**API check:**
```bash
curl -s -H 'Authorization: Bearer <token>' \
  -X POST http://<backend>/api/quiz/generate \
  -H 'Content-Type: application/json' \
  -d '{"topic": "Test", "difficulty": "easy", "question_count": 3}'
```

---

## Flow 5: Admin Health (Authenticated)

- [ ] **F5.1** Navigate to `/admin` (requires auth)
- [ ] **F5.2** Page shows total users, documents, chats, quizzes
- [ ] **F5.3** System status shows "ok" or "unavailable" gracefully

**API check:**
```bash
# Without auth → expect 401
curl -i http://<backend>/api/admin/health
# With auth → expect 200 with data
curl -s -H 'Authorization: Bearer <token>' http://<backend>/api/admin/health | jq .
```

---

## Non-Functional Checks

- [ ] **NF-1** Mobile view: all pages responsive at 375px width
- [ ] **NF-2** Keyboard navigation: tab through interactive elements on auth/dashboard/doc/tutor/quiz pages
- [ ] **NF-3** Loading states visible during PDF processing, quiz generation, tutor response
- [ ] **NF-4** No secrets exposed in frontend source/bundles
- [ ] **NF-5** Server-side auth enforced on all `/api/*` endpoints (try unauthenticated requests)

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Reviewer | | | |
| Demo Lead | | | |

**All checks passed:** ☐ Yes ☐ No

**Remaining blockers:** (list any failing items)
