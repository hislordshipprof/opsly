# OPSLY Demo Script — 3:50 Total

> **IMPORTANT:** Only the first 4 minutes are evaluated. Target 3:50 to leave buffer.
> Open all 3 tabs before recording: Tenant, Manager, Technician.

---

## Pre-Recording Setup

```
Tab 1: https://frontend-theta-dusky-58.vercel.app  → Login as Emily Carter (tenant@opsly.io / password123)
Tab 2: https://frontend-theta-dusky-58.vercel.app  → Login as Sarah Manager (sarah@opsly.io / password123)
Tab 3: https://frontend-theta-dusky-58.vercel.app  → Login as Mike Thompson (mike@opsly.io / password123)
```

- Have a damage photo ready on your desktop (water leak, cracked wall, etc.)
- Test microphone works before hitting record
- Close all notifications/popups on your computer

---

## INTRO — Pitch the Problem (0:00 → 0:30)

**Show:** Landing page or title slide

**Say:**

> "Property managers running 50 to 500 units still rely on phone calls,
> WhatsApp groups, and spreadsheets. When a tenant reports a broken boiler,
> it takes five phone calls just to get a plumber scheduled.
> No tracking, no SLA, no visibility."

> "OPSLY fixes this. It's a voice-first AI platform where tenants speak
> to report issues, technicians get hands-free job briefings, and managers
> watch everything update live on one dashboard."

> "It's built with Gemini Live API for voice, Google ADK for multi-agent
> orchestration, and Gemini Vision for photo damage assessment —
> all running on Google Cloud Run."

**Judges hear:** Problem, solution, all 3 Gemini products, Cloud Run — in 30 seconds.

---

## ACT 1 — Tenant Reports an Issue (0:30 → 1:40)

**Switch to:** Tab 1 (Tenant portal)

| Time | Action | What to Say |
|------|--------|-------------|
| 0:30 | Click the microphone button | *"As a tenant, I just click the mic to talk to the AI agent."* |
| 0:35 | Speak to the agent | *"I have a leak coming from my bathroom ceiling. Water is dripping onto the floor and it's getting worse."* |
| 0:50 | Let the AI respond and ask questions | *Let it play — show it's conversational, not a form.* |
| 1:00 | **Interrupt the agent mid-sentence** | Say *"Actually, it started last night"* — cut it off to show barge-in |
| 1:05 | After interruption, say | *"Notice I just interrupted the agent mid-sentence and it handled it naturally. That's Gemini Live API."* |
| 1:10 | When agent asks for a photo, upload one | *"The agent asks for a photo. I'll upload one now."* |
| 1:20 | Photo uploads, Gemini Vision runs | *"Gemini Vision automatically assesses the damage — severity, damage type, confidence score."* |
| 1:30 | Agent confirms work order created | *"The AI created work order WO-XXXX, classified as urgent plumbing. No forms, no typing."* |

**Judges see:** Voice input, natural conversation, barge-in, photo upload, Gemini Vision, auto work order creation.

---

## ACT 2 — Manager Sees It Live (1:40 → 2:30)

**Switch to:** Tab 2 (Manager dashboard)

| Time | Action | What to Say |
|------|--------|-------------|
| 1:40 | Show the dashboard — new work order already there | *"Switching to the manager's dashboard. The work order already appeared in real-time — no refresh needed. That's WebSocket push."* |
| 1:48 | Point at KPI cards | *"KPI cards update live — open orders, urgent count, SLA at-risk."* |
| 1:55 | Click into the work order | *"I can see the AI damage assessment, the tenant's photo, severity score, and the full event timeline."* |
| 2:05 | Click Assign Technician | *"I'll assign technician Mike Thompson with one click."* |
| 2:15 | Select Mike, confirm | *"Mike gets notified instantly."* |
| 2:20 | Show escalation feed if visible | *"The escalation feed shows any SLA breaches. I can acknowledge them right from here."* |

**Judges see:** Real-time updates, live KPIs, AI assessment visible, one-click assignment, escalations.

---

## ACT 3 — Technician Resolves It (2:30 → 3:30)

**Switch to:** Tab 3 (Technician view)

| Time | Action | What to Say |
|------|--------|-------------|
| 2:30 | Show job queue — new job appeared | *"Switching to the technician. The job Mike was just assigned is already in his queue."* |
| 2:35 | Click the microphone | *"Technicians work hands-free. Mike asks for a briefing."* |
| 2:38 | Say to agent | *"Brief me on my next job"* |
| 2:45 | AI reads out job details | *"The AI reads out the address, issue description, severity, and tenant notes — completely hands-free."* |
| 2:55 | Click "En Route" button | *"Mike taps En Route."* |
| 3:00 | Send ETA (e.g., 30 min) | *"He sends a 30-minute ETA to the tenant."* |
| 3:05 | **Switch to Tab 1 (Tenant)** | *"Back on the tenant's screen — the ETA notification appeared instantly."* |
| 3:10 | **Switch back to Tab 3 (Technician)** | *"Mike arrives, completes the job, adds resolution notes."* |
| 3:15 | Click "Arrived" then "Complete" | *Fill in resolution notes, submit.* |
| 3:20 | **Switch to Tab 2 (Manager dashboard)** | *"Manager's dashboard — status updated to Completed in real-time. Full lifecycle tracked."* |

**Judges see:** Voice briefing, hands-free workflow, ETA to tenant, status lifecycle, real-time sync across all 3 roles.

---

## CLOSE — Architecture (3:30 → 3:50)

**Show:** Architecture diagram (screenshot or the HTML page)

**Say:**

> "Under the hood: six Google ADK agents route through a central orchestrator.
> Gemini Live API handles bidirectional voice, Gemini Vision handles
> photo assessment. NestJS backend deployed on Google Cloud Run,
> React frontend on Vercel, PostgreSQL on Supabase.
> Everything synced in real-time through WebSockets."

> "OPSLY — voice-first property management, powered by Gemini."

**Stop recording.**

---

## Quick Reference — What Scores Points

| What Judges Look For | Where You Show It |
|---|---|
| Breaks "text box" paradigm | Act 1 — voice, not typing |
| Agent Sees, Hears, Speaks | Act 1 — voice + photo + spoken response |
| Handles interruptions (barge-in) | Act 1 — interrupt mid-sentence |
| Distinct persona/voice | Acts 1 & 3 — OPSLY agent personality |
| Live & context-aware | Acts 2 & 3 — real-time dashboard sync |
| Google GenAI SDK / ADK usage | Close — 6 ADK agents mentioned |
| Backend on Google Cloud | Close — Cloud Run |
| Sound agent logic | Act 1 — structured intake, tool calls |
| Avoids hallucinations | Act 1 — agent uses backend, not guessing |
| Problem + solution pitched | Intro — 30 sec pitch |
| Architecture diagram shown | Close — diagram on screen |
| Actual software working | All 3 acts — live app, no mockups |

---

## If Something Goes Wrong

| Problem | Recovery |
|---|---|
| Voice won't connect | Say *"Let me use text input as fallback"* — type the message instead |
| WebSocket update is slow | Say *"Real-time updates typically appear instantly"* — refresh the page |
| Work order doesn't appear | Have a pre-existing work order to demo Act 2 and 3 with |
| Photo upload fails | Skip it, say *"Gemini Vision assessment would appear here"* — keep moving |
| Agent gives weird response | Say *"The agent grounds its responses in backend data"* — move to next act |

**Golden rule:** Never stop talking. If tech hiccups, narrate what should happen and move on.
