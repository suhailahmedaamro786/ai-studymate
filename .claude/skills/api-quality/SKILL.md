# API Quality Skill

## Purpose

Ensure all API endpoints follow consistent design, security, and contract patterns.

## When to Use

- After implementing or modifying any API endpoint.
- During code review of backend route changes.
- Before marking a feature as complete.
- When the backend subagent needs endpoint quality feedback.

## Workflow

1. **HTTP method** — Verify correct method: GET (read), POST (create), PUT (update), DELETE (remove). No GET with side effects.
2. **Path consistency** — Verify paths follow REST conventions: plural nouns, hierarchical for nested resources (`/api/tutor/chats/{id}/messages`).
3. **Authentication** — Verify the endpoint requires auth where specified in `contracts/api-contracts.md`. Check that `get_current_user()` dependency is applied.
4. **Authorization** — Verify that users can only access their own resources (RLS + owner_id checks).
5. **Request validation** — Verify Pydantic schemas validate all input fields. Check for type, range, and format validation.
6. **Response shape** — Verify responses match the standard envelope: `{ "data": <T>, "error": null }` or `{ "data": null, "error": { "code", "message", "details" } }`.
7. **Status codes** — Verify correct HTTP status codes:
   - 200 for successful reads/updates.
   - 201 for successful creates.
   - 400 for validation errors.
   - 401 for unauthenticated.
   - 404 for not found.
   - 422 for validation failures.
   - 502 for AI provider errors.
   - 500 for unexpected errors.
8. **Error consistency** — Verify all errors use the standard envelope with `code`, `message`, and `details` fields. No raw exception strings.
9. **Security** — Verify no secrets, tokens, or PII leak in responses or error messages.
10. **OpenAPI** — Verify the endpoint is documented with summary, description, request body schema, and response schema.
11. **Tests** — Verify at least one test exists for the endpoint (contract test for shape, integration test for behavior).

## Quality Checklist

- [ ] Correct HTTP method used.
- [ ] Path follows REST conventions.
- [ ] Auth dependency applied where required.
- [ ] Request validated with Pydantic schema.
- [ ] Response matches standard envelope.
- [ ] Correct HTTP status codes.
- [ ] Error responses are consistent and user-safe.
- [ ] No secrets or PII in responses/errors.
- [ ] OpenAPI documentation present.
- [ ] At least one test exists.

## Failure Conditions

- Endpoint returns wrong HTTP status code for a scenario.
- Response shape does not match `contracts/api-contracts.md`.
- Auth is missing on a protected endpoint.
- Raw exception messages leak in error responses.
- Endpoint modifies state on GET request.
- No validation on input fields.

## Expected Output

- Endpoint review report with pass/fail per check.
- List of violations with specific file paths and line numbers.
- Corrected response/request shapes if mismatched.
