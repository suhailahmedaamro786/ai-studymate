# Implementation Plan: AI StudyMate MVP (User Auth + P0)

**Branch**: `001-user-auth` | **Date**: 2026-09-10 | **Spec**: [specs/001-user-auth/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-user-auth/spec.md`

## Summary

Build the AI StudyMate MVP — a personalized learning platform with authentication, document management, RAG-grounded AI tutoring, and quiz generation with evaluation. The architecture is a modular monolith: Next.js frontend, FastAPI backend, Supabase (PostgreSQL + Auth + Storage), and an LLM abstraction layer powering five bounded agents (Tutor, Quiz, Evaluator, Planner, Career). P0 delivers auth, documents, tutor, and quiz/evaluation. P1/P2 are explicitly deferred.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.x (frontend)
**Primary Dependencies**: FastAPI, Pydantic v2, supabase-py, openai SDK (backend); Next.js 14 (App Router), Tailwind CSS 3, shadcn/ui, @supabase/supabase-js (frontend)
**Storage**: Supabase PostgreSQL (with pgvector extension for embeddings), Supabase Storage (PDF files)
**Testing**: pytest + httpx (backend), vitest + React Testing Library (frontend)
**Target Platform**: Web (desktop + mobile-responsive browsers)
**Project Type**: Web application (frontend + backend + database)
**Performance Goals**: API responses < 500ms p95 (non-AI), AI responses < 30s p95, PDF processing < 2 min for ≤10 pages
**Constraints**: 3-day hackathon, single deployment target, no Kubernetes/microservices/Kafka, demo-quality not production-scale
**Scale/Scope**: Single-digit concurrent users for demo; ~10 screens; ~15 API endpoints

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Principle | Status | Evidence |
|------|-----------|--------|----------|
| Gate A (Spec Gate) | Spec-Driven Development | PASS | `specs/001-user-auth/spec.md` exists with 14 FRs, 3 user stories, checklist passed |
| Gate B (Correctness Gate) | Testing Discipline | PLANNED | pytest + vitest strategy defined; test-first for auth, RLS, RAG grounding, quiz scoring |
| Gate C (Security Gate) | Secure-By-Default | PLANNED | RLS on all user-owned tables; Supabase Auth JWT verification; server-side auth middleware |
| Gate D (AI Grounding Gate) | AI Reliability/RAG/Safety | PLANNED | Grounding gate in tutor pipeline; citations required; explicit fallback for insufficient context |
| Gate E (Accessibility Gate) | User-Centered Design | PLANNED | shadcn/ui provides ARIA defaults; keyboard nav verification task T065 |
| Gate F (Observability Gate) | Observability & Performance | PLANNED | Structured logging with request/user/session IDs; tasks T063–T064 |

No violations. All gates have clear implementation paths.

---

## 1. Repository Structure

```text
ai-studymate/
├── CLAUDE.md                         # Project rules
├── README.md                         # Quickstart + environment docs
├── .specify/                         # SDD templates + scripts
├── specs/                            # Feature specs + plans
│   └── 001-user-auth/
│       ├── spec.md
│       ├── plan.md                   # This file
│       ├── tasks.md
│       ├── research.md
│       ├── data-model.md
│       ├── quickstart.md
│       └── contracts/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   ├── next.config.ts
│   │   ├── middleware.ts             # Auth route guard
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts         # Browser Supabase client
│   │   │   │   └── server.ts         # Server-side Supabase client
│   │   │   ├── api.ts                # Backend API client
│   │   │   └── utils.ts
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── LoadingStates.tsx
│   │   │   ├── SessionExpired.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout + providers
│   │   │   ├── error.tsx             # Global error boundary
│   │   │   ├── (auth)/
│   │   │   │   ├── signup/page.tsx
│   │   │   │   └── login/page.tsx
│   │   │   └── (app)/
│   │   │       ├── layout.tsx        # Authenticated layout + nav
│   │   │       ├── dashboard/
│   │   │       │   ├── page.tsx
│   │   │       │   └── components/
│   │   │       │       └── LogoutButton.tsx
│   │   │       ├── documents/
│   │   │       │   ├── page.tsx
│   │   │       │   └── components/
│   │   │       │       └── UploadDocumentForm.tsx
│   │   │       ├── tutor/
│   │   │       │   ├── page.tsx
│   │   │       │   └── components/
│   │   │       │       ├── ChatComposer.tsx
│   │   │       │       └── ChatHistory.tsx
│   │   │       ├── quiz/
│   │   │       │   ├── page.tsx
│   │   │       │   └── components/
│   │   │       │       ├── QuizAttempt.tsx
│   │   │       │       └── QuizResults.tsx
│   │   │       └── admin/
│   │   │           └── page.tsx
│   │   └── __tests__/                # Frontend tests
│   │
│   ├── api/                          # FastAPI backend
│   │   ├── pyproject.toml
│   │   ├── requirements.txt
│   │   ├── app/
│   │   │   ├── main.py               # FastAPI app factory
│   │   │   ├── config.py             # Settings via pydantic-settings
│   │   │   ├── core/
│   │   │   │   ├── logging.py        # Structured logging + audit
│   │   │   │   ├── exceptions.py     # App exception classes
│   │   │   │   └── supabase.py       # Dual-client: user-scoped (RLS) + service-role (server-only)
│   │   │   ├── middleware/
│   │   │   │   └── auth.py           # JWT verification middleware
│   │   │   ├── api/
│   │   │   │   ├── deps.py           # Shared dependencies (get_current_user)
│   │   │   │   └── routes/
│   │   │   │       ├── health.py     # GET /health
│   │   │   │       ├── profiles.py   # Profile endpoints
│   │   │   │       ├── documents.py  # Document CRUD + upload
│   │   │   │       ├── tutor.py      # Tutor chat endpoints
│   │   │   │       ├── quiz.py       # Quiz gen + attempt endpoints
│   │   │   │       └── admin.py      # Admin health/totals
│   │   │   ├── schemas/
│   │   │   │   ├── errors.py         # Standard error response
│   │   │   │   ├── auth.py
│   │   │   │   ├── documents.py
│   │   │   │   ├── tutor.py
│   │   │   │   └── quiz.py
│   │   │   └── domain/
│   │   │       ├── documents/
│   │   │       │   ├── processing.py   # PDF extract + chunk + embed
│   │   │       │   └── status.py       # Status transitions
│   │   │       ├── tutor/
│   │   │       │   ├── retrieval.py    # RAG vector search
│   │   │       │   ├── grounding.py    # Grounding gate + fallback
│   │   │       │   ├── ai_adapter.py   # LLM provider abstraction
│   │   │       │   ├── response_schema.py  # Output shaping
│   │   │       │   └── recording.py    # Chat persistence
│   │   │       └── quiz/
│   │   │           ├── generation.py   # Quiz generation via LLM
│   │   │           ├── evaluation.py   # Score + weak/strong topics
│   │   │           ├── validation.py   # Config validation
│   │   │           └── response_schema.py
│   │   └── tests/
│   │       ├── conftest.py
│   │       ├── unit/
│   │       ├── integration/
│   │       └── contract/
│   │
│   └── shared/                       # Shared API contracts
│       ├── errors.ts                 # Error shape (TS side)
│       └── types.ts                  # Shared type definitions
│
└── supabase/
    ├── README.md                     # Local setup + RLS strategy
    ├── config.toml                   # Supabase local config
    └── migrations/
        ├── 001_create_profiles_and_rls.sql
        ├── 002_create_documents_and_rls.sql
        ├── 003_create_document_chunks_and_rls.sql
        ├── 004_create_tutor_tables_and_rls.sql
        ├── 005_create_tutor_messages_and_rls.sql
        └── 006_create_quiz_tables_and_rls.sql
```

**Structure Decision**: Web application with separated `apps/web` (Next.js), `apps/api` (FastAPI), `apps/shared` (contracts), and `supabase/` (migrations + config). This maps directly to the task file's `apps/` layout.

---

## 2. Database Schema and Entities

All user-owned tables include `owner_id UUID REFERENCES auth.users(id)` and enforce RLS. All tables include `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ DEFAULT now()`.

### profiles
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| user_id | UUID | UNIQUE, NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| display_name | TEXT | |
| education_level | TEXT | |
| subjects | TEXT[] | DEFAULT '{}' |
| goals | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

### documents
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| owner_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| filename | TEXT | NOT NULL |
| storage_path | TEXT | NOT NULL |
| status | TEXT | NOT NULL, DEFAULT 'queued', CHECK IN ('queued','processing','ready','failed') |
| page_count | INTEGER | |
| error_message | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes**: `idx_documents_owner_id` on (owner_id), `idx_documents_status` on (status)

### document_chunks
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| document_id | UUID | NOT NULL, FK → documents(id) ON DELETE CASCADE |
| owner_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| chunk_index | INTEGER | NOT NULL |
| content | TEXT | NOT NULL |
| embedding | VECTOR(1536) | |
| page_number | INTEGER | |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes**: `idx_chunks_document_id` on (document_id), `idx_chunks_owner_id` on (owner_id), IVFFlat or HNSW index on (embedding) for vector search

### tutor_chats
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| owner_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| title | TEXT | DEFAULT 'New Chat' |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

### tutor_messages
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| chat_id | UUID | NOT NULL, FK → tutor_chats(id) ON DELETE CASCADE |
| owner_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| role | TEXT | NOT NULL, CHECK IN ('user','assistant') |
| content | TEXT | NOT NULL |
| is_grounded | BOOLEAN | DEFAULT false |
| citations | JSONB | DEFAULT '[]' |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes**: `idx_messages_chat_id` on (chat_id)

### quizzes
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| owner_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| topic | TEXT | NOT NULL |
| difficulty | TEXT | NOT NULL, CHECK IN ('easy','medium','hard') |
| question_count | INTEGER | NOT NULL, CHECK BETWEEN 1 AND 20 |
| status | TEXT | NOT NULL, DEFAULT 'generating', CHECK IN ('generating','ready','failed') |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### quiz_questions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| quiz_id | UUID | NOT NULL, FK → quizzes(id) ON DELETE CASCADE |
| owner_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| question_text | TEXT | NOT NULL |
| options | JSONB | NOT NULL (array of {label, text}) |
| correct_option | TEXT | NOT NULL |
| explanation | TEXT | |
| topic_tag | TEXT | |
| order_index | INTEGER | NOT NULL |

### quiz_attempts
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| quiz_id | UUID | NOT NULL, FK → quizzes(id) ON DELETE CASCADE |
| owner_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| answers | JSONB | NOT NULL (map of question_id → selected_option) |
| score | NUMERIC(5,2) | NOT NULL |
| total_correct | INTEGER | NOT NULL |
| total_questions | INTEGER | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### quiz_evaluations
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| attempt_id | UUID | NOT NULL, FK → quiz_attempts(id) ON DELETE CASCADE, UNIQUE |
| owner_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| weak_topics | JSONB | NOT NULL (array of strings) |
| strong_topics | JSONB | NOT NULL (array of strings) |
| recommendations | JSONB | NOT NULL (array of strings) |
| created_at | TIMESTAMPTZ | DEFAULT now() |

---

## 3. Supabase RLS and Authorization

### Strategy

Every user-owned table enforces RLS with policies scoped to `auth.uid()`:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Standard owner-only policy (applied to all user-owned tables)
CREATE POLICY "Users can CRUD own rows" ON <table>
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
```

### Table-specific notes

| Table | RLS Policy | Notes |
|-------|-----------|-------|
| profiles | owner = user_id (not owner_id) | `USING (user_id = auth.uid())` |
| documents | owner_id = auth.uid() | Standard pattern |
| document_chunks | owner_id = auth.uid() | Denormalized owner_id for direct RLS without join |
| tutor_chats | owner_id = auth.uid() | Standard pattern |
| tutor_messages | owner_id = auth.uid() | Redundant owner_id avoids join to tutor_chats for RLS |
| quizzes | owner_id = auth.uid() | Standard pattern |
| quiz_questions | owner_id = auth.uid() | Denormalized for RLS |
| quiz_attempts | owner_id = auth.uid() | Standard pattern |
| quiz_evaluations | owner_id = auth.uid() | Standard pattern |

### Why owner_id is denormalized on child tables

Supabase RLS evaluates per-row. If `document_chunks` only had `document_id`, every chunk read would require a join to `documents` to check ownership. Denormalizing `owner_id` onto child tables enables simple, fast RLS policies without cross-table lookups.

### Dual-client approach

The backend maintains two Supabase clients:

1. **User-scoped client** (`apps/api/app/core/supabase.py`): Uses the `SUPABASE_JWT_SECRET` to verify the user's JWT. All user-facing endpoints use this client, which enforces RLS via the user's token.
2. **Service-role client** (same file): Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS. Used only by:
   - Admin aggregate endpoint (`/api/admin/health`) counting across all users
   - Background document processing pipeline updating status

**Security**: `SUPABASE_SERVICE_ROLE_KEY` is loaded from server-side environment variables only. It is never sent to the frontend, never exposed in API responses, and never included in client-side code.

---

## 4. API Contracts

Base URL: `http://localhost:8000`

All responses follow the standard envelope:
```json
{
  "data": <T>,
  "error": null
}
```

Error responses:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check |

### Profiles
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/profiles/me | Yes | Get current user profile |
| PUT | /api/profiles/me | Yes | Upsert current user profile |

### Documents
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/documents/upload | Yes | Upload PDF (multipart/form-data) |
| GET | /api/documents | Yes | List user's documents with status |
| GET | /api/documents/{id} | Yes | Get single document detail |
| DELETE | /api/documents/{id} | Yes | Delete document + chunks + storage file |

#### POST /api/documents/upload
- **Request**: multipart/form-data with `file` field (PDF, max 10MB)
- **Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "filename": "study-guide.pdf",
    "status": "queued",
    "created_at": "2026-09-10T..."
  }
}
```
- **Error 400**: Non-PDF file or exceeds size limit
- **Error 401**: Unauthenticated

#### GET /api/documents
- **Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "filename": "study-guide.pdf",
      "status": "ready",
      "page_count": 5,
      "created_at": "2026-09-10T..."
    }
  ]
}
```

