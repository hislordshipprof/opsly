# OPSLY — PRD Compliance Issues

> Generated: 2026-03-05 from Playwright E2E verification of all 3 demo acts
> Verified against: `OPSLY_PRD.md` Sections 5, 11, 12, 13

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| CRITICAL (blocks demo) | 3 | 3 FIXED |
| HIGH (degrades demo) | 5 | 5 FIXED |
| MEDIUM (noticeable gap) | 6 | 6 FIXED + 1 FIXED (M1) |
| LOW (polish) | 4 | 4 FIXED (1 not a bug) |
| **Total** | **18** | **18/18 RESOLVED (17 FIXED + 1 NOT A BUG)** |

---

## CRITICAL — Blocks Demo Flow

### C1: No work order detail panel on manager dashboard row click -- FIXED
- **PRD ref:** Section 13, Act 2 — "He opens the work order — sees the damage photo and Gemini Vision assessment"
- **Status:** FIXED (2026-03-05)
- **Resolution:** Created `WorkOrderDetailPanel.tsx` — slide-out overlay panel (480px, glass-card-heavy) showing WO details, photos, AI assessment score, tenant info, SLA countdown, activity timeline. Integrated into ManagerDashboardPage via Zustand store state.

### C2: Assign Technician button does nothing on manager dashboard -- FIXED
- **PRD ref:** Section 13, Act 2 — "Clicks 'Assign Technician' -> selects Mike Thompson (closest, available)"
- **Status:** FIXED (2026-03-05)
- **Resolution:** Root cause was broken import in `dialog.tsx` — was importing from `"radix-ui"` instead of `"@radix-ui/react-dialog"`. The AssignTechnicianModal component was already fully implemented but couldn't render. Fixed the import; modal now opens with technician list, workload indicators, and assign action.

### C3: No photo upload capability in tenant voice/chat widget -- FIXED
- **PRD ref:** Section 13, Act 1 — "Sarah uploads a photo of water-stained ceiling" + Section 11 VoiceWidget spec lists `PhotoUploadTrigger`
- **Status:** FIXED (2026-03-05)
- **Resolution:** Added camera button to VoiceWidget (left of mic), hidden file input, photo preview in transcript, base64 upload to backend, AI assessment result display. 4MB max file size validation. Photo button disabled until work order is created. TranscriptDisplay updated to render photo thumbnails.

---

## HIGH — Degrades Demo Experience

### H1: No sign out button on Manager and Technician dashboards -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Added sign out buttons to both Manager (below user name in header) and Technician (next to avatar) dashboards. Wired to `logout()` from useAuth hook.

### H2: WebSocket shows "Offline" on tenant page, console warning on all pages -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Fixed WebSocket gateway CORS (changed to `origin: true`), added `connect_error` handler in frontend hook, improved logging on both sides. Gateway now logs auth success/failure for debugging.

### H3: No KPI Overview section on manager dashboard -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Created `KpiOverview.tsx` component — compact horizontal glass-strip showing 4 metrics (Avg Response Time, First-Fix Rate, SLA Compliance, Open > 24h). Computed client-side from work orders data. Color-coded values (green/amber/red). Placed between filter bar and work order table.

### H4: Tenant portal has no navigation to /tenant/orders (My Work Orders) -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Created `TenantOrdersPage.tsx` with responsive card grid showing tenant's work orders (WO number, status, priority, SLA, description, reported time). Added pill navigation ("Report Issue" | "My Orders") to both TenantReportPage and TenantOrdersPage. Added route in App.tsx.

### H5: No AI severity score displayed on work orders -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Created `AiScoreBadge.tsx` component with color-coded pill (green >= 0.8, amber 0.5-0.79, red < 0.5). Added "AI Score" column to WorkOrderTable. Score also shown in WorkOrderDetail panel. Seed data updated with realistic scores (0.45-0.94).

---

## MEDIUM — Noticeable Gaps

### M1: VoiceWidget missing PRD-specified sub-components -- FIXED
- **PRD ref:** Section 11 VoiceWidget spec
- **Status:** FIXED (2026-03-05)
- **Resolution:** Created 3 sub-components: `AudioVisualizer.tsx` (5-bar animated waveform, color-coded by speaker), `AgentStatusBadge.tsx` (color-coded pill showing active agent: Triage/Status/Schedule/Maintenance/Escalation), `ActionConfirmation.tsx` (slide-in card showing tool action in progress). Added `animate-voice-bar` keyframe to index.css. Integrated all into VoiceWidget.tsx with `pendingAction` state tracking.

### M2: Seed data — all SLAs breached, no "fresh" demo scenario -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Re-tuned all 10 seed work orders with relative timestamps. Mix: 3 REPORTED (fresh, SLA counting), 2 ASSIGNED, 2 IN_PROGRESS, 2 COMPLETED (SLA met), 1 ESCALATED (SLA breached). SLA deadlines are future-dated for active orders. Added `aiSeverityScore` values to all orders.

