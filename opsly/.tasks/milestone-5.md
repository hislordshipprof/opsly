# Milestone 5 — AI Agents (Google ADK, Text Mode)
Status: COMPLETE

## Tasks

- [x] Install Google ADK SDK — DONE (2026-03-01)
- [x] Create agent-sessions module (model, controller, service) — DONE (2026-03-01)
- [x] POST /agent-sessions — handled via ChatService auto-creation — DONE (2026-03-01)
- [x] PATCH /agent-sessions/:id/end — POST /agent-sessions/:id/end — DONE (2026-03-01)
- [x] Define OpslyRouterAgent with system prompt — DONE (2026-03-01)
- [x] Define TriageAgent + tools (createWorkOrder, getUnitByTenant) — DONE (2026-03-01)
- [x] Define StatusAgent + tools (getWorkOrder, getEvents, getOpenOrders) — DONE (2026-03-01)
- [x] Define ScheduleAgent + tools (getSchedule, updateStatus, getDetail) — DONE (2026-03-01)
- [x] Define EscalationAgent + tools (getOverdue, triggerEscalation) — DONE (2026-03-01)
- [x] Define AnalyticsAgent + tools (getMetricsOverview) — DONE (2026-03-01)
- [x] Store agent prompts in /ai/prompts/ as separate files — DONE (2026-03-01)
- [x] POST /ai/chat — text-based agent conversation endpoint — DONE (2026-03-01)
- [x] Verify: endpoint returns 201, session created, ADK pipeline runs, Gemini API called — DONE (2026-03-01)

## Notes
- Using @google/adk (Agent Development Kit) with LlmAgent + FunctionTool + InMemoryRunner
- Router agent uses subAgents for automatic LLM-driven delegation (transfer_to_agent)
- Tools use Zod schemas, call NestJS services directly (same process, service-layer validation)
- User identity passed via ADK session state (user_id, user_role, user_name)
- ADK reads GOOGLE_API_KEY env var — bridged from GEMINI_API_KEY in ChatService constructor
- VisionService extracted to standalone VisionModule to break circular dependency
- 11 FunctionTools across 5 specialist agents
- Model: gemini-2.5-flash (latest flash model, supports function calling + structured output)
- Verified end-to-end: tenant chat → Router → Triage → tool calls → WO created in DB → WebSocket event emitted → natural language response

## Blockers
- None — all resolved
