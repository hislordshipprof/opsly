# Milestone 2 — Work Order Core
Status: COMPLETE

## Tasks

- [x] WorkOrder Prisma model + migration (all fields from PRD Section 7.4) — DONE (from M1 schema)
- [x] WorkOrderEvent Prisma model + migration — DONE (from M1 schema)
- [x] Work Orders module scaffold (module, controller, service, DTOs) — DONE (2026-03-01)
- [x] POST /work-orders — create (tenant or agent tool call) — DONE (2026-03-01)
- [x] GET /work-orders — list with role filtering (tenant: own only) — DONE (2026-03-01)
- [x] GET /work-orders/:id — detail with events — DONE (2026-03-01)
- [x] PATCH /work-orders/:id/status — update status with event log — DONE (2026-03-01)
- [x] PATCH /work-orders/:id/assign — assign technician (manager/admin) — DONE (2026-03-01)
- [ ] POST /work-orders/:id/photos — photo upload endpoint — DEFERRED to M4 (Gemini Vision)
- [x] Properties module (GET /properties, GET /properties/:id/units) — DONE (2026-03-01)
- [x] Units module (GET /units/:id, PATCH /units/:id/tenant) — DONE (2026-03-01)
- [x] Seed: 10 work orders in various states across units — DONE (2026-03-01)
- [x] Verify: full CRUD works, role filtering correct — DONE (2026-03-01)

## Notes
- Photo upload deferred to Milestone 4 (Gemini Vision) since it ties directly into vision assessment
- Added 2 extra tenant users (David Renter, Lisa Chen) for multi-tenant seed data
- Shared utilities created: sanitize.ts (HTML strip + trim), sla.ts (deadline computation)
- Order number generation is sequential (WO-0001..WO-XXXX) via count-based approach

## Blockers
_None_
