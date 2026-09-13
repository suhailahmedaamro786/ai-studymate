<!-- Sync Impact Report
Version change: TODO -> 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] -> User-Centered Design
- [PRINCIPLE_2_NAME] -> Spec-Driven Development
- [PRINCIPLE_3_NAME] -> Testing Discipline (Non-Negotiable)
- [PRINCIPLE_4_NAME] -> Secure-By-Default Architecture
- [PRINCIPLE_5_NAME] -> AI Reliability, RAG, and Agent Safety
Added sections:
- ## Quality Gates & Testing
- ## Delivery & Definition of Done
Templates requiring updates:
- ✅ plan-template.md (Constitution Check gates should reference this file)
- ⚠️ spec-template.md (may add “AI response requirements” reminders)
- ⚠️ tasks-template.md (may add explicit “accessibility” and “observability” tasks)
- ⚠️ runtime guidance docs: TODO if any reference old principle wording
Follow-up TODOs:
- TODO(RATIFICATION_DATE): initial constitution—set to hackathon start date when finalized.
-->

# AI StudyMate Constitution

## Core Principles

### User-Centered Design
Every user journey MUST be designed around observable user outcomes, not internal features.
We start with clear user scenarios, then trace them to specs and tests.

Rationale: user-centered flow prevents building “cool AI” that fails real learning needs.

### Spec-Driven Development
No feature work starts without a written spec that includes: user stories (prioritized), functional
requirements, acceptance scenarios, and measurable success criteria.

Rationale: specs reduce ambiguity and make it possible to demo value within a 3-day hackathon.

### Testing Discipline (Non-Negotiable)
Test-first is mandatory for all correctness-critical logic.
For each user story: write failing tests first, implement, then re-run until tests pass.
If a requirement affects data, contracts, security, or AI-grounding behavior, it MUST have tests.

Rationale: AI systems fail in edge cases—tests are the fastest reliable signal.

### Secure-By-Default Architecture
Security is a default property, not a feature.
All data access MUST follow least-privilege and include authorization boundaries.
If PostgreSQL is used, user-owned tables MUST include ownership info and enforce Row Level
Security (RLS). Input handling MUST validate and sanitize.

Rationale: secure defaults keep demos safe and simplify production readiness.

### AI Reliability, RAG, and Agent Safety
AI behavior MUST be grounded and verifiable.
RAG retrieval MUST be tied to the user request and responses MUST cite retrieved sources
or explicitly state when grounding is unavailable.
Agentic steps MUST be constrained by safety rules (e.g., tool-use allowlists, output
schema validation, and “refuse/stop” conditions for unsafe actions).

Rationale: reliability and safety are required for educational trust.

### Observability & Performance
Every user-visible AI/agent action MUST produce structured logs and tracing identifiers.
We enforce performance budgets for latency and include fast fallbacks for degraded paths.

Rationale: during a hackathon, observability prevents “black box” failures.

## Quality Gates & Testing

- **Gate A (Spec Gate)**: A PR cannot start implementation without linking to a spec file.
- **Gate B (Correctness Gate)**: All non-trivial logic MUST have unit tests; story flows
  MUST have at least one contract/integration test when interfaces cross boundaries.
- **Gate C (Security Gate)**: Any DB change MUST preserve RLS/ownership constraints.
  Any auth/authorization change MUST include tests for permission boundaries.
- **Gate D (AI Grounding Gate)**: Any response that claims facts MUST either cite RAG sources
  or explicitly say “not grounded.”
- **Gate E (Accessibility Gate)**: UI/UX must support keyboard navigation and readable contrast;
  ARIA roles must be correct for interactive elements.
- **Gate F (Observability Gate)**: Structured logs include request/user/session IDs.

Definition of “pass”: tests green, required gates satisfied, and PR description includes
how gates were met.

## Delivery & Definition of Done

A feature is **Done** only if all are true:

- User story acceptance scenarios pass.
- Relevant tests are added and passing.
- Security constraints are preserved (or improved) with explicit justification.
- AI/agent outputs follow response requirements (grounding, safe tool-use, validated formats).
- Observability exists for key user actions (logs/traces).
- Documentation is updated: spec/README/quickstart notes reflect the new behavior.
- Changes are committed with clear Git discipline (small PRs, incremental commits).

## Governance

- **Supremacy**: This constitution supersedes ad-hoc preferences.
- **Amendment Procedure**: Propose changes in a PR that lists affected sections, the
  rationale, and updated quality gates.
- **Versioning Policy**:
  - **MAJOR**: backward-incompatible governance/principle removals or redefinitions.
  - **MINOR**: new principles/sections or materially expanded requirements.
  - **PATCH**: clarifications, wording, or non-semantic refinements.
- **Compliance Review**:
  Before merging, reviewers MUST confirm that PR changes align with the gates above.
- **AI Response Requirement (global)**:
  - Be explicit about uncertainty.
  - When using RAG, cite sources; when not grounded, say so.
  - Enforce output schemas for agent actions.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-09-10
