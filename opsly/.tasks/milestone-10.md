# Milestone 10 — Demo Polish & Deploy
Status: IN_PROGRESS

## Tasks

### Bug Fixes (from Playwright PRD compliance testing)
- [x] Fix: Sign out doesn't redirect to login (useAuth.tsx) — DONE (completed: 2026-03-05)
- [x] Fix: "All clear for today" empty state never shows (TechnicianDashboardPage.tsx) — DONE (completed: 2026-03-05)
- [x] Fix: Markdown renders as raw text in voice widget (TranscriptDisplay.tsx) — DONE (completed: 2026-03-05)
- [x] Fix: Sidebar job card click (technician) — NO CODE CHANGE NEEDED, Playwright artifact (verified: 2026-03-05)

### PRD Compliance Fixes (18 issues found, 16 fixed + 1 not a bug)
- [x] C1: WO detail panel on manager row click — DONE (WorkOrderDetailPanel.tsx)
- [x] C2: Assign Technician dialog broken import — DONE (dialog.tsx radix-ui fix)
- [x] C3: Photo upload in voice widget — DONE (camera button + upload + assessment)
- [x] H1: Sign out on manager + technician dashboards — DONE
- [x] H2: WebSocket CORS + error handling — DONE (gateway origin: true)
- [x] H3: KPI Overview section on manager — DONE (KpiOverview.tsx)
- [x] H4: Tenant orders page + navigation — DONE (TenantOrdersPage.tsx)
- [x] H5: AI severity score in table + detail — DONE (AiScoreBadge.tsx)
- [x] M2: Seed data timing for demo story — DONE (relative timestamps)
- [x] M3: WO numbers WO-2840+ — DONE (matches PRD demo script)
- [x] M4: Footer year 2024 → 2026 — DONE
- [x] M5: Dual empty state on technician — DONE (remaining > 0 guard)
- [x] M6: Connection status "Offline" → "Ready" — DONE (ConnectionBadge.tsx)
- [x] L1: Technician sidebar spacing — DONE (span wrap)
- [x] L2: Login Enter key — NOT A BUG (Playwright artifact, form already correct)
- [x] M1: VoiceWidget sub-components (AudioVisualizer, AgentStatusBadge, ActionConfirmation) — DONE (completed: 2026-03-05)
- [x] L3: Filter loading states — DONE (completed: 2026-03-05)
- [x] L4: Mobile responsiveness (manager only) — DONE (completed: 2026-03-05)

### Demo Verification (Playwright E2E)
- [x] End-to-end demo run: Act 1 (tenant chat + WO creation) — VERIFIED (2026-03-05)
- [x] End-to-end demo run: Act 2 (manager dashboard + assign + escalation) — VERIFIED (2026-03-05)
- [x] End-to-end demo run: Act 3 (technician status progression + voice) — VERIFIED (2026-03-05)
- [x] Seed data tuned for demo (right states, right timing, right names) — DONE

### Deploy
- [ ] Production env vars configured on Cloud Run
- [ ] Frontend deployed to Vercel with production API URL
- [ ] README.md written (setup + demo script)
- [ ] Record backup video of demo (in case of live demo failure)
- [ ] Final review: all hackathon requirements checklist (PRD Section 12)

## Notes
- 18 PRD compliance issues identified via full Playwright E2E testing against PRD Sections 5, 11, 12, 13
- 16 fixed + 1 confirmed not a bug = 17/18 resolved
- Only 3 polish items remain (M1, L3, L4) — none block the demo
- Full issue tracker: ISSUES.md

## Blockers
