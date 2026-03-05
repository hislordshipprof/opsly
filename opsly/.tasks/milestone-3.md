# Milestone 3 — Real-Time WebSockets
Status: COMPLETE

## Tasks

- [x] Install Socket.IO in NestJS backend — DONE (from M1, already in package.json)
- [x] Create WebSocket gateway (OpslyGateway) — DONE (2026-03-01)
- [x] JWT auth on WebSocket connection handshake — DONE (2026-03-01)
- [x] Channel subscription logic by role — DONE (2026-03-01)
- [x] Emit workorder.created on POST /work-orders — DONE (2026-03-01)
- [x] Emit workorder.status_changed on status update — DONE (2026-03-01)
- [x] Emit workorder.technician_assigned on assign — DONE (2026-03-01)
- [x] Emit escalation.triggered (stub — full escalation in M9) — DONE (2026-03-01)
- [ ] Frontend: install Socket.IO client — DEFERRED to M7
- [ ] Frontend: create useWebSocket hook — DEFERRED to M7
- [ ] Frontend: create useWorkOrderEvents hook — DEFERRED to M7
- [ ] Frontend: basic manager dashboard that shows live work order feed — DEFERRED to M7
- [x] Verify: events route to correct roles in real-time — DONE (2026-03-01)

## Notes
- Auth middleware (server.use) rejects unauthenticated before connect event fires
- Role-based rooms: ops:all (manager+admin), escalations, metrics:overview, tenant:{id}, technician:{id}
- WebSocketModule is @Global() so any service can inject OpslyGateway
- socket.io-client installed as devDependency for testing
- Frontend tasks deferred to M7 since React app not scaffolded yet

## Blockers
_None_