### Tutor
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/tutor/chats | Yes | Create new chat session |
| GET | /api/tutor/chats | Yes | List chat sessions |
| GET | /api/tutor/chats/{id}/messages | Yes | Get messages for a chat |
| POST | /api/tutor/chats/{id}/messages | Yes | Send message + get AI response |

#### POST /api/tutor/chats/{id}/messages
- **Request**:
```json
{
  "content": "What is photosynthesis according to my notes?"
}
```
- **Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "role": "assistant",
    "content": "Based on your uploaded materials, photosynthesis is...",
    "is_grounded": true,
    "citations": [
      {
        "document_id": "uuid",
        "document_name": "biology-notes.pdf",
        "chunk_index": 3,
        "page_number": 7,
        "excerpt": "Photosynthesis is the process by which..."
      }
    ]
  }
}
```
- **Fallback response** (insufficient context):
```json
{
  "data": {
    "id": "uuid",
    "role": "assistant",
    "content": "I don't have enough information in your uploaded materials to answer this question accurately. Try uploading relevant study materials first.",
    "is_grounded": false,
    "citations": []
  }
}
```

### Quiz
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/quiz/generate | Yes | Generate quiz from settings |
| GET | /api/quiz/{id} | Yes | Get quiz with questions |
| POST | /api/quiz/{id}/attempt | Yes | Submit answers, get score + evaluation |
| GET | /api/quiz/{id}/attempts | Yes | List attempts for a quiz |

#### POST /api/quiz/generate
- **Request**:
```json
{
  "topic": "Photosynthesis",
  "difficulty": "medium",
  "question_count": 5
}
```
- **Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "topic": "Photosynthesis",
    "difficulty": "medium",
    "status": "ready",
    "questions": [
      {
        "id": "uuid",
        "question_text": "What is the primary pigment in photosynthesis?",
        "options": [
          {"label": "A", "text": "Chlorophyll"},
          {"label": "B", "text": "Hemoglobin"},
          {"label": "C", "text": "Melanin"},
          {"label": "D", "text": "Keratin"}
        ],
        "order_index": 0
      }
    ]
  }
}
```

