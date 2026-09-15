# UI Quality Skill

## Purpose

Ensure the AI StudyMate frontend delivers a polished, accessible, and responsive user experience that works for a 3-minute hackathon demo.

## When to Use

- After building a page or component.
- Before any demo or user testing.
- When reviewing PRs that touch UI code.
- When the frontend subagent needs quality feedback.

## Workflow

1. **Visual hierarchy** — Check that each page has a clear primary action (e.g., "Upload PDF", "Send Message"). Headings, spacing, and component sizing guide the eye.
2. **Responsive layout** — Verify mobile-first design at 320px width. Check that layouts reflow at tablet (768px) and desktop (1024px+). Use Tailwind breakpoints consistently.
3. **Accessibility** — Verify:
   - All interactive elements are keyboard-focusable with visible focus rings.
   - Form inputs have associated labels.
   - Error messages are associated with inputs via `aria-describedby`.
   - Buttons have descriptive text or `aria-label`.
   - Color contrast meets WCAG AA (4.5:1 for text).
   - shadcn/ui components are used as-is (they include ARIA defaults).
4. **Loading states** — Every async operation (fetch, mutation, file upload) must show a loading indicator. No blank screens.
5. **Error states** — Every async operation must handle errors gracefully. Show inline errors with user-friendly messages and retry buttons where appropriate.
6. **Empty states** — Lists with no data must show a helpful empty state message (e.g., "No documents yet. Upload your first PDF to get started.").
7. **Success states** — Successful actions must provide clear feedback (e.g., toast notification, status update).
8. **Consistency** — Spacing, typography, colors, and component usage must be consistent across pages.
9. **Type safety** — All API response data must be typed. No `any` types in component code.
10. **Performance** — No unnecessary re-renders. Images (if any) must have proper sizing.

## Quality Checklist

- [ ] Primary action is visually prominent on each page.
- [ ] Mobile layout tested at 320px width.
- [ ] All interactive elements keyboard-accessible with visible focus.
- [ ] Form inputs have labels and error associations.
- [ ] Loading states present for all async operations.
- [ ] Error states present for all error scenarios with retry where applicable.
- [ ] Empty states provide helpful guidance.
- [ ] Success feedback is visible (toast, inline, or status update).
- [ ] Tailwind classes are consistent (no inline styles, no magic numbers).
- [ ] No glassmorphism, excessive gradients, or decorative elements.
- [ ] TypeScript compiles with zero errors.
- [ ] No console warnings in development.

## Failure Conditions

- Any page has a blank screen while loading data.
- Any form submission shows no feedback.
- Interactive elements are not keyboard-accessible.
- Color contrast fails WCAG AA.
- API responses are typed as `any`.
- Excessive decorative CSS (glassmorphism, gradients, animations).

## Expected Output

- Polished, responsive pages that work on mobile and desktop.
- Consistent UX patterns across all pages.
- Accessibility report with any issues found.
- Screenshot or description of each page's visual state.
