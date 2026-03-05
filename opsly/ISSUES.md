# OPSLY — PRD Compliance Issues

> Generated: 2026-03-05 from Playwright E2E verification of all 3 demo acts
> Verified against: `OPSLY_PRD.md` Sections 5, 11, 12, 13

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL (blocks demo) | 3 |
| HIGH (degrades demo) | 5 |
| MEDIUM (noticeable gap) | 6 |
| LOW (polish) | 4 |
| **Total** | **18** |

---

## CRITICAL — Blocks Demo Flow

### C1: No work order detail panel on manager dashboard row click
- **PRD ref:** Section 13, Act 2 — "He opens the work order — sees the damage photo and Gemini Vision assessment"
- **Actual:** Clicking a work order row in the table does nothing. No side panel, modal, or navigation.
- **Impact:** Act 2 demo cannot show the photo assessment or detailed work order view from the manager's perspective.
- **File:** `frontend/src/pages/ManagerDashboardPage.tsx`
- **Fix:** Add a slide-out detail panel (similar to technician's `JobDetailPanel`) that opens when a table row is clicked. Should display: photo, Gemini Vision assessment score, full description, event timeline, and assign action.

### C2: Assign Technician button does nothing on manager dashboard
- **PRD ref:** Section 13, Act 2 — "Clicks 'Assign Technician' -> selects Mike Thompson (closest, available)"
- **Actual:** The "Assign" button in the work orders table has no click handler or dropdown. Clicking it produces no UI response.
- **Impact:** The core Act 2 demo action (assigning a technician) cannot be performed.
- **File:** `frontend/src/pages/ManagerDashboardPage.tsx`
- **Fix:** Add a dropdown/popover on the Assign button listing available technicians (from the Technicians sidebar data). On selection, call `PATCH /work-orders/:id/assign` and update the table.

### C3: No photo upload capability in tenant voice/chat widget
- **PRD ref:** Section 13, Act 1 — "Sarah uploads a photo of water-stained ceiling" + Section 11 VoiceWidget spec lists `PhotoUploadTrigger`
- **Actual:** The voice widget has no photo upload button or trigger. The agent can ask for a photo but there's no way to upload one.
- **Impact:** The multimodal demo (voice + photo) cannot be shown. This is a core hackathon requirement ("Multimodal input: Voice + Photo").
- **File:** `frontend/src/components/voice/VoiceWidget.tsx`
- **Fix:** Add a `PhotoUploadTrigger` component that appears when the agent requests a photo. Uploads to `POST /work-orders/photo-assess` and sends the result back to the chat.

---

## HIGH — Degrades Demo Experience

### H1: No sign out button on Manager and Technician dashboards
- **PRD ref:** Implied — all portals should support session management
- **Actual:** Only `TenantReportPage.tsx` has a "Sign out" button. Manager and Technician dashboards have no logout option.
- **Impact:** During demo, switching between roles requires manually clearing localStorage or navigating to `/login` directly.
- **Files:** `frontend/src/pages/ManagerDashboardPage.tsx`, `frontend/src/pages/TechnicianDashboardPage.tsx`
- **Fix:** Add a sign out button/dropdown to the user avatar area in both dashboard headers.

### H2: WebSocket shows "Offline" on tenant page, console warning on all pages
- **PRD ref:** Section 11 — "All data live via WebSocket — no page refresh needed"
- **Actual:** Tenant page shows "Offline" status indicator. Manager and Technician show "Live" but console logs `WebSocket connection to 'ws://localhost:...'` warning. The WS connection may not be fully functional.
- **Impact:** Real-time updates may not propagate during the live demo (e.g., tenant won't see "Mike is on his way").
- **Files:** `frontend/src/hooks/useWebSocket.ts`, `backend/src/websocket/`
- **Fix:** Investigate the WebSocket connection warning. Ensure tenant portal connects and subscribes to work order events.

### H3: No KPI Overview section on manager dashboard
- **PRD ref:** Section 5.3 wireframe — "Avg Response Time: 1h 42m | First-Fix Rate: 87% | SLA Compliance: 91% | Open > 24h: 2"
- **Actual:** Dashboard shows 4 KPI cards (Open, Urgent, In Progress, Completed) but no detailed KPI metrics panel.
- **Impact:** Judges won't see the operational intelligence metrics that differentiate OPSLY from a basic CRUD app.
- **File:** `frontend/src/pages/ManagerDashboardPage.tsx`
- **Fix:** Add a KPI Overview section below or alongside the work orders table showing: Avg Response Time, First-Fix Rate, SLA Compliance %, Open > 24h count.

### H4: Tenant portal has no navigation to /tenant/orders (My Work Orders)
- **PRD ref:** Section 11 routes — `/tenant/orders` (My work orders list), `/tenant/orders/:id` (Order detail + event timeline)
- **Actual:** Tenant portal only shows the voice widget on `/tenant/report`. There is no way to view existing work orders, track status, or see an event timeline.
- **Impact:** After creating a work order, the tenant has no way to check its status from the UI. The "tenant receives notification" part of Act 3 demo cannot be shown.
- **Files:** Need to create `frontend/src/pages/TenantOrdersPage.tsx`, `frontend/src/pages/TenantOrderDetailPage.tsx`
- **Fix:** Add tenant navigation (Report | My Orders) and create the orders list + detail pages.

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

### M4: Footer shows "2024" copyright year
- **Actual:** `"© 2024 OPSLY Infrastructure Systems"`
- **Fix:** Change to 2026.
- **File:** `frontend/src/pages/ManagerDashboardPage.tsx`

### M5: Technician dashboard — "All clear" and "Select a job" show simultaneously
- **Actual:** When all jobs are completed and no job is selected, both the center "Select a job to view details" empty state AND the right-side "All clear for today" message render at the same time.
- **Impact:** Looks like a layout bug — two competing empty states.
- **File:** `frontend/src/pages/TechnicianDashboardPage.tsx`
- **Fix:** When `remaining === 0`, hide the "Select a job" center panel and show only "All clear" as the main content.

### M6: Connection status indicator shows "Offline" for tenant even though chat works
- **Actual:** The VoiceWidget header shows "Offline" (green dot + "Offline" text) even when the text chat is functioning and getting AI responses.
- **Impact:** Confusing — the system works but says it's offline.
- **File:** `frontend/src/components/voice/VoiceWidget.tsx`
- **Fix:** Show "Connected" when the text chat session is active, or "Ready" when idle instead of "Offline".

---

## LOW — Polish Items

### L1: Technician sidebar shows "ESCALATED" with no space before WO number
- **Actual:** Technician panel on manager dashboard shows `ESCALATEDWO-0001` instead of `ESCALATED WO-0001`
- **File:** `frontend/src/pages/ManagerDashboardPage.tsx` (Technicians panel)
- **Fix:** Add a space or line break between status and WO number.

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

## Verified Working (Fixes Confirmed)

| Fix | Status |
|-----|--------|
| Sign out redirects to /login | CONFIRMED (tenant page) |
| "All clear for today" shows when all jobs done | CONFIRMED (technician page) |
| Markdown renders in voice transcript | NOT YET TESTED (agent didn't return markdown in this session) |
| Escalation acknowledge works | CONFIRMED (count dropped 5 -> 4) |
| Tenant text chat creates work order | CONFIRMED (WO-0012 created via chat) |
| Work order appears live on manager dashboard | CONFIRMED (WO-0012 showed immediately) |
| Technician job detail panel opens | CONFIRMED (sidebar card click works) |
| Technician voice chat responds | CONFIRMED (agent returned schedule info) |

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