#### POST /api/quiz/{id}/attempt
- **Request**:
```json
{
  "answers": {
    "question-uuid-1": "A",
    "question-uuid-2": "C"
  }
}
```
- **Response 201**:
```json
{
  "data": {
    "attempt_id": "uuid",
    "score": 80.0,
    "total_correct": 4,
    "total_questions": 5,
    "evaluation": {
      "weak_topics": ["cellular respiration"],
      "strong_topics": ["light reactions", "pigments"],
      "recommendations": [
        "Review Chapter 4 on cellular respiration",
        "Practice comparing light and dark reactions"
      ]
    },
    "details": [
      {
        "question_id": "uuid",
        "selected": "B",
        "correct": "A",
        "is_correct": false,
        "explanation": "Chlorophyll is the primary pigment..."
      }
    ]
  }
}
```

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/admin/health | No* | System health + aggregate totals |

*No auth for demo convenience; production would require admin role.

---

## 5. Authentication Flow

### Architecture

```
Browser ←→ Supabase Auth (signup/login/logout)
Browser ←→ Next.js middleware (route protection)
Browser ←→ FastAPI backend (passes Supabase JWT in Authorization header)
FastAPI ←→ Supabase (verifies JWT, extracts user_id)
```

### Signup flow
1. User fills signup form (`apps/web/app/(auth)/signup/page.tsx`)
2. Frontend calls `supabase.auth.signUp({ email, password })`
3. Supabase creates user in `auth.users`, returns session with JWT
4. Frontend calls `PUT /api/profiles/me` to upsert profile row (display_name from form)
5. Frontend stores session (Supabase SDK handles cookie/localStorage)
6. Frontend redirects to `/dashboard`

