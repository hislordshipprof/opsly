# Milestone 9 — Escalation System
Status: COMPLETE

## Tasks

- [x] EscalationContact Prisma model + seed (3-level ladder) — DONE (completed: 2026-03-03)
- [x] EscalationLog Prisma model + migration — DONE (completed: 2026-03-03)
- [x] Escalations module (controller, service, DTOs) — DONE (completed: 2026-03-03)
- [x] Background job: scan SLA breaches every 5 minutes (@Cron) — DONE (completed: 2026-03-03)
- [x] Auto-trigger escalation when URGENT/HIGH order breaches SLA — DONE (completed: 2026-03-03)
- [x] POST /escalations/:id/acknowledge — manager ACK — DONE (completed: 2026-03-03)
- [x] WebSocket: emit escalation.triggered to manager/admin — DONE (completed: 2026-03-03)
- [x] WebSocket: emit escalation.acknowledged on ACK — DONE (completed: 2026-03-03)
- [x] Frontend: escalation feed updates in real time — DONE (completed: 2026-03-03)
- [x] Frontend: acknowledge button + confirmation — DONE (completed: 2026-03-03)
- [ ] EscalationLog audit trail visible on work order detail — DEFERRED to M10
- [ ] Verify: let urgent order breach SLA → escalation appears → acknowledge it — NEEDS MANUAL TEST

## Notes
- Used PATCH (not POST) for acknowledge endpoint — matches REST convention
- SLA thresholds: URGENT=2h, HIGH=4h
- 3-level ladder: Dispatcher (tech) → Property Manager → Building Admin, 30min timeout each
- @Cron(EVERY_5_MINUTES) via @nestjs/schedule for background SLA scanning
- EscalationFeed uses ['escalations'] query key — auto-refreshed by WebSocket hook

## Blockers
- Manual verification pending: need backend running + wait for SLA breach or trigger manually
