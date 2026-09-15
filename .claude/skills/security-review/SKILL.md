# Security Review Skill

## Purpose

Systematically review AI StudyMate for security vulnerabilities, with focus on authentication, authorization, data isolation, secrets, AI safety, and deployment configuration.

## When to Use

- Before any demo or deployment.
- After implementing auth, upload, RAG, or AI features.
- During PR review for security-sensitive changes.
- When the security subagent needs a structured checklist.

## Workflow

1. **Authentication**:
   - [ ] Every protected endpoint requires a valid Supabase JWT.
   - [ ] JWT verification happens server-side, not client-side only.
   - [ ] Expired/invalid JWTs return 401, not 500.
   - [ ] Frontend middleware redirects unauthenticated users.

2. **Authorization & Data Isolation**:
   - [ ] Every user-owned table has RLS enabled.
   - [ ] RLS policies use `auth.uid()` comparison.
   - [ ] Cross-user access attempts return 404 (not 403).
   - [ ] Service-role key is only used in documented server-side operations.
   - [ ] Admin endpoint uses service-role client, not user-scoped client.

3. **Secrets Management**:
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-side only.
   - [ ] `SUPABASE_JWT_SECRET` is server-side only.
   - [ ] `OPENAI_API_KEY` is server-side only.
   - [ ] No secrets in git-tracked files.
   - [ ] No secrets in API responses or error messages.
   - [ ] Frontend only uses `NEXT_PUBLIC_` prefixed env vars for non-sensitive values.

4. **File Upload Security**:
   - [ ] MIME type validation (PDF only) on server.
   - [ ] File extension validation (.pdf only).
   - [ ] File size limit enforced (≤10MB).
   - [ ] Storage paths are user-scoped (no path traversal).
   - [ ] Uploaded files are not executable.

5. **AI Security**:
   - [ ] Prompt injection: no raw user input in system prompts.
   - [ ] RAG isolation: retrieval scoped by owner_id.
   - [ ] LLM output is schema-validated (no raw passthrough).
   - [ ] No user document content exposed to other users.
   - [ ] LLM responses are text-only (no HTML injection).

6. **CORS & Headers**:
   - [ ] CORS allows only specific frontend origin (not wildcard in production).
   - [ ] `Authorization` header is allowed.
   - [ ] Security headers set appropriately (CSP, X-Frame-Options).

7. **Rate Limiting**:
   - [ ] LLM endpoints have reasonable rate limits.
   - [ ] Upload endpoints have reasonable rate limits.

## Severity Classification

| Severity | Description | Action |
|----------|-------------|--------|
| **P0** | Exploitable vulnerability, data breach risk | Fix before demo |
| **P1** | Security weakness, fix before deployment | Fix before deployment |
| **P2** | Defense-in-depth improvement | Fix if time permits |
| **P3** | Nice-to-have hardening | Backlog |

## Quality Checklist

- [ ] Zero P0 findings.
- [ ] All P1 findings documented with remediation plan.
- [ ] Secrets management verified.
- [ ] RLS policies verified on all tables.
- [ ] Prompt injection vectors identified and blocked.
- [ ] Cross-user data leakage tested and blocked.
- [ ] CORS configured correctly.
- [ ] File upload validation complete.

## Failure Conditions

- Any P0 finding remains unaddressed.
- Service-role key exposed in any context.
- RLS missing on any user-owned table.
- Prompt injection vector in LLM prompts.
- Cross-user data access possible.

## Expected Output

- Security review report with findings classified P0–P3.
- For each finding: file path, attack scenario, impact, remediation steps.
- Sign-off statement when no P0 findings remain.
