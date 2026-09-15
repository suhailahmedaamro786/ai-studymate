# Hackathon Demo Skill

## Purpose

Ensure the AI StudyMate demo flows smoothly in a 3–5 minute presentation, with prepared data, graceful fallbacks, and a compelling narrative.

## When to Use

- Before any demo or presentation.
- After completing P0 features.
- When preparing demo data and scenarios.
- Before going live with the deployed version.

## Demo Script (3–5 minutes)

### Setup (30s)

- Have two browser tabs open: one logged in as demo user, one as a fresh visitor (to show auth).
- Have a small PDF ready (e.g., a 5-page biology study guide) pre-uploaded.
- Have the Supabase dashboard open (optional, to show data flowing in).

### Flow

1. **Auth (30s)**: Show login page → sign in → dashboard appears. Point out the protected route (refresh the page while logged out to show redirect).

2. **Dashboard (15s)**: Show the dashboard with greeting, quick-access cards, and summary counts.

3. **Document Upload (45s)**:
   - Navigate to Documents.
   - Upload a small PDF.
   - Show the status badge transitioning: queued → processing → ready.
   - If it takes too long, have a pre-uploaded document ready to show.

4. **RAG Tutor (60s)**:
   - Navigate to Tutor.
   - Ask a question that IS in the PDF: "What is photosynthesis?"
   - Show the grounded response with citations (document name, page number, excerpt).
   - Point out the `is_grounded` indicator and citation chips.
   - Ask a question that is NOT in the PDF: "What is quantum entanglement?"
   - Show the fallback response: "I don't have enough information..."
   - Emphasize: no fabrication, graceful fallback.

5. **Quiz Generation + Evaluation (60s)**:
   - Navigate to Quiz.
   - Select topic "Photosynthesis", difficulty "medium", 5 questions.
   - Show quiz generating → questions appear.
   - Answer questions and submit.
   - Show results: score, correct/incorrect breakdown.
   - Show weak topics, strong topics, and recommendations.

6. **Closing (15s)**: Return to dashboard, summarize the flow. Mention P1 features (study planner, career assistant) as roadmap.

### Demo Data Preparation

- **PDF**: 5–8 pages of academic content (biology, physics, or history). Named clearly (e.g., `biology-notes.pdf`).
- **Pre-uploaded**: Upload the PDF before the demo starts to avoid waiting for processing.
- **Known Q&A**: Prepare 2–3 questions with known answers from the PDF.
- **Known wrong question**: Prepare 1 question that is NOT in the PDF to demonstrate fallback.

### AI Failure Fallback Strategy

If the LLM provider is down during the demo:
1. **Tutor**: Show a pre-recorded response in the UI. Say "In production, this would come from the AI. Here's what it would look like."
2. **Quiz**: Show pre-generated quiz questions. Say "Quiz generation uses the same AI pipeline."
3. **Evaluation**: Show pre-computed evaluation results.
4. **Never** say "it's not working" — always show the intended UX.

### Demo Environment

- Use the deployed version (Vercel + Render + Supabase Cloud) — not localhost.
- Have a backup local version ready in case of network issues.
- Test the full flow 30 minutes before the demo.
- Have the terminal ready to show code if asked.

### Common Demo Issues & Mitigations

| Issue | Mitigation |
|-------|------------|
| LLM timeout | Pre-recorded response in UI |
| PDF processing slow | Pre-upload before demo |
| CORS error | Verify CORS config in deployment |
| Auth not working | Have backup local session |
| Network down | Switch to local version |

## Quality Checklist

- [ ] Full demo script rehearsed at least once.
- [ ] Demo PDF uploaded and processed before demo.
- [ ] Known Q&A pairs prepared.
- [ ] Fallback responses prepared for AI failure.
- [ ] Deployed URL tested end-to-end.
- [ ] Backup local version ready.
- [ ] Terminal/code available if needed.
- [ ] Timer practiced (3–5 minutes).

## Failure Conditions

- Demo takes longer than 5 minutes.
- No fallback for AI provider failure.
- Demo relies on localhost (not deployed).
- No prepared data (scrambling to upload during demo).
- Blank screens or unhandled errors during demo.

## Expected Output

- Rehearsed demo script with timing.
- Pre-uploaded demo data.
- Fallback responses for AI failures.
- Verified deployed URL working end-to-end.