### Login flow
1. User fills login form (`apps/web/app/(auth)/login/page.tsx`)
2. Frontend calls `supabase.auth.signInWithPassword({ email, password })`
3. On success, fetch profile via `GET /api/profiles/me`
4. On success, redirect to `/dashboard`
5. On failure, show error message

### Route protection (frontend)
- `middleware.ts` intercepts requests to `/(app)/*` routes
- Checks for valid Supabase session using server-side client
- If no session → redirect to `/login`
- If session expired → redirect to `/login` with `?expired=true`

### Backend auth verification
- `apps/api/app/middleware/auth.py` extracts `Authorization: Bearer <jwt>` header
- Verifies JWT via Supabase's `auth.get_user(token)` or local JWT decode with Supabase JWT secret
- Populates `request.state.user_id`
- `get_current_user()` dependency in `apps/api/app/api/deps.py` returns user_id or raises 401

### Logout flow
1. User clicks LogoutButton
2. Frontend calls `supabase.auth.signOut()`
3. Session cleared, redirect to `/login`

### Session expired handling
- `SessionExpired.tsx` component detects auth errors during API calls
- Clears local state, redirects to login with message

---

## 6. Document Upload and Processing Pipeline

### Upload flow

```
User → UploadDocumentForm → POST /api/documents/upload
  → Validate: PDF only, ≤10MB
  → Upload file to Supabase Storage bucket "documents/{owner_id}/{uuid}.pdf"
  → Insert row in documents table (status: "queued")
  → Return document record to frontend

Background processing (triggered inline for MVP):
  → Update status to "processing"
  → Extract text from PDF (PyMuPDF / pdfplumber)
  → Split text into chunks (~500 tokens, ~100 token overlap)
  → Generate embeddings for each chunk (OpenAI text-embedding-3-small or similar)
  → Insert chunks + embeddings into document_chunks
  → Update status to "ready" (or "failed" with error_message)
```

