# OPSLY — AI-Powered Property Management Platform

**Voice-first. Real-time. Autonomous.**

OPSLY is a Live AI Agent platform that gives property management teams a voice-first, real-time operations command center. Tenants report maintenance issues by speaking to an AI agent. Technicians receive hands-free job briefings. Property managers watch their entire portfolio update in real-time on a single dashboard with AI-assessed severity scores, SLA tracking, and live escalation feeds.

> **Hackathon:** Google Gemini — Live Agents Category
> **Solo build** | Built with Claude Code

---

## The Problem

Small-to-mid property management companies managing 50-500 units run on phone calls, WhatsApp groups, and spreadsheets. When a tenant reports a broken boiler:

```
Tenant calls manager's phone
  → Manager texts the plumber on WhatsApp
    → Plumber says he's busy, suggests tomorrow
      → Manager calls a second plumber
        → Tenant calls again asking for update
          → Manager has no update to give
```

No tracking. No SLA. No audit trail. No AI triage. No real-time visibility.

**OPSLY fixes every link in this chain.**

---

## Demo Flow (3 minutes, 3 acts)

### Act 1 — Tenant Reports (Voice)
Sarah opens OPSLY, clicks the microphone, and describes a ceiling leak. The AI asks clarifying questions, requests a photo, runs Gemini Vision to assess severity, and creates work order `WO-2847` (Urgent, Plumbing). The manager's dashboard updates live.

### Act 2 — Manager Assigns
James sees WO-2847 appear in real-time on his command center. He views the AI damage assessment, assigns technician Mike Thompson, and acknowledges an SLA-breached escalation. Sarah receives a live notification.

### Act 3 — Technician Resolves (Voice)
Mike asks OPSLY for a hands-free briefing on his next job. The AI reads out the address, issue details, severity assessment, and tenant notes. Mike says he's 20 minutes away — Sarah's portal updates with an ETA countdown. When done, Mike says "job complete" and all dashboards update instantly.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 11 + TypeScript + Prisma ORM |
| **Database** | PostgreSQL |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| **State** | TanStack Query (server) + Zustand (UI) |
| **Real-time** | Socket.IO (WebSockets) |
| **AI — Voice** | Gemini Live API (real-time streaming, interruptible) |
| **AI — Vision** | Gemini Vision (photo damage assessment) |
| **AI — Agents** | Google ADK (multi-agent orchestration) |
| **AI — Model** | `gemini-2.5-flash` (text), `gemini-2.5-flash-native-audio` (voice) |
| **Auth** | JWT (access + refresh tokens) + RBAC guards |
| **Deploy** | Google Cloud Run (backend) + Vercel (frontend) |

---

## Architecture

### AI Agent System (Google ADK)

```
GEMINI LIVE API SESSION
        │
        ▼
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
    │           │            │          │         │
    └───────────┴────────────┴──────────┴─────────┘
                         │
                         ▼
              BACKEND TOOLS (REST API)
```

- **TriageAgent** — Collects issue details from tenants, requests photos, creates work orders via backend tool calls
- **StatusAgent** — Answers questions about work order status, technician assignments, and ETAs
- **ScheduleAgent** — Helps technicians manage their job queue, update statuses, mark jobs complete
- **EscalationAgent** — Handles SLA breaches, overdue work orders, and emergency escalations
- **AnalyticsAgent** — Provides operational metrics and performance insights for managers

Agents **never write to the database directly** — all actions go through authenticated REST endpoints.

### Real-Time Event System

Every state change propagates instantly via WebSocket to all relevant users:

| Event | Trigger | Recipients |
|-------|---------|------------|
| `workorder.created` | AI agent creates WO | Manager, Admin |
| `workorder.status_changed` | Status transition | Manager, Tenant, Technician |
| `workorder.technician_assigned` | Manager assigns tech | Manager, Tenant, Technician |
| `workorder.photo_assessed` | Gemini Vision result | Manager |
| `workorder.eta_updated` | Technician sends ETA | Manager, Tenant |
| `workorder.completed` | Job finished | Manager, Tenant |
| `escalation.triggered` | SLA breach detected | Manager, Admin |
| `metrics.snapshot_updated` | Periodic KPI refresh | Manager, Admin |

### Data Model

11 models: **User**, **Property**, **Unit**, **WorkOrder**, **WorkOrderEvent**, **AgentSession**, **TechnicianSchedule**, **ScheduleStop**, **EscalationContact**, **EscalationLog**, **ChatMessage**

