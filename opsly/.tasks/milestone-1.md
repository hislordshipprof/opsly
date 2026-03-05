# Milestone 1 — Foundation
Status: IN_PROGRESS

## Tasks

- [x] Initialize NestJS project with TypeScript strict mode — DONE (2026-02-28)
- [x] Install and configure Prisma with PostgreSQL — DONE (2026-02-28)
- [x] Create User model + enum (TENANT | TECHNICIAN | MANAGER | ADMIN) — DONE (2026-02-28)
- [x] Implement auth module (register, login, refresh, me endpoints) — DONE (2026-02-28)
- [x] Implement JWT strategy + JwtAuthGuard — DONE (2026-02-28)
- [x] Implement RolesGuard + @Roles() decorator — DONE (2026-02-28)
- [x] Create Property and Unit Prisma models — DONE (2026-02-28)
- [x] Write seed script (2 properties, 8 units, 1 user per role) — DONE (2026-02-28)
- [x] Configure .env and ConfigModule — DONE (2026-02-28)
- [ ] Dockerize backend — DEFERRED to Milestone 10
- [ ] Deploy skeleton to Google Cloud Run — DEFERRED to Milestone 10
- [x] Verify: login as each role, token contains role claim — DONE (2026-02-28)

## Notes
- Prisma downgraded to v6 (v7 has breaking schema changes, not worth for hackathon)
- Docker + Cloud Run deferred to Milestone 10 per user decision
- WorkOrder + WorkOrderEvent models included in initial schema (needed for M2)
- CallSphere auth pattern followed: controller → service → strategy → guards

## Blockers
_None_
