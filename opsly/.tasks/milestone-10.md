# Milestone 10 — Demo Polish & Deploy
Status: IN_PROGRESS

## Tasks

### Bug Fixes (from Playwright PRD compliance testing)
- [x] Fix: Sign out doesn't redirect to login (useAuth.tsx) — DONE (completed: 2026-03-05)
- [x] Fix: "All clear for today" empty state never shows (TechnicianDashboardPage.tsx) — DONE (completed: 2026-03-05)
- [x] Fix: Markdown renders as raw text in voice widget (TranscriptDisplay.tsx) — DONE (completed: 2026-03-05)
- [x] Fix: Sidebar job card click (technician) — NO CODE CHANGE NEEDED, Playwright artifact (verified: 2026-03-05)

### Demo Polish
- [ ] End-to-end demo run: Act 1 (tenant voice + photo) works cleanly
- [ ] End-to-end demo run: Act 2 (manager dashboard + escalation) works cleanly
- [ ] End-to-end demo run: Act 3 (technician voice + status update) works cleanly
- [ ] Seed data tuned for demo (right states, right timing, right names)
- [ ] Loading states on all async actions (skeletons, spinners)
- [ ] Error states handled gracefully (no white screens)
- [ ] Mobile-responsive check on tenant portal (tenants may be on phone)

### Deploy
- [ ] Production env vars configured on Cloud Run
- [ ] Frontend deployed to Vercel with production API URL
- [ ] README.md written (setup + demo script)
- [ ] Record backup video of demo (in case of live demo failure)
- [ ] Final review: all hackathon requirements checklist (PRD Section 12)

## Notes
- Bug fixes identified via Playwright MCP testing of tenant + technician flows
- All 3 code fixes applied, frontend builds clean — awaiting commit

## Blockers