---

## Features by Role

### Tenant Portal
- **Voice-first issue reporting** — speak naturally, AI creates a structured work order
- **Photo upload + AI assessment** — Gemini Vision scores damage severity automatically
- **Real-time order tracking** — status timeline, technician ETA countdown
- **Live notifications** — toast alerts when status changes, technician assigned, ETA updated
- **In-app chat** — message technicians directly on assigned work orders
- **AI insights** — Gemini-powered summary of active maintenance activity
- **Session recaps** — AI summary of recent voice conversations

### Manager Command Center
- **Live KPI dashboard** — open orders, urgent count, SLA at-risk, avg resolution time
- **Work order table** — filterable by status, priority, property, technician, with live SLA countdowns
- **One-click technician assignment** — see availability, assign from modal
- **Escalation feed** — real-time SLA breach alerts with acknowledge action
- **Technician panel** — live status of all technicians (available, on job, en route)
- **Work order detail** — full event timeline, photo gallery, AI assessment, chat

### Technician Dashboard
- **Job queue** — today's schedule with priority indicators and SLA deadlines
- **Voice briefing** — hands-free job details read by AI (address, issue, severity, tenant notes)
- **Status controls** — En Route / Arrived / Needs Parts / Escalate / Complete
- **ETA management** — send ETA to tenant with one tap (15m / 30m / 45m / 1h)
- **Completion modal** — resolution notes with structured completion flow
- **Photo lightbox** — view tenant-uploaded damage photos before arrival

---

## Project Structure

```
opsly/
├── backend/                     NestJS API + WebSocket server
│   ├── src/
│   │   ├── ai/                  Google ADK agents + Gemini Vision
│   │   │   ├── agents/          6 specialist agents (router + 5)
│   │   │   └── prompts/         Agent system prompts
│   │   ├── auth/                JWT auth + RBAC guards
│   │   ├── work-orders/         CRUD + status lifecycle
│   │   ├── schedules/           Technician job queue + ETA
│   │   ├── escalations/         SLA monitoring + auto-escalation
│   │   ├── websocket/           Socket.IO gateway + room management
│   │   ├── chat/                Work order messaging
│   │   ├── agent-sessions/      Voice/chat session tracking
│   │   ├── properties/          Building + unit management
│   │   └── users/               User management
│   └── prisma/
│       ├── schema.prisma        11 models
│       └── seed.ts              Demo data (2 properties, 8 units, 4 users)
│
├── frontend/                    React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── voice/           VoiceWidget + 7 sub-components
│   │   │   ├── dashboard/       13 manager dashboard components
│   │   │   ├── technician/      6 technician view components
│   │   │   ├── tenant/          Notification toasts
│   │   │   ├── chat/            ChatPanel + notifications
│   │   │   └── ui/              shadcn/ui base components
│   │   ├── pages/               6 page components
│   │   ├── hooks/               WebSocket, auth, voice session hooks
│   │   ├── services/            API client + query keys
│   │   └── types/               Shared TypeScript types
│   └── package.json
│
└── OPSLY_PRD.md                 Full product spec
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Google AI Studio API key ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone and install

```bash
git clone https://github.com/hislordshipprof/opsly.git
cd opsly

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/opsly
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
GEMINI_API_KEY=your-gemini-api-key
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 3. Set up database

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
npm run start:dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173`

### 5. Demo accounts (from seed data)

> These credentials work on both local and production deployments.

| Role | Email | Password |
|------|-------|----------|
| Tenant | `tenant@opsly.io` | `password123` |
| Technician | `mike@opsly.io` | `password123` |
| Technician | `james.tech@opsly.io` | `password123` |
| Manager | `sarah@opsly.io` | `password123` |
| Admin | `admin@opsly.io` | `password123` |

---

## Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | [https://frontend-theta-dusky-58.vercel.app](https://frontend-theta-dusky-58.vercel.app) |
| **Backend API** | [https://opsly-backend-632522234515.us-central1.run.app](https://opsly-backend-632522234515.us-central1.run.app) |

Use the demo accounts above to log in.

---

## Production Deployment

### Deploy Backend to Google Cloud Run

**Prerequisites:** [Google Cloud SDK](https://cloud.google.com/sdk/docs/install), a GCP project with billing enabled, a PostgreSQL database (Supabase, Cloud SQL, or Neon).

```bash
cd opsly/backend

# 1. Build and push Docker image via Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/opsly-backend

