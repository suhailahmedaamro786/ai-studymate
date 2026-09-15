---
id: plan-mvp-user-auth-p0-001
title: plan-mvp-user-auth-p0
stage: plan
date: 2026-09-10
surface: cli
model: claude-opus-4-6-thinking
feature: user-auth
branch: 001-user-auth
user: Suhail Ahmed Aamro
command: /sp.plan
labels: [plan, mvp, architecture, hackathon]
links:
  spec: specs/001-user-auth/spec.md
  ticket: ~
  adr: ~
  pr: ~
files:
  - specs/001-user-auth/plan.md
  - specs/001-user-auth/research.md
  - specs/001-user-auth/data-model.md
  - specs/001-user-auth/quickstart.md
  - specs/001-user-auth/contracts/api-contracts.md
tests:
  ~
---

## Prompt

Create the complete technical implementation plan for AI StudyMate.

Use the existing:
- CLAUDE.md
- .specify/memory/constitution.md
- specs/001-user-auth/spec.md
- specs/001-user-auth/tasks.md

Architecture is fixed:
- Frontend: Next.js + TypeScript + Tailwind CSS + shadcn/ui
- Backend: FastAPI + Python + Pydantic
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Storage: Supabase Storage
- AI: LLM abstraction layer with one primary provider and optional fallback
- RAG: document ingestion, parsing, chunking, embeddings, vector search, retrieval, grounded generation
- Agents: Tutor, Quiz, Evaluator, Planner, Career
- Architecture style: modular monolith

The plan must cover:
1. Repository structure
2. Database schema and entities
3. Supabase RLS and authorization
4. API contracts
5. Authentication flow
6. Document upload and processing pipeline
7. RAG pipeline
8. AI provider abstraction and fallback
9. Agent architecture and bounded execution
10. Frontend routes and UI components
11. Frontend/backend integration
12. Error handling and retries
13. Testing strategy
14. Local development
15. Deployment strategy

Constraints:
- 3-day hackathon
- P0 features first
- Keep P1/P2 explicitly deferred
- No Kubernetes
- No microservices
- No Kafka
- No unnecessary infrastructure
- Prefer a modular monolith
- Do not modify the requirements silently
- Do not implement code yet

Generate and save the technical plan to:
specs/001-user-auth/plan.md

At the end, summarize the plan and confirm that it is consistent with the existing specification and tasks.

## Response snapshot

Generated a comprehensive technical implementation plan covering all 15 required sections. Created 5 artifacts:

1. **plan.md** — Full implementation plan with 15 sections: repo structure, database schema (9 tables), RLS strategy, API contracts (~15 endpoints), auth flow (Supabase Auth + JWT), document processing pipeline, RAG pipeline (embed → retrieve → ground → generate), AI provider abstraction with fallback, 3 P0 agents (Tutor/Quiz/Evaluator) with bounded execution rules, 7 frontend routes with component breakdown, integration patterns, error handling with retry strategy, test-first testing plan, local dev setup, and deployment to Vercel/Railway/Supabase Cloud.

2. **research.md** — 10 resolved technical decisions: PyMuPDF for PDF parsing, recursive chunking (500 tokens/100 overlap), text-embedding-3-small, pgvector HNSW, GPT-4o primary, FastAPI BackgroundTasks, plain fetch (no React Query), @supabase/ssr, 0.7 cosine threshold, Vercel+Railway+Supabase Cloud deployment.

3. **data-model.md** — Complete entity definitions for all 9 tables with field types, constraints, indexes, RLS policies, and state transitions.

4. **quickstart.md** — Local development setup guide (prerequisites, Supabase, backend, frontend, verification steps).

5. **contracts/api-contracts.md** — Full API contract reference with request/response shapes for all endpoints.

Traceability matrix confirms all 14 FRs, 7 NFRs, and 73 tasks are covered. All 6 constitution gates pass. No requirements were modified.

## Outcome

- ✅ Impact: Complete technical plan ready for implementation; all architecture decisions documented
- 🧪 Tests: No code yet — testing strategy defined in plan §13 (pytest, vitest, test-first for RLS/auth/grounding/scoring)
- 📁 Files: 5 files created in specs/001-user-auth/
- 🔁 Next prompts: /sp.implement to begin Phase 1 task execution (T001–T006 repo scaffolding)
- 🧠 Reflection: Plan maintains clean separation between what (spec) and how (plan). Denormalized owner_id on child tables is the key architectural decision for RLS performance. Keeping BackgroundTasks instead of Celery is the right hackathon tradeoff.

## Evaluation notes (flywheel)

- Failure modes observed: setup-plan.ps1 targets specs/main/ not specs/001-user-auth/; bash PHR script missing on Windows
- Graders run and results (PASS/FAIL): Manual consistency check PASS — all FRs/NFRs/tasks mapped
- Prompt variant (if applicable): ~
- Next experiment (smallest change to try): ~
