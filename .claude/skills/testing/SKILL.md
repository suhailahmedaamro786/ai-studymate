# Testing Skill

## Purpose

Guide the creation of comprehensive tests for AI StudyMate, covering unit, integration, E2E, and AI reliability scenarios.

## When to Use

- After implementing any feature (write tests).
- Before marking a task as complete.
- During PR review to verify test coverage.
- When debugging a regression (write a failing test first).

## Test Types

### Unit Tests (pytest for backend, vitest for frontend)

**Backend unit tests focus:**
- Domain logic: grounding gate, quiz scoring, status transitions, chunking logic.
- Schema validation: request/response parsing, error formatting.
- AI provider adapter: timeout simulation, retry behavior, fallback.
- Response shaping: LLM output parsing into Pydantic models.

**Frontend unit tests focus:**
- Component rendering and interaction.
- Form validation.
- API client error handling.
- State management for loading/error/success.

### Integration Tests (pytest + httpx + Supabase local)

**Key integration scenarios:**
- Auth: valid JWT → user_id; invalid JWT → 401.
- Documents: upload → processing → chunk storage → list → delete.
- RAG: upload PDF → embed → retrieve → ground → generate.
- Tutor: send message → receive grounded response with citations.
- Tutor fallback: send unrelated question → receive ungrounded fallback.
- Quiz: generate → submit → evaluate → view results.
- Cross-user isolation: user A cannot access user B's resources (RLS enforcement).

### Contract Tests (pytest)

- Every endpoint returns the correct HTTP status code.
- Every response matches the standard envelope.
- Every error response includes `code`, `message`, `details`.
- Auth-protected endpoints return 401 without token.

### AI Reliability Tests (pytest with mocked AIProvider)

- LLM timeout → retry once → success/failure.
- LLM returns invalid schema → retry with stricter prompt → fallback.
- Primary provider down → fallback provider engaged.
- Tutor refuses ungrounded queries (no fabrication).
- Quiz generation produces valid MCQ structure.
- Evaluator produces correct scoring from known inputs.

### Frontend E2E (if feasible)

- Signup → login → dashboard visible.
- Upload PDF → status transitions.
- Tutor grounded question → citations displayed.
- Tutor ungrounded question → fallback displayed.
- Quiz generate → submit → evaluation displayed.

## Test-First Rules (Constitution Gate B)

Write failing tests first for:
1. RLS policies (user A cannot see user B's data).
2. Auth middleware (valid JWT → user_id; invalid → 401).
3. Grounding gate (above threshold → grounded; below → fallback).
4. Quiz scoring (known answers → known score).
5. Document status transitions (valid transitions only).

## Edge Cases to Cover

- Upload non-PDF file → 400 error.
- Upload oversized file → 400 error.
- Access another user's document → 404.
- Submit quiz with missing answers → validation error.
- Tutor query with no uploaded documents → fallback.
- Document processing fails → status = failed, error message set.
- Delete document during processing → handled gracefully.
- LLM provider timeout → retry then error to user.
- Empty quiz topic → validation error.
- Concurrent quiz attempts → both evaluated independently.

## Negative Testing

- Invalid JWT format → 401.
- Expired session → 401, session expired UI.
- SQL injection attempts → blocked by parameterized queries.
- XSS in chat messages → escaped in frontend.
- Path traversal in file names → blocked.
- Oversized request body → rejected.

## Regression Testing

- Every bug fix must have a regression test.
- Run full test suite after each change.
- Use `pytest -x` to stop on first failure during development.

## Quality Checklist

- [ ] All correctness-critical logic has unit tests.
- [ ] All API endpoints have contract tests.
- [ ] Cross-user isolation verified by integration tests.
- [ ] AI reliability tested with mocked provider.
- [ ] Edge cases covered (invalid input, missing data, failures).
- [ ] Negative cases covered (unauthorized access, bad input).
- [ ] Regression tests exist for known bugs.
- [ ] Full test suite passes: `pytest` and `npm test`.

## Failure Conditions

- Claiming a feature works without test evidence.
- Skipping tests for "simple" code.
- Using real LLM calls in tests (must mock).
- Tests that pass randomly (non-deterministic).
- Missing cross-user isolation test.
- Missing grounding/fallback test for tutor.

## Expected Output

- Test files in `apps/api/tests/unit/`, `integration/`, `contract/`.
- Test files in `apps/web/__tests__/`.
- Passing test suite with coverage report.
- Regression tests for known bugs.