# 2. Deploy to Cloud Run
gcloud run deploy opsly-backend \
  --image gcr.io/YOUR_PROJECT_ID/opsly-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=your-postgres-url,JWT_SECRET=your-secret,JWT_REFRESH_SECRET=your-refresh-secret,GEMINI_API_KEY=your-gemini-key,FRONTEND_URL=*"

# 3. Run migrations against production database
DATABASE_URL=your-postgres-url npx prisma migrate deploy

# 4. Seed demo data
DATABASE_URL=your-postgres-url npx prisma db seed
```

The `Dockerfile` uses a multi-stage build (Node 20 Alpine) — builder installs deps and compiles TypeScript, runner copies only production artifacts.

### Deploy Frontend to Vercel

**Option A: GitHub Integration (recommended)**
1. Import `hislordshipprof/opsly` on [vercel.com](https://vercel.com)
2. Set Root Directory to `opsly/frontend`
3. Add environment variables:
   - `VITE_API_URL` = your Cloud Run backend URL
   - `VITE_WS_URL` = your Cloud Run backend URL (with `wss://` prefix)
4. Deploy — Vercel auto-builds on push to `main`

**Option B: CLI**
```bash
cd opsly/frontend
vercel --prod
```

### Production Environment Variables

**Backend (Cloud Run):**
```
DATABASE_URL          PostgreSQL connection string
JWT_SECRET            JWT signing secret
JWT_REFRESH_SECRET    Refresh token signing secret
GEMINI_API_KEY        Google AI Studio API key
FRONTEND_URL          Frontend origin for CORS (use * for hackathon)
```

**Frontend (Vercel):**
```
VITE_API_URL          Backend API URL (https://...)
VITE_WS_URL           Backend WebSocket URL (wss://...)
```

---

## Design System — Liquid Crystal

OPSLY uses a glassmorphism-inspired design with frosted glass cards over gradient backgrounds. Full light + dark mode support (follows system preference).

- **Primary**: `#2563EB` (blue-600)
- **Status colors**: Red (urgent), Amber (high), Blue (medium), Green (low)
- **Typography**: DM Sans (UI) + JetBrains Mono (codes, metrics, timestamps)
- **Cards**: Translucent with backdrop-blur, subtle inset highlights, rounded corners

---

## API Endpoints

### Auth
```
POST   /auth/register          Create account
POST   /auth/login             Get JWT tokens
POST   /auth/refresh           Refresh access token
GET    /auth/me                Current user profile
```

### Work Orders
```
POST   /work-orders                    Create (tenant or AI agent)
GET    /work-orders                    List (role-filtered)
GET    /work-orders/:orderNumber       Detail by order number
PATCH  /work-orders/:id/status         Update status
PATCH  /work-orders/:id/assign         Assign technician
GET    /work-orders/:id/events         Event timeline
POST   /work-orders/:id/photos         Upload damage photo
GET    /work-orders/metrics            Dashboard KPIs
```

### Schedules
```
GET    /schedules/my                   Technician's today schedule
PATCH  /schedules/stops/:id/status     Update stop status
PATCH  /schedules/stops/:id/eta        Send ETA to tenant
```

### Escalations
```
GET    /escalations                    List active escalations
POST   /escalations/:id/acknowledge    Acknowledge escalation
```

### AI
```
POST   /agent-sessions                 Start AI session
POST   /agent-sessions/:id/chat        Send message to AI
GET    /agent-sessions/:id             Session details
POST   /ai/assess-photo                Gemini Vision assessment
GET    /ai/insights                    AI-generated tenant insights
GET    /ai/session-recap               AI summary of recent sessions
GET    /ai/maintenance-tips            AI maintenance tips
```

### Chat
```
GET    /chat/threads                   List chat threads
GET    /chat/:workOrderId/messages     Get messages for work order
POST   /chat/:workOrderId/messages     Send message
```

---

## Google Cloud & Hackathon Compliance

| Requirement | Implementation |
|-------------|---------------|
| Gemini model | `gemini-2.5-flash` throughout |
| Gemini Live API | Tenant + Technician voice agents |
| Google ADK | Multi-agent orchestration (6 agents) |
| Gemini Vision | Photo damage assessment |
| Google Cloud service | Cloud Run (backend hosting) |
| Multimodal input | Voice (audio) + Photo (image) |
| Beyond text-in/text-out | Voice conversation + real-time dashboard |

---

## License

MIT
