---
title: "Building OPSLY: Voice + Vision AI Property Management with Gemini Live API, Gemini Vision & Google ADK"
published: true
tags: google, gemini, ai, hackathon
---

Property managers running 50 to 500 units still rely on phone calls, WhatsApp groups, and spreadsheets. When a tenant reports a broken boiler, it takes five phone calls just to get a plumber scheduled. No tracking, no SLA, no visibility.

I built **OPSLY** to fix this — a multimodal AI platform combining **voice and vision** where tenants speak to report issues and upload photos for AI damage assessment, technicians get hands-free job briefings, and managers watch everything update live on one dashboard.

> *This project was created for the purposes of entering the Gemini Live Agent Challenge hackathon.*

![OPSLY Architecture](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/placeholder-architecture.png)
*Replace this with your architecture diagram screenshot*

---

## The Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript + Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Real-time | Socket.IO (WebSockets) |
| AI — Voice | **Gemini Live API** |
| AI — Vision | **Gemini Vision** |
| AI — Agents | **Google ADK** (6 agents) |
| Deploy | **Google Cloud Run** (backend) + Vercel (frontend) |

---

## How Gemini Powers Every Layer

### 1. Gemini Live API — Voice Interaction

The first core differentiator of OPSLY is that nobody types. Tenants speak naturally to an AI agent to report maintenance issues, and technicians receive hands-free job briefings while on-site. The second is that the AI can **see** — tenants upload damage photos and Gemini Vision instantly assesses severity, damage type, and confidence.

I used the **Gemini Live API** (`gemini-2.5-flash-native-audio`) for bidirectional streaming voice sessions. The key features that made this work:

- **Real-time streaming** — the tenant speaks and the AI responds conversationally, not in request/response cycles
- **Barge-in support** — tenants can interrupt the agent mid-sentence, and it handles it naturally. This is critical for a real conversation feel
- **Tool calling during voice** — while talking, the agent calls backend tools to create work orders, look up unit details, and check existing issues

Here's how the flow works:

```
Tenant speaks → Gemini Live API processes audio
  → Agent identifies intent (new issue report)
  → Agent asks clarifying questions (location, severity)
  → Agent calls createWorkOrder tool
  → Backend creates work order + emits WebSocket event
  → Manager's dashboard updates in real-time
```

The same voice architecture powers the **technician briefing** — a technician says "brief me on my next job" and the AI reads out the address, issue description, severity, and tenant notes. Completely hands-free for someone holding tools or driving.

### 2. Google ADK — Multi-Agent Orchestration

A single AI agent trying to handle everything — triage, status lookups, scheduling, escalations, analytics — would be unreliable. I used **Google ADK** to build a multi-agent system with a central router:

```
┌───────────────────┐
│  OpslyRouterAgent │  ← Classifies intent, routes to specialist
└─────────┬─────────┘
          │
    ┌─────┴──────────────────────────────────────┐
    │           │            │          │         │
    ▼           ▼            ▼          ▼         ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌───────┐ ┌─────────┐
│ Triage │ │ Status │ │ Schedule │ │Escal. │ │Analytics│
│ Agent  │ │ Agent  │ │  Agent   │ │ Agent │ │  Agent  │
└────────┘ └────────┘ └──────────┘ └───────┘ └─────────┘
```

- **TriageAgent** — Collects issue details from tenants, requests photos, creates work orders
- **StatusAgent** — Answers questions about work order status, assignments, and ETAs
- **ScheduleAgent** — Helps technicians manage their job queue and update statuses
- **EscalationAgent** — Handles SLA breaches and emergency escalations
- **AnalyticsAgent** — Provides operational metrics for managers

Each agent has a focused system prompt and its own set of backend tools. The router agent classifies the user's intent and delegates to the right specialist. This keeps each agent simple and reliable — no hallucination about capabilities it doesn't have.

**Critically, agents never write to the database directly.** Every action goes through authenticated REST endpoints. This means the same validation, RBAC guards, and audit trail that protect the API also protect agent actions.

### 3. Gemini Vision — Photo Damage Assessment

When a tenant reports an issue, the AI asks them to upload a photo. That photo goes through **Gemini Vision** (`gemini-2.5-flash`) for automated damage assessment:

```json
{
  "damageType": "water_leak",
  "severity": "HIGH",
  "confidence": 0.92,
  "description": "Active water leak from ceiling with visible water damage and staining on drywall"
}
```

This structured assessment automatically sets the work order priority. A high-severity water leak becomes URGENT and gets an aggressive SLA deadline. A cosmetic scratch stays LOW priority. The manager sees this assessment alongside the tenant's photo in the dashboard — no manual triage needed.

### 4. Google Cloud Run — Production Deployment

The NestJS backend is containerized with a multi-stage Docker build (Node 20 Alpine) and deployed to **Google Cloud Run**. This gives us:

- Auto-scaling (including scale-to-zero for cost efficiency)
- HTTPS out of the box
- WebSocket support for real-time dashboard updates
- Easy environment variable management for secrets

The deployment is automated through GitHub Actions — push to `main` triggers a build, pushes to Artifact Registry, and deploys to Cloud Run automatically.

---

## The Real-Time Architecture

What makes OPSLY feel alive is that every state change propagates instantly across all three user roles:

1. **Tenant reports** via voice → work order appears on manager's dashboard (WebSocket push)
2. **Manager assigns** technician → tenant gets notification, technician gets job in queue
3. **Technician sends ETA** → tenant sees countdown timer
4. **Technician completes job** → manager's KPIs update, tenant sees resolution

All of this happens through Socket.IO rooms filtered by role. Managers see everything. Tenants only see their own work orders. Technicians only see their assigned jobs.

---

## What I Learned

**Gemini Live API's barge-in handling is genuinely impressive.** In earlier prototypes with non-streaming approaches, interrupting the AI felt jarring. With Gemini Live, the agent naturally stops, acknowledges the interruption, and continues the conversation. This is what makes it feel like talking to a person rather than a bot.

**Multi-agent orchestration with ADK is cleaner than monolithic agents.** Each specialist agent has a small, focused prompt and a limited set of tools. The router agent's job is simple: classify intent and delegate. This separation made debugging much easier — when the schedule agent gave a wrong response, I only had to fix one prompt, not untangle a 2000-line system prompt.

**Gemini Vision for structured assessment is a time-saver.** Instead of building a custom damage classification model, Gemini Vision returns structured JSON with damage type, severity, and confidence. For a property management context, this is accurate enough to automate triage, and the confidence score lets managers know when to double-check.

---

## Try It

- **Live demo:** [https://frontend-theta-dusky-58.vercel.app](https://frontend-theta-dusky-58.vercel.app)
- **GitHub:** [https://github.com/hislordshipprof/opsly](https://github.com/hislordshipprof/opsly)

Demo accounts (all use password `password123`):
- Tenant: `tenant@opsly.io`
- Manager: `sarah@opsly.io`
- Technician: `mike@opsly.io`

---

*OPSLY was built solo using Claude Code for the Gemini Live Agent Challenge hackathon. The entire platform — backend, frontend, AI agents, voice + vision integration, and deployment — was built in under two weeks.*

*#GeminiLiveAgentChallenge*
