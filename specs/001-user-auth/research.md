# Research: AI StudyMate MVP (User Auth + P0)

**Date**: 2026-09-10
**Input**: Technical Context from plan.md

## Resolved Decisions

### 1. PDF Parsing Library

**Decision**: PyMuPDF (fitz)
**Rationale**: Fast, reliable text extraction with page-level metadata. Works well for academic PDFs with mixed formatting. Single dependency, no Java/Tika needed.
**Alternatives considered**:
- pdfplumber: good for tables but slower on text-heavy docs
- Apache Tika: requires JVM, overkill for MVP
- PyPDF2: unreliable text extraction on complex layouts

### 2. Text Chunking Strategy

**Decision**: Recursive character splitter, ~500 tokens per chunk, ~100 token overlap
**Rationale**: Balances retrieval precision (not too large) with context completeness (enough overlap to avoid splitting mid-sentence). Standard RAG pattern.
**Alternatives considered**:
- Sentence-level splitting: too granular, increases embedding costs
- Page-level splitting: too coarse for targeted retrieval
- Semantic chunking: too complex for hackathon timeline

### 3. Embedding Model

**Decision**: OpenAI text-embedding-3-small (1536 dimensions)
**Rationale**: Good quality/cost ratio, well-supported, compatible with pgvector. Dimensions match our schema.
**Alternatives considered**:
- text-embedding-3-large: better quality but higher cost, unnecessary for MVP
- Local models (sentence-transformers): adds GPU dependency, deployment complexity

### 4. Vector Search Index

**Decision**: pgvector with HNSW index (on document_chunks.embedding)
**Rationale**: HNSW provides fast approximate nearest neighbor search. pgvector is built into Supabase, no external service needed.
**Alternatives considered**:
- IVFFlat: faster to build but slower recall on small datasets
- Pinecone/Weaviate: external dependency, unnecessary when Supabase includes pgvector
- No index (brute force): acceptable for demo scale but HNSW is trivial to add

### 5. LLM for Generation

**Decision**: OpenAI GPT-4o (primary), with provider adapter for optional fallback
**Rationale**: Best general-purpose model for grounded Q&A and structured output. Well-documented function calling / structured outputs for schema enforcement.
**Alternatives considered**:
- Claude: excellent but adds second SDK dependency for primary
- GPT-4o-mini: cheaper but weaker at following grounding constraints
- Local models: deployment complexity, quality tradeoffs

### 6. Background Processing for PDF

**Decision**: FastAPI BackgroundTasks (inline)
**Rationale**: No job queue needed for demo scale. BackgroundTasks runs after response is sent, so upload returns immediately. Status updates via polling.
**Alternatives considered**:
- Celery + Redis: production-grade but overkill for hackathon
- asyncio.create_task: similar to BackgroundTasks but less integrated with FastAPI lifecycle
- Synchronous processing: blocks the upload response, poor UX

### 7. Frontend Data Fetching

**Decision**: Plain fetch + React state (no data fetching library)
**Rationale**: MVP has ~15 endpoints with simple CRUD patterns. React Query/SWR adds learning curve and bundle size for minimal benefit at this scale.
**Alternatives considered**:
- React Query: excellent but unnecessary complexity for 3-day hackathon
- SWR: lighter but still an extra dependency to learn
- tRPC: requires both ends in TS, we have Python backend

### 8. Supabase Auth Token Handling

**Decision**: Use @supabase/ssr for server-side cookie-based sessions in Next.js
**Rationale**: Supabase's official SSR package handles cookie management in App Router middleware and server components. Avoids localStorage-only approach that breaks SSR.
**Alternatives considered**:
- @supabase/auth-helpers (legacy): deprecated in favor of @supabase/ssr
- Manual JWT handling: more code, error-prone
- NextAuth.js: adds abstraction layer over Supabase auth, unnecessary

### 9. Grounding Threshold

**Decision**: Cosine similarity threshold of 0.7 (configurable via env var)
**Rationale**: Empirically reasonable default for text-embedding-3-small with academic content. Can be tuned during demo testing.
**Alternatives considered**:
- Fixed 0.8: too strict, may reject valid matches with paraphrased queries
- No threshold (always ground): risks hallucination on irrelevant retrievals
- LLM-based grounding check: adds latency and cost

### 10. Deployment Target

**Decision**: Vercel (frontend) + Railway (backend) + Supabase Cloud (database)
**Rationale**: All have free tiers sufficient for hackathon demo. Vercel has native Next.js support. Railway supports Python with minimal config.
**Alternatives considered**:
- All Docker on single VPS: more setup time
- Render: similar to Railway, either works
- Fly.io: good but more config for Python
