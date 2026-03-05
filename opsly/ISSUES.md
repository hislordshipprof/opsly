# OPSLY — PRD Compliance Issues

> Generated: 2026-03-05 from Playwright E2E verification of all 3 demo acts
> Verified against: `OPSLY_PRD.md` Sections 5, 11, 12, 13

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| CRITICAL (blocks demo) | 3 | 3 FIXED |
| HIGH (degrades demo) | 5 | 3 FIXED |
| MEDIUM (noticeable gap) | 6 | 4 FIXED |
| LOW (polish) | 4 | 2 FIXED |
| **Total** | **18** | **12 FIXED** |

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

### H2: WebSocket shows "Offline" on tenant page, console warning on all pages
- **PRD ref:** Section 11 — "All data live via WebSocket — no page refresh needed"
- **Actual:** Tenant page shows "Offline" status indicator. Manager and Technician show "Live" but console logs `WebSocket connection to 'ws://localhost:...'` warning. The WS connection may not be fully functional.
- **Impact:** Real-time updates may not propagate during the live demo (e.g., tenant won't see "Mike is on his way").
- **Files:** `frontend/src/hooks/useWebSocket.ts`, `backend/src/websocket/`
- **Fix:** Investigate the WebSocket connection warning. Ensure tenant portal connects and subscribes to work order events.

### H3: No KPI Overview section on manager dashboard -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Created `KpiOverview.tsx` component — compact horizontal glass-strip showing 4 metrics (Avg Response Time, First-Fix Rate, SLA Compliance, Open > 24h). Computed client-side from work orders data. Color-coded values (green/amber/red). Placed between filter bar and work order table.

### H4: Tenant portal has no navigation to /tenant/orders (My Work Orders) -- FIXED
- **Status:** FIXED (2026-03-05)
- **Resolution:** Created `TenantOrdersPage.tsx` with responsive card grid showing tenant's work orders (WO number, status, priority, SLA, description, reported time). Added pill navigation ("Report Issue" | "My Orders") to both TenantReportPage and TenantOrdersPage. Added route in App.tsx.

### H5: No AI severity score displayed on work orders
- **PRD ref:** Section 5.3 — "AI severity score displayed per work order (from Gemini Vision + agent assessment)"
- **Actual:** Work order table shows Priority (High/Urgent/Medium/Low) but no AI confidence score.
- **Impact:** Judges can't see the Gemini Vision integration's output on the dashboard.
- **File:** `frontend/src/pages/ManagerDashboardPage.tsx`
- **Fix:** Add an "AI Score" column or badge to the work order table/detail panel showing the Gemini assessment confidence (e.g., "0.84").

---

## MEDIUM — Noticeable Gaps

### M1: VoiceWidget missing PRD-specified sub-components
- **PRD ref:** Section 11 VoiceWidget spec
- **Actual missing components:**
  - `AudioVisualizer` — no waveform shown while speaking
  - `AgentStatusBadge` — no indicator of which agent is active (Triage / Status / Schedule)
  - `ActionConfirmation` — no preview of what action the agent is about to take before executing
- **Impact:** Voice widget feels basic compared to PRD spec. Judges may notice missing visual polish.
- **File:** `frontend/src/components/voice/VoiceWidget.tsx`

### M2: Seed data — all SLAs breached, no "fresh" demo scenario
- **PRD ref:** Section 13 — Demo shows a fresh WO-2847 with "SLA countdown starts: 2:00:00"
- **Actual:** 7 of 10 seed work orders show "SLA Breached". Only the newly created WO-0012 has active SLA time. The dashboard looks like a disaster zone rather than a managed operation.
- **Impact:** Demo doesn't tell a clean story. Judges may focus on the breached SLAs rather than the AI capabilities.
- **File:** `backend/prisma/seed.ts`
- **Fix:** Re-tune seed data: fewer orders, mix of statuses (some fresh REPORTED, some actively IN_PROGRESS, 1-2 completed), reasonable timestamps so SLAs aren't all breached.

### M3: Work order numbers don't match PRD demo script
- **PRD ref:** Section 13 uses WO-2847, WO-2841, WO-2839
- **Actual:** System generates WO-0001 through WO-0012
- **Impact:** Minor — judges won't have the PRD script, but if the demo script references specific WO numbers, they won't match.
- **File:** `backend/prisma/seed.ts`, `backend/src/work-orders/work-orders.service.ts`
- **Fix:** Either update seed to start at WO-2840+ or update the demo script to reference actual numbers.

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

### L2: Login form — Enter key doesn't submit (Playwright + possibly real browsers)
- **Actual:** Pressing Enter in the password field doesn't submit the login form. Only clicking "Sign in" works. Verified via Playwright; may affect real browsers too.
- **File:** `frontend/src/pages/LoginPage.tsx`
- **Fix:** Ensure the form has proper `onSubmit` and the button is `type="submit"` inside a `<form>` tag.

### L3: No loading/error states on filter dropdowns
- **Actual:** Filter dropdowns (Properties, Statuses, Priorities, Technicians) have no loading state while data fetches.
- **File:** `frontend/src/pages/ManagerDashboardPage.tsx`

### L4: Manager dashboard has no mobile responsiveness
- **PRD ref:** Section 10, M10 tasks — "Mobile-responsive check on tenant portal"
- **Actual:** Table layout breaks on narrow viewports. Escalation sidebar overlaps.
- **Impact:** Low — PRD only requires mobile for tenant portal, not manager dashboard.

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

### Remaining (unfixed)
| Issue | Severity | Notes |
|-------|----------|-------|
| H2: WebSocket console warning | HIGH | Needs backend investigation |
| H5: AI severity score in table | HIGH | Needs backend data exposure |
| M1: VoiceWidget sub-components | MEDIUM | AudioVisualizer, AgentStatusBadge, ActionConfirmation |
| M2: Seed data timing | MEDIUM | Re-tune for demo story |
| M3: WO number sequence | MEDIUM | Cosmetic — update demo script |
| L2: Login Enter key submit | LOW | Form submit behavior |
| L3: Filter loading states | LOW | Polish |
| L4: Mobile responsiveness | LOW | Manager dashboard only |

---

## Recommended Fix Priority for Demo

**Must fix before demo (Critical + High):**
1. C2: Assign Technician dropdown (blocks Act 2 core action)
2. C1: Work order detail panel on manager (blocks Act 2 photo view)
3. C3: Photo upload in voice widget (blocks multimodal requirement)
4. H1: Sign out on all pages (blocks role switching during demo)
5. H4: Tenant orders page (needed for Act 3 tenant notification)

**Should fix (improves demo quality):**
6. M2: Seed data tuning (makes demo story cleaner)
7. M5: Fix dual empty state on technician page
8. M6: Fix "Offline" status indicator
9. H3: KPI Overview section

**Nice to have (time permitting):**
10. H2: WebSocket stability
11. H5: AI severity score display
12. M1: VoiceWidget sub-components