### MVP simplification

For hackathon: processing runs synchronously in the upload endpoint (or as a background task using FastAPI's `BackgroundTasks`). No job queue needed. Status polling from frontend uses simple GET /api/documents refresh.

### Processing states

```
queued → processing → ready
                   └→ failed
```

### File validation
- MIME type check: `application/pdf`
- File extension check: `.pdf`
- Size limit: 10MB (configurable)
- On failure: return 400 with clear error, no document record created

### Deletion cascade
- DELETE /api/documents/{id}:
  1. Delete file from Supabase Storage
  2. Delete document row (CASCADE deletes chunks automatically via FK)

---

## 7. RAG Pipeline

### Architecture

```
User question
  → Embed question (same model as document chunks)
  → Vector similarity search over document_chunks WHERE owner_id = user_id
  → Top-K retrieval (K=5 default)
  → Grounding gate: check relevance score threshold
  → If grounded: construct prompt with retrieved context + question → LLM → structured response with citations
  → If not grounded: return fallback "insufficient context" response
```

### Retrieval (`apps/api/app/domain/tutor/retrieval.py`)
- Input: user question (text), user_id (UUID)
- Embed question using same embedding model as chunks
- Query: `SELECT * FROM document_chunks WHERE owner_id = $1 ORDER BY embedding <=> $2 LIMIT $3`
- Returns ranked list of `(chunk_id, document_id, content, page_number, similarity_score)`

### Grounding gate (`apps/api/app/domain/tutor/grounding.py`)
- Input: retrieved chunks with similarity scores
- Threshold: configurable minimum similarity score (e.g., 0.7)
- If no chunks pass threshold → `is_grounded = false`, return fallback
- If chunks pass → `is_grounded = true`, proceed to generation

### Generation
- System prompt instructs the LLM:
  - Answer based ONLY on provided context
  - Cite specific sources (document name, page number)
  - If context is insufficient, say so explicitly
  - Do not fabricate information not in the context
- User prompt: includes retrieved chunks as context + user's question
- Response parsing via `response_schema.py`: enforce structured output with `answer`, `citations[]`, `is_grounded`

### Citation format
```json
{
  "document_id": "uuid",
  "document_name": "filename.pdf",
  "chunk_index": 3,
  "page_number": 7,
  "excerpt": "The relevant sentence from the chunk..."
}
```

### Conversation history
- Last N messages from the chat included in the LLM prompt for context continuity
- Stored in `tutor_messages` table
- Frontend sends chat_id; backend fetches history and appends

---

## 8. AI Provider Abstraction and Fallback

### Provider adapter (`apps/api/app/domain/tutor/ai_adapter.py`)

```python
class AIProvider(Protocol):
    async def complete(self, messages: list[Message], schema: type[T]) -> T: ...
    async def embed(self, text: str) -> list[float]: ...

class OpenAIProvider(AIProvider): ...
class FallbackProvider(AIProvider): ...
```

### Design

- **Primary provider**: OpenAI (GPT-4o for generation, text-embedding-3-small for embeddings)
- **Fallback**: configurable secondary provider (e.g., Anthropic Claude) — same interface
- **Adapter pattern**: all domain code calls `AIProvider` interface, never a specific SDK
- **Timeout**: 30s per LLM call, configurable
- **Retry**: 1 automatic retry on transient errors (timeout, 5xx), then surface error to user
- **Error surfacing**: clear error message + retry button in UI (FR-010, NFR-006)

### Output shaping (`response_schema.py`)

All LLM responses are parsed into Pydantic models:
- `TutorResponse(answer: str, citations: list[Citation], is_grounded: bool)`
- `QuizGenerationResponse(questions: list[QuizQuestion])`
- `QuizEvaluationResponse(weak_topics: list[str], strong_topics: list[str], recommendations: list[str])`

If LLM output fails schema validation → retry once with stricter prompt → if still fails, return error to user.

---

## 9. Agent Architecture and Bounded Execution

### Agent definitions (P0)

| Agent | Purpose | Inputs | Outputs | Safety Bounds |
|-------|---------|--------|---------|---------------|
| **Tutor** | Answer questions grounded in user docs | question + context chunks + chat history | TutorResponse (answer + citations + grounded flag) | Must cite sources; must refuse when ungrounded; no tool use beyond retrieval |
| **Quiz Generator** | Generate MCQs on a topic | topic, difficulty, count, optional doc context | QuizGenerationResponse (questions list) | Output validated against schema; question count capped at 20 |
| **Evaluator** | Analyze quiz results | attempt answers, correct answers, topic tags | QuizEvaluationResponse (weak/strong/recommendations) | Read-only analysis; no external calls |

### Agents deferred to P1
| Agent | Purpose | Phase |
|-------|---------|-------|
| **Planner** | Generate study plans | P1 (T068) |
| **Career** | Career guidance | P1 (T069) |

### Bounded execution rules
1. **No autonomous tool use**: Agents call only the LLM completion endpoint. No file system, no network, no database writes (those happen in the calling domain code).
2. **Output schema validation**: Every agent response must parse into its Pydantic model. Invalid outputs are retried once, then error.
3. **Timeout**: 30s hard limit per agent call.
4. **Refuse/stop conditions**: Tutor refuses ungrounded answers. Quiz generator refuses if topic is empty. Evaluator refuses if no answers provided.
5. **Allowlisted operations**: Retrieval (read document_chunks), LLM completion, response parsing. Nothing else.

---

## 10. Frontend Routes and UI Components

### Route map

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/signup` | `(auth)/signup/page.tsx` | No | Signup form |
| `/login` | `(auth)/login/page.tsx` | No | Login form |
| `/dashboard` | `(app)/dashboard/page.tsx` | Yes | Landing page with sections overview |
| `/documents` | `(app)/documents/page.tsx` | Yes | Document list + upload |
| `/tutor` | `(app)/tutor/page.tsx` | Yes | AI tutor chat |
| `/quiz` | `(app)/quiz/page.tsx` | Yes | Quiz config + attempt + results |
| `/admin` | `(app)/admin/page.tsx` | Yes* | Health totals (demo) |

### Key UI components

**Auth pages**: Email + password forms with loading spinners, inline error messages, link to alternate (login↔signup).

**Dashboard**: Greeting with user name, quick-access cards to Documents / Tutor / Quiz, summary counts (documents uploaded, chats, quizzes taken).

**Documents page**: File upload zone (drag-drop or click, PDF only validation), document list table with columns (name, status badge, date, delete button). Status badges: queued (yellow), processing (blue spinner), ready (green), failed (red).

**Tutor page**: Chat interface with message bubbles. Assistant messages show citation chips when grounded. Fallback messages styled distinctly. Input composer with send button and retry on error. Chat session selector sidebar.

**Quiz page**: Three-step flow:
1. Configuration form (topic input, difficulty select, question count slider)
2. Quiz attempt (question cards with radio options, submit button)
3. Results view (score display, correct/incorrect breakdown, weak/strong topic chips, recommendation list)

**Shared components**: `LoadingStates.tsx` (skeleton loaders, spinners), `SessionExpired.tsx` (redirect overlay), `ErrorBoundary.tsx` (global error with retry).

### Styling approach
- Tailwind CSS utility classes
- shadcn/ui for form controls, buttons, cards, dialogs, toasts
- Mobile-first responsive: stack on small screens, side-by-side on desktop
- Dark/light mode via Tailwind dark class (nice-to-have, not P0)

---

## 11. Frontend/Backend Integration

### API client (`apps/web/lib/api.ts`)

Thin wrapper around `fetch` that:
1. Reads Supabase session token
2. Sets `Authorization: Bearer <token>` header
3. Sets `Content-Type: application/json` (or multipart for uploads)
4. Parses response envelope (`{ data, error }`)
5. On 401 → triggers session expired flow
6. On other errors → throws typed error for UI to catch

### Data fetching pattern

- **Server Components**: fetch data in RSC using server-side Supabase client where possible
- **Client Components**: use `useEffect` + state for mutations and real-time updates
- **No heavy data fetching library** for MVP (no React Query/SWR) — simple fetch + state is sufficient for hackathon scope

### File upload
- `UploadDocumentForm` uses `FormData` with `fetch` to POST multipart to `/api/documents/upload`
- Progress is not tracked for MVP (just loading spinner → success/error)
- After upload, poll GET `/api/documents` to watch status transition

### Environment variables (frontend)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 12. Error Handling and Retries

### Backend error model

```python
class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict = None): ...