### M3: Work order numbers don't match PRD demo script -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Updated seed data to start at WO-2840 through WO-2849, matching PRD demo script numbers (WO-2847, WO-2841, etc.).

### M4: Footer shows "2024" copyright year -- FIXED
- **Status:** FIXED (2026-03-05) — Changed to "© 2026"

### M5: Technician dashboard — "All clear" and "Select a job" show simultaneously -- FIXED
- **Status:** FIXED (2026-03-05) — Added `remaining > 0` condition to detail panel section. Now only "All clear" shows when all jobs done.

### M6: Connection status indicator shows "Offline" for tenant even though chat works -- FIXED
- **Status:** FIXED (2026-03-05) — ConnectionBadge now shows "Ready" (green) when idle, "Sending..." (amber pulse) during text send, and meaningful states for voice. Updated both ConnectionBadge.tsx and VoiceWidget.tsx.

---

## LOW — Polish Items

### L1: Technician sidebar shows "ESCALATED" with no space before WO number -- FIXED
- **Status:** FIXED (2026-03-05) — Wrapped status in separate `<span>` element in TechnicianPanel.tsx.

### L2: Login form — Enter key doesn't submit (Playwright + possibly real browsers) -- NOT A BUG
- **Status:** NOT A BUG (2026-03-05)
- **Resolution:** Investigation confirmed LoginPage already has proper `<form onSubmit>`, `type="submit"` button, and `e.preventDefault()`. The Enter-key issue was a Playwright MCP click interception artifact, not a real browser bug.

### L3: No loading/error states on filter dropdowns -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Added `isLoading` destructuring from useQuery for properties and technicians queries. Dropdown content now shows animated "Loading..." while fetching and "No properties"/"No technicians" empty states.
- **File:** `frontend/src/components/dashboard/FilterBar.tsx`

### L4: Manager dashboard has no mobile responsiveness -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** WorkOrderTable wrapped in `overflow-x-auto` for horizontal scroll on mobile. WorkOrderDetailPanel changed from fixed `w-[480px]` to `w-full sm:w-[480px]`. KpiOverview strip gets `overflow-x-auto` with `min-w-[500px]` inner for scroll. Main content padding tightened on mobile (`px-4 sm:px-6`).
- **Files:** `WorkOrderTable.tsx`, `WorkOrderDetailPanel.tsx`, `KpiOverview.tsx`, `ManagerDashboardPage.tsx`

---

## Fix Log

### Batch 0 — Pre-existing bug fixes (committed to main)
| Fix | Status |
|-----|--------|
| Sign out redirects to /login | FIXED + CONFIRMED |
| "All clear for today" empty state | FIXED + CONFIRMED |
| Markdown renders in voice transcript | FIXED |

### Batch 1 — Quick fixes (M4, M5, M6, H1, L1)
| Fix | Status |
|-----|--------|
| H1: Sign out on manager + technician | FIXED |
| M4: Footer year 2024 → 2026 | FIXED |
| M5: Dual empty state on technician | FIXED |
| M6: "Offline" → "Ready" status | FIXED |
| L1: Technician sidebar spacing | FIXED |

### Batch 2 — Critical fixes (C1, C2, C3)
| Fix | Status |
|-----|--------|
| C1: WO detail panel on manager | FIXED — new WorkOrderDetailPanel.tsx |
| C2: Assign technician dropdown | FIXED — broken Dialog import was root cause |
| C3: Photo upload in voice widget | FIXED — camera button + upload + assessment display |

### Batch 3 — High priority (H3, H4)
| Fix | Status |
|-----|--------|
| H3: KPI Overview section | FIXED — new KpiOverview.tsx |
| H4: Tenant orders page | FIXED — new TenantOrdersPage.tsx + nav pills |

### Batch 4 — Final fixes (H2, H5, M2, M3, L2)
| Fix | Status |
|-----|--------|
| H2: WebSocket CORS + error handling | FIXED |
| H5: AI severity score badge + column | FIXED |
| M2: Seed data timing for demo story | FIXED |
| M3: WO numbers WO-2840+ | FIXED |
| L2: Login Enter key | NOT A BUG (Playwright artifact) |

### Batch 5 — Final polish (M1, All Clear, L3, L4)
| Fix | Status |
|-----|--------|
| M1: VoiceWidget sub-components (AudioVisualizer, AgentStatusBadge, ActionConfirmation) | FIXED |
| Technician "All clear" not rendering after all jobs done | FIXED |
| L3: Filter dropdown loading/empty states | FIXED |
| L4: Manager dashboard mobile responsiveness | FIXED |

### ALL ISSUES RESOLVED
No remaining unfixed issues. 17 fixed + 1 confirmed not a bug = 18/18 resolved.
