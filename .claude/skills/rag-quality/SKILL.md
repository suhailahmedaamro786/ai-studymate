# RAG Quality Skill

## Purpose

Ensure the RAG pipeline (ingestion, retrieval, grounding, generation) is correct, secure, and produces reliable grounded responses.

## When to Use

- After implementing any part of the RAG pipeline.
- After modifying chunking, embedding, or retrieval logic.
- After changing LLM prompts or grounding logic.
- Before demoing the tutor feature.
- When the RAG subagent needs quality feedback.

## Workflow

1. **Ingestion review**:
   - PDF validation: MIME type, extension, size.
   - Text extraction: page numbers preserved, text cleaned.
   - Chunking: correct chunk size, overlap, sequential indexing.
   - Embeddings: correct model, dimensions (1536), no null embeddings for processed docs.
   - Storage: all chunks have `owner_id`, `document_id`, `chunk_index`, `page_number`.

2. **Retrieval review**:
   - Query embedding uses the same model as document chunks.
   - Vector search filters by `owner_id` (user isolation).
   - Top-K limit applied (default 5).
   - Results include similarity scores for grounding threshold check.
   - No cross-user data leakage possible.

3. **Grounding review**:
   - Similarity threshold applied (default 0.7).
   - When threshold not met: `is_grounded = false`, fallback response returned.
   - When threshold met: `is_grounded = true`, LLM called with context.
   - No hallucination on ungrounded queries (system prompt enforces this).
   - Citations are extracted and returned for grounded responses.

4. **Generation review**:
   - System prompt enforces: answer from context only, cite sources, refuse if insufficient.
   - User input is in user-message slot only (no system prompt injection).
   - LLM output is parsed into structured `TutorResponse` schema.
   - Raw LLM output is never returned to frontend without parsing.

5. **Citation review**:
   - Citations include `document_id`, `document_name`, `chunk_index`, `page_number`, `excerpt`.
   - Citations correspond to actual retrieved chunks (not fabricated).
   - Citation count is reasonable (not too many, not zero when grounded).

6. **Security review**:
   - No user document content leaked to other users.
   - No prompt injection vectors (user input not in system prompt).
   - No PII or sensitive content logged from chunks.

## Quality Checklist

- [ ] PDF validation rejects non-PDFs and oversized files.
- [ ] Chunks have correct metadata (owner_id, document_id, chunk_index, page_number).
- [ ] Embeddings are 1536-dimensional vectors.
- [ ] Retrieval filters by owner_id (user isolation).
- [ ] Grounding threshold is applied before LLM generation.
- [ ] Fallback response is returned for ungrounded queries.
- [ ] System prompt enforces citation and refusal behavior.
- [ ] LLM output is schema-validated before returning.
- [ ] Citations correspond to actual retrieved chunks.
- [ ] No chunk content appears in logs.
- [ ] No prompt injection vectors exist.

## Failure Conditions

- Cross-user data leakage in retrieval results.
- Hallucinated answers on ungrounded queries.
- Missing or incorrect citations on grounded responses.
- Raw LLM output passed to frontend without schema validation.
- User input injected into system prompt (injection risk).
- Chunk content logged in application logs.
- Embedding dimensions mismatch with pgvector column.

## Expected Output

- RAG pipeline quality report with pass/fail per check.
- List of retrieval failures (wrong chunks, missing user isolation).
- List of grounding failures (hallucination, missing citations).
- List of injection vectors (if any).