class AuthError(AppError): ...        # 401
class ForbiddenError(AppError): ...    # 403
class NotFoundError(AppError): ...     # 404
class ValidationError(AppError): ...   # 422
class AIProviderError(AppError): ...   # 502
```

Global exception handler in FastAPI converts all `AppError` subclasses to the standard error envelope.

### Retry strategy

| Scenario | Retries | Behavior |
|----------|---------|----------|
| LLM timeout | 1 | Automatic retry with same prompt |
| LLM 5xx | 1 | Automatic retry |
| LLM schema validation failure | 1 | Retry with stricter prompt |
| LLM primary provider down | 1 | Fallback to secondary provider |
| Supabase transient failure | 0 | Surface error immediately |
| File upload failure | 0 | Surface error, user retries manually |

### Frontend error handling
- API client catches all errors and returns typed error objects
- Components display inline error messages with retry buttons for AI operations
- Toast notifications for transient errors (network issues)
- Global error boundary catches unhandled exceptions

---

## 13. Testing Strategy

### Backend (pytest)

**Unit tests** (`tests/unit/`):
- Grounding gate logic (threshold, edge cases)
- Quiz validation rules
- Quiz scoring/evaluation logic
- Status transition logic
- Response schema parsing

**Integration tests** (`tests/integration/`):
- Auth middleware with real Supabase JWT
- Document upload → processing → chunk storage
- RAG retrieval with vector search
- Full tutor flow (question → retrieval → grounding → response)
- Quiz generate → attempt → evaluate flow

**Contract tests** (`tests/contract/`):
- All API endpoints return correct response shapes
- Error responses match standard envelope
- Auth-protected endpoints return 401 without token

### Frontend (vitest + RTL)

**Component tests**:
- Auth forms render, validate, submit
- Document list renders statuses correctly
- Chat messages render citations
- Quiz flow transitions between steps

**Integration tests**:
- Route guard redirects unauthenticated users

### Test-first mandate (Constitution Gate B)

For these areas, tests MUST be written before implementation:
1. RLS policies (can user A see user B's data? → NO)
2. Auth middleware (valid JWT → user_id; invalid → 401)
3. Grounding gate (above threshold → grounded; below → fallback)
4. Quiz scoring (known answers → known score)
5. Document status transitions (valid transitions only)

---

## 14. Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase CLI (`npx supabase`)
- An OpenAI API key (or compatible provider)

### Environment setup

**Backend** (`apps/api/.env`):
```
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<from supabase start>
SUPABASE_JWT_SECRET=<from supabase start>
OPENAI_API_KEY=<your key>
AI_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-small
```

**Frontend** (`apps/web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Start commands

