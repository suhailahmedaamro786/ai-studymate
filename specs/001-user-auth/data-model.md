# Data Model: AI StudyMate MVP (User Auth + P0)

**Date**: 2026-09-10
**Source**: spec.md Key Entities + plan.md §2

## Entity Relationship Diagram (textual)

```
auth.users (Supabase managed)
  │
  ├── 1:1 ── profiles
  │
  ├── 1:N ── documents
  │             │
  │             └── 1:N ── document_chunks (with embedding vector)
  │
  ├── 1:N ── tutor_chats
  │             │
  │             └── 1:N ── tutor_messages
  │
  ├── 1:N ── quizzes
  │             │
  │             ├── 1:N ── quiz_questions
  │             │
  │             └── 1:N ── quiz_attempts
  │                          │
  │                          └── 1:1 ── quiz_evaluations
```

## Entities

### profiles
Maps 1:1 to auth.users. Stores student profile data.

| Field | Type | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PK |
| user_id | UUID | No | — | UNIQUE, FK → auth.users ON DELETE CASCADE |
| display_name | TEXT | Yes | NULL | |
| education_level | TEXT | Yes | NULL | |
| subjects | TEXT[] | No | '{}' | |
| goals | TEXT | Yes | NULL | |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**RLS**: `user_id = auth.uid()`
**Validation**: display_name max 100 chars, education_level from allowed enum (or free text for MVP)

### documents
User-uploaded PDFs with processing lifecycle.

| Field | Type | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PK |
| owner_id | UUID | No | — | FK → auth.users ON DELETE CASCADE |
| filename | TEXT | No | — | max 255 chars |
| storage_path | TEXT | No | — | Supabase Storage path |
| status | TEXT | No | 'queued' | CHECK ('queued','processing','ready','failed') |
| page_count | INTEGER | Yes | NULL | Set after processing |
| error_message | TEXT | Yes | NULL | Set on failure |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**RLS**: `owner_id = auth.uid()`
**Indexes**: (owner_id), (status)

**State transitions**:
```
queued ──→ processing ──→ ready
                      └──→ failed
```
No backward transitions. Failed documents can be deleted and re-uploaded.

### document_chunks
Text chunks extracted from documents, with embedding vectors for RAG.

| Field | Type | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PK |
| document_id | UUID | No | — | FK → documents ON DELETE CASCADE |
| owner_id | UUID | No | — | FK → auth.users ON DELETE CASCADE |
| chunk_index | INTEGER | No | — | Sequence within document |
| content | TEXT | No | — | Chunk text |
| embedding | VECTOR(1536) | Yes | NULL | text-embedding-3-small output |
| page_number | INTEGER | Yes | NULL | Source page |
| created_at | TIMESTAMPTZ | No | now() | |

**RLS**: `owner_id = auth.uid()` (denormalized for fast RLS)
**Indexes**: (document_id), (owner_id), HNSW on (embedding)

### tutor_chats
Conversation sessions for the AI tutor.

| Field | Type | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PK |
| owner_id | UUID | No | — | FK → auth.users ON DELETE CASCADE |
| title | TEXT | No | 'New Chat' | |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**RLS**: `owner_id = auth.uid()`

### tutor_messages
Individual messages within a tutor chat.

| Field | Type | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PK |
| chat_id | UUID | No | — | FK → tutor_chats ON DELETE CASCADE |
| owner_id | UUID | No | — | FK → auth.users ON DELETE CASCADE |
| role | TEXT | No | — | CHECK ('user','assistant') |
| content | TEXT | No | — | Message text |
| is_grounded | BOOLEAN | No | false | Whether response used RAG context |
| citations | JSONB | No | '[]' | Array of citation objects |
| created_at | TIMESTAMPTZ | No | now() | |

**RLS**: `owner_id = auth.uid()` (denormalized)
**Indexes**: (chat_id)

### quizzes
Quiz configuration and generation status.

| Field | Type | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PK |
| owner_id | UUID | No | — | FK → auth.users ON DELETE CASCADE |
| topic | TEXT | No | — | Non-empty |
| difficulty | TEXT | No | — | CHECK ('easy','medium','hard') |
| question_count | INTEGER | No | — | CHECK 1–20 |
| status | TEXT | No | 'generating' | CHECK ('generating','ready','failed') |
| created_at | TIMESTAMPTZ | No | now() | |

**RLS**: `owner_id = auth.uid()`

### quiz_questions
Generated quiz questions.

| Field | Type | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PK |
| quiz_id | UUID | No | — | FK → quizzes ON DELETE CASCADE |
| owner_id | UUID | No | — | FK → auth.users ON DELETE CASCADE |
| question_text | TEXT | No | — | |
| options | JSONB | No | — | Array of {label, text} |
| correct_option | TEXT | No | — | Label of correct option |
| explanation | TEXT | Yes | NULL | Why the answer is correct |
| topic_tag | TEXT | Yes | NULL | Sub-topic for evaluation |
| order_index | INTEGER | No | — | Display order |

**RLS**: `owner_id = auth.uid()` (denormalized)

### quiz_attempts
User submissions with computed scores.

| Field | Type | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PK |
| quiz_id | UUID | No | — | FK → quizzes ON DELETE CASCADE |
| owner_id | UUID | No | — | FK → auth.users ON DELETE CASCADE |
| answers | JSONB | No | — | Map of question_id → selected_option |
| score | NUMERIC(5,2) | No | — | Percentage |
| total_correct | INTEGER | No | — | |
| total_questions | INTEGER | No | — | |
| created_at | TIMESTAMPTZ | No | now() | |

**RLS**: `owner_id = auth.uid()`

### quiz_evaluations
AI-generated analysis of quiz performance.

| Field | Type | Nullable | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PK |
| attempt_id | UUID | No | — | FK → quiz_attempts ON DELETE CASCADE, UNIQUE |
| owner_id | UUID | No | — | FK → auth.users ON DELETE CASCADE |
| weak_topics | JSONB | No | — | Array of topic strings |
| strong_topics | JSONB | No | — | Array of topic strings |
| recommendations | JSONB | No | — | Array of recommendation strings |
| created_at | TIMESTAMPTZ | No | now() | |

**RLS**: `owner_id = auth.uid()`

## Cross-Cutting Rules

1. All tables use UUID primary keys via `gen_random_uuid()`
2. All user-owned tables include `owner_id` (or `user_id` for profiles) with FK to `auth.users`
3. All tables have `created_at TIMESTAMPTZ DEFAULT now()`
4. Mutable tables also have `updated_at TIMESTAMPTZ DEFAULT now()`
5. RLS is enabled on every table; policies use `auth.uid()` comparison
6. Child tables denormalize `owner_id` to avoid joins in RLS evaluation
7. CASCADE deletes propagate from parent to child (documents → chunks, chats → messages, quizzes → questions/attempts → evaluations)
