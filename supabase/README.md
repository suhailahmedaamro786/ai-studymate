# Supabase Setup

## Local Development

```bash
# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db push
```

## Migrations

Applied in order:
1. `001_create_profiles_and_rls.sql` — profiles table with RLS
2. `002_create_documents_and_rls.sql` — documents table with RLS
3. `003_create_document_chunks_and_rls.sql` — document_chunks with pgvector
4. `004_create_tutor_tables_and_rls.sql` — tutor_chats with RLS
5. `005_create_tutor_messages_and_rls.sql` — tutor_messages with RLS
6. `006_create_quiz_tables_and_rls.sql` — quizzes, quiz_questions, quiz_attempts, quiz_evaluations with RLS
7. `007_vector_search_function.sql` — pgvector similarity search function
8. `008_vector_index.sql` — HNSW index on document_chunks.embedding

## Storage Bucket

Create a bucket named `documents` in Supabase Storage. The bucket policies are managed by the Supabase dashboard.

## Environment Variables

Copy `.env.example` to `.env` and fill in values from `npx supabase start` output.
