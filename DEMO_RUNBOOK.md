# AI StudyMate — Demo Runbook

## Prerequisites

- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- Supabase project configured with migrations applied
- `documents` storage bucket created

## Demo Flow (5–7 minutes)

### 1. Signup / Login (30s)
- Open `http://localhost:3000`
- Click **Sign up**, enter email + password + name
- Or click **Log in** if account exists
- Redirect to `/dashboard`

### 2. Dashboard (15s)
- Show greeting with user name
- Show stats cards: Documents, Chats, Quizzes
- Show quick-access cards: Study Materials, AI Tutor, Quizzes

### 3. Upload PDF (30s)
- Navigate to **Documents**
- Upload a small PDF (< 10MB)
- Show "Uploading..." then document appears with status badge
- Refresh until status becomes **ready**

### 4. Document Processing (10s)
- Explain: backend extracts text, chunks, embeds, stores in pgvector
- Status transitions: queued → processing → ready

### 5. Ask Tutor Question (45s)
- Navigate to **Tutor**
- Create a new chat if needed
- Ask a question about the uploaded PDF content
- Show grounded answer with citation card displaying **real PDF filename**

### 6. Insufficient Context Fallback (15s)
- Ask an unrelated question
- Show "Insufficient context" message with orange badge

### 7. Generate Quiz (30s)
- Navigate to **Quiz**
- Enter topic, select difficulty, set question count
- Click **Generate Quiz**
- Show MCQ questions rendered

### 8. Submit Quiz + Evaluation (30s)
- Answer all questions
- Click **Submit Answers**
- Show score percentage, weak/strong topics, recommendations

### 9. Second Quiz Attempt (15s)
- Click **New Quiz**
- Generate same quiz again
- Submit different answers
- Show second evaluation (demonstrates re-attempt works)

### 10. Study Planner (30s)
- Navigate to **Planner**
- Enter study goal, hours/day, deadline
- Click **Generate Plan**
- Show AI-generated tasks with dates
- Toggle a task to **Complete**

### 11. Career Assistant (30s)
- Navigate to **Career**
- Click **Analyze My Career Path**
- Show recommended roles, skill gaps, recommended skills, learning paths

### 12. Analytics (15s)
- Navigate to **Analytics**
- Show quiz history, average score, recent activity

## Talking Points

- **Security**: All data is user-scoped with RLS. Service-role key never exposed to frontend.
- **RAG**: pgvector HNSW index for fast similarity search. Citations show source document.
- **Multi-LLM**: Supports OpenAI, Groq, Gemini with fallback.
- **Async Processing**: PDF upload returns immediately; background task processes file.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Upload stuck on "queued" | Check backend logs for processing errors |
| Citations show "unknown" | Ensure `documents` bucket exists and file was uploaded |
| Tutor says "insufficient context" | Upload relevant PDF first, then ask content-specific question |
| 401 on API calls | Re-login to refresh JWT token |