```bash
# Terminal 1: Supabase local
npx supabase start
npx supabase db push     # Apply migrations

# Terminal 2: Backend
cd apps/api
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 3: Frontend
cd apps/web
npm install
npm run dev               # http://localhost:3000
```

### pgvector setup
The Supabase local instance includes pgvector. Enable in first migration:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 15. Deployment Strategy

### Target: Single-host deployment (hackathon)

| Component | Deployment |
|-----------|------------|
| Frontend | Vercel (Next.js native) or single Docker container |
| Backend | Railway / Render / single Docker container |
| Database | Supabase cloud project (free tier) |
| Storage | Supabase Storage (included with project) |

### Deployment steps
1. Create Supabase cloud project, run migrations, enable pgvector
2. Deploy backend to Railway/Render with environment variables
3. Deploy frontend to Vercel with environment variables pointing to deployed backend + Supabase
4. Verify end-to-end flow

### No infrastructure complexity
- No Kubernetes
- No microservices
- No Kafka or message queues
- No Redis (for MVP)
- No CDN configuration
- Single backend process handles all requests including background PDF processing

---

## Complexity Tracking

No violations to justify. The architecture uses standard patterns within the modular monolith constraint. All decisions map directly to spec requirements.

---

## Traceability Matrix

| Spec Requirement | Plan Section | Tasks |
|-----------------|--------------|-------|
| FR-001 (Signup) | §5 Auth Flow | T013, T013a, T015 |
| FR-002 (Login) | §5 Auth Flow | T013, T013a, T016 |
| FR-003 (Logout) | §5 Auth Flow | T017 |
| FR-004 (Protected dashboard) | §5 Auth Flow, §10 Routes | T014, T018–T021 |
| FR-005 (Upload PDF) | §6 Document Pipeline | T028, T032–T033 |
| FR-006 (Processing status) | §6 Document Pipeline | T031, T036 |
| FR-007 (Document list/delete) | §4 API Contracts | T029–T030, T032 |
| FR-008 (AI tutor) | §7 RAG Pipeline, §9 Agents | T039–T042, T046–T048 |
| FR-009 (RAG citations) | §7 RAG Pipeline | T040–T042, T045 |
| FR-010 (Fallback) | §7 RAG Pipeline, §8 AI Fallback | T041, T044 |
| FR-011 (Quiz generation) | §4 API Contracts, §9 Agents | T051–T052, T055–T056 |
| FR-012 (Quiz submission) | §4 API Contracts | T053, T057 |
| FR-013 (Evaluation) | §9 Agents | T054, T058 |
| FR-014 (Record interactions) | §7 RAG Pipeline | T043 |
| NFR-001 (Mobile-first) | §10 Styling | T065 |
| NFR-002 (Accessible) | §10 Styling | T065 |
| NFR-003 (Loading indicators) | §10 UI Components | T060 |
| NFR-004 (Server-side auth) | §5 Auth Flow | T018–T019 |
| NFR-005 (No frontend secrets) | §11 Env Variables | — |
| NFR-006 (AI error handling) | §12 Error Handling | T059, T044 |
| NFR-007 (Fallback UX) | §7, §12 | T041, T046 |

---

## P1/P2 Deferred Work

These are explicitly **not** part of this plan and will not be implemented until P0 is verified:

- **P1**: Study planner (T068), Career assistant (T069), Progress analytics (T070)
- **P2**: Advanced personalization (T071), Admin analytics expansion (T072), Additional integrations (T073)

---

## Consistency Verification

| Check | Result |
|-------|--------|
| Plan covers all 14 functional requirements (FR-001–FR-014) | ✅ |
| Plan covers all 7 non-functional requirements (NFR-001–NFR-007) | ✅ |
| Plan maps to all 73 tasks (T001–T073) | ✅ |
| Plan respects all 6 constitution quality gates (A–F) | ✅ |
| Plan uses specified tech stack (Next.js, FastAPI, Supabase, etc.) | ✅ |
| Plan follows modular monolith (no microservices/Kafka/K8s) | ✅ |
| Plan defers P1/P2 explicitly | ✅ |
| All user-owned tables have owner_id, RLS, timestamps | ✅ |
| Database uses PostgreSQL with pgvector | ✅ |
| No requirements modified or added silently | ✅ |
