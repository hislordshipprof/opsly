# OPSLY — Product Requirements Document (PRD)
### AI-Powered Field Operations Platform for Property & Facilities Management
**Version:** 1.0  
**Hackathon:** Live Agents Category — Google Gemini  
**Builder:** Solo  
**Reference Codebase:** CallSphere (MultiAgentPlatform)  
**Status:** Planning

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Strategy](#3-product-vision--strategy)
4. [Users & Roles](#4-users--roles)
5. [Core Features & Scope](#5-core-features--scope)
6. [System Architecture](#6-system-architecture)
7. [Data Model](#7-data-model)
8. [AI Agent Architecture](#8-ai-agent-architecture)
9. [Real-Time Event System](#9-real-time-event-system)
10. [API Design](#10-api-design)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Google Cloud & Hackathon Compliance](#12-google-cloud--hackathon-compliance)
13. [Demo Flow](#13-demo-flow---the-3-minute-wow)
14. [Build Plan](#14-build-plan---solo-dev-milestones)
15. [CallSphere Reference Map](#15-callsphere-reference-map)
16. [Out of Scope](#16-out-of-scope)

---

## 1. Executive Summary

**OPSLY** is a Live AI Agent platform that gives property management and facilities teams a voice-first, real-time operations command center. 

Tenants report maintenance issues by talking to an AI agent — no app, no form, no phone tree. Technicians receive hands-free job briefings while driving between sites. Property managers watch their entire portfolio update in real time on a single dashboard, with AI-assessed severity scores, SLA risk alerts, and one-click escalation acknowledgment.

The platform is powered by **Gemini Live API** for real-time interruptible voice, **Google ADK** for multi-agent orchestration, **Gemini Vision** for photo-based damage assessment, and hosted on **Google Cloud Run**.

**Hackathon Category:** 🗣️ Live Agents  
**Mandatory Tech Met:**
- ✅ Gemini Live API (tenant + technician voice agents)
- ✅ Google ADK (multi-agent orchestration)
- ✅ Google Cloud Run (hosting)
- ✅ Gemini Vision (multimodal photo input)
- ✅ Gemini model throughout

---

## 2. Problem Statement

### The Reality for SMB Property Managers Today

Small-to-mid property management companies managing 50–500 units operate almost entirely on **phone calls, WhatsApp groups, and spreadsheets**. When a tenant reports a broken boiler, the chain looks like this:

```
Tenant calls manager's personal phone
  → Manager texts the plumber on WhatsApp
    → Plumber says he's busy, suggests tomorrow
      → Manager calls a second plumber
        → Tenant calls again asking for update
          → Manager has no update to give
            → Tenant posts a bad review
```

There is no tracking, no SLA, no audit trail, no AI triage, and no real-time visibility.

### Who Is Suffering and How

| Persona | Pain |
|---|---|
| **Tenant** | No easy way to report issues. No visibility on resolution progress. Feels ignored. |
| **Technician** | Gets called mid-job for status updates. No structured job briefing. Wastes time calling manager for details. |
| **Property Manager** | Drowning in reactive firefighting. No dashboard. No SLA tracking. No data for planning. |
| **Building Owner** | No real-time portfolio view. Finds out about problems from angry tenants, not from their team. |

### Why Existing Solutions Don't Work

- **Enterprise tools** (ServiceNow, IBM Maximo, Yardi) cost $50,000+/year and require IT teams to implement
- **Basic apps** (Fixflo, Maintainly) are form-based — no voice, no AI triage, no real-time ops visibility
- **WhatsApp/Slack** workflows have no structure, no escalation, no SLA enforcement, no audit trail

### The Market Opportunity

The global property management software market is worth **$22B+**, with the SMB segment almost entirely underserved by modern AI tooling. A voice-first, AI-powered ops platform at an accessible price point has a clear, large, and validated market.

---

## 3. Product Vision & Strategy

### Vision Statement
> *Give every property manager, no matter how small their team, the operational intelligence of a Fortune 500 facilities department — through the power of voice-first AI agents.*

### Strategic Pillars

**1. Voice-First, Not Voice-Added**  
OPSLY is not a traditional app that adds a voice button. Every critical workflow — issue reporting, job briefing, status updates — is designed to be completed entirely by voice. The visual dashboard is the ops layer, not the primary interface.

**2. Real-Time, Not Polling**  
Every state change propagates instantly across all connected users via WebSockets. When a tenant reports an issue, the manager's dashboard updates in under a second.

**3. AI That Acts, Not Just Answers**  
OPSLY's agents don't just respond conversationally. They create work orders, assign severity scores, trigger escalations, and log everything — using backend tools with verified data, not hallucinated responses.

**4. Built for Solo Operators**  
The product is designed so a single property manager running 100 units can use OPSLY without any IT support, training, or configuration team.

### Hackathon Positioning

OPSLY demonstrates the full power of the **Live Agents** category because:
- The voice agent is genuinely interruptible mid-sentence
- The AI orchestrates multiple specialist agents behind a single natural conversation
- Vision input (damage photo) feeds directly into agent decision-making
- The entire ops workflow updates in real time as the agent acts

---

## 4. Users & Roles

OPSLY has four roles with distinct capabilities, directly mapped from CallSphere's RBAC system.

### Role Definitions

```
TENANT
  - Reports maintenance issues via voice or chat
  - Uploads photos of damage
  - Tracks status of their open work orders
  - Receives real-time updates when their job progresses

TECHNICIAN
  - Views their assigned jobs for the day
  - Gets voice briefings on job details while in the field
  - Updates job status via voice ("job complete", "parts needed")
  - Cannot see other technicians' jobs or tenant personal details beyond job address

MANAGER
  - Full visibility across all properties and work orders
  - Manages technician assignments and schedules
  - Acknowledges escalations
  - Views SLA risk dashboard and KPI metrics
  - Configures escalation contacts and SLA thresholds

ADMIN
  - All manager capabilities
  - Manages user accounts and role assignments
  - Edits metric definitions and dashboard layouts
  - Configures property portfolio (buildings, units)
  - Full audit log access
```

### RBAC Enforcement (from CallSphere pattern)
- All REST endpoints protected by NestJS Guards checking `req.user.role`
- WebSocket channels authorized on connection — tenants only receive events for their own work orders
- Frontend hides/disables UI controls based on role stored in JWT payload

---

## 5. Core Features & Scope

### Solo Dev Scope Rule
> Every feature must be either: (a) directly reusable from CallSphere's architecture, or (b) essential for the hackathon demo. Nothing else makes the cut.

---

### Feature 5.1 — Tenant Voice & Chat Agent (THE HERO FEATURE)

**What it does:**  
Tenant opens a web widget, clicks the microphone, and speaks naturally. The Gemini Live API streams audio in real time, the agent responds conversationally, asks clarifying questions, and creates a verified work order using backend tools.

**Interaction flow:**
```
Tenant: "My bathroom ceiling has been leaking since yesterday, 
         there's water damage on the floor"

Agent:  "I'm sorry to hear that. Can you tell me which unit 
         you're in and which bathroom — main or en suite?"

Tenant: "Unit 4B, the main bathroom"

Agent:  "Got it. Can you take a quick photo of the damage 
         so our team can assess it before they arrive?"

[Tenant uploads photo]
[Gemini Vision analyzes: significant water staining, active drip visible]

Agent:  "Thanks. Based on what I can see, this looks like 
         an active leak — I've marked it as urgent priority. 
         A technician will contact you within 2 hours. 
         Your work order number is WO-2847."

[Work order WO-2847 appears on Manager dashboard in real time]
[Manager receives SLA alert: urgent, 2-hour response window started]
```

**Key capabilities:**
- Gemini Live API — real-time streaming audio, interruptible mid-sentence
- Intent classification → routes to correct specialist agent
- Photo upload → Gemini Vision severity assessment
- Work order creation via backend tool call (verified, not hallucinated)
- Real-time WebSocket push to manager dashboard
- Tenant receives work order confirmation with tracking number
- Falls back to text chat if mic not available

---

### Feature 5.2 — Technician Voice Briefing Agent

**What it does:**  
Technician logs in, clicks mic, and asks what their day looks like. The agent reads out their job queue in priority order, gives full context on each job, accepts voice status updates, and escalates if something is outside their capability.

**Interaction flow:**
```
Technician: "Hey, what jobs do I have today?"

Agent: "Good morning. You have 4 jobs today. Most urgent first: 
        Unit 4B at 12 Maple Street — active ceiling leak, 
        reported 45 minutes ago, urgent priority. The tenant 
        uploaded a photo showing significant water damage. 
        You'll need to check the unit above as well — unit 5B. 
        Special note: tenant works from home, so call ahead."

Technician: "Got it. I'm finishing up another job, 
             I'll be there in about 30 minutes."

Agent: "Understood. I'll update the tenant's ETA to 
        30 minutes and notify the manager."

[Tenant receives: "Your technician is 30 minutes away"]
[Manager dashboard: Job WO-2847 status → En Route]

[Later]
Technician: "Job done on the leak. It was a cracked pipe joint 
             in the unit above. Fixed and tested. 
             Tenant should keep an eye on the ceiling for 48 hours."

Agent: "Got it. I've marked WO-2847 as complete with your notes. 
        The tenant has been notified. Your next job is..."

[Dashboard: WO-2847 → Completed, resolution notes logged]
```

**Key capabilities:**
- Gemini Live API voice agent — hands-free, in-vehicle safe
- Reads job context including photo assessment and tenant notes
- Accepts voice status updates → writes to backend
- Updates tenant and manager via WebSocket in real time
- Suggests escalation if job requires parts, specialist, or is out of scope

---

### Feature 5.3 — Manager Command Center Dashboard

**What it does:**  
Real-time ops dashboard showing the entire property portfolio. Every work order, every technician, every SLA clock ticking. Managers see AI-assessed severity, acknowledge escalations, and get a live picture of their operation.

**Dashboard panels:**

```
┌─────────────────────────────────────────────────────────────┐
│  OPSLY Command Center                          [Admin] Sarah │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Open Orders │  Urgent (SLA)│  In Progress │  Completed Today│
│     12       │      3       │      5       │       8         │
├──────────────┴──────────────┴──────────────┴────────────────┤
│  LIVE WORK ORDERS                              [Filter ▾]    │
│  ● WO-2847  Unit 4B  URGENT  Ceiling Leak  ⏱ 1h 23m        │
│    Assigned: Mike T.  Status: En Route  SLA: 37min left      │
│  ● WO-2841  Unit 2A  HIGH    Boiler Fault  ⏱ 3h 12m        │
│    Assigned: —  Status: Unassigned  [Assign Technician]      │
│  ● WO-2839  Unit 7C  MEDIUM  Broken Lock  ⏱ 5h 01m         │
│    Assigned: Lisa K.  Status: In Progress                    │
├─────────────────────────────────────────────────────────────┤
│  ESCALATIONS                                                 │
│  ⚠️  WO-2841 breached 3-hour SLA — Unassigned urgent job    │
│     [Acknowledge]  [Assign Now]  [View Details]              │
├─────────────────────────────────────────────────────────────┤
│  TECHNICIANS TODAY                                           │
│  Mike T.    ● En Route to WO-2847    3 jobs remaining        │
│  Lisa K.    ● In Progress WO-2839    2 jobs remaining        │
│  James O.   ○ Available              0 assigned              │
├─────────────────────────────────────────────────────────────┤
│  KPI OVERVIEW                                                │
│  Avg Response Time: 1h 42m  │  First-Fix Rate: 87%          │
│  SLA Compliance: 91%        │  Open > 24h: 2                 │
└─────────────────────────────────────────────────────────────┘
```

**Key capabilities:**
- All data live via WebSocket — no page refresh needed
- AI severity score displayed per work order (from Gemini Vision + agent assessment)
- SLA countdown timers per urgent work order
- One-click escalation acknowledgment
- Technician assignment from dashboard
- KPI metrics computed from work order history
- Filterable work order queue (by property, severity, status, technician)

---

### Feature 5.4 — Escalation System (from CallSphere)

**What it does:**  
When an urgent work order breaches its SLA window without being acknowledged or assigned, the system automatically triggers an escalation ladder — notifying the right person at each level with an audit trail.

**Escalation ladder:**
```
T+0h    Work order created (URGENT)
T+2h    SLA window expires → Auto-escalation triggered
T+2h    Level 1: Notify on-call dispatcher (WebSocket + in-app)
T+2h30  No ACK → Level 2: Notify property manager
T+3h    No ACK → Level 3: Notify building owner / admin
T+3h+   Every 30min: Re-notify until ACK received
```

**Audit trail:** Every escalation event logged with timestamp, recipient, and method. Acknowledgment records who acted and when.

---

### Feature 5.5 — Work Order Lifecycle

Every work order moves through a defined state machine:

```
REPORTED → TRIAGED → ASSIGNED → EN_ROUTE → IN_PROGRESS → COMPLETED
                                                        → NEEDS_PARTS (→ back to ASSIGNED)
                                                        → ESCALATED
                                                        → CANCELLED
```

Each state transition:
- Triggers a WebSocket event to all relevant subscribers
- Sends an update to the tenant (via agent or notification)
- Logs a timestamped event in the work order history
- Recalculates SLA risk score

---

### Feature 5.6 — Photo Damage Assessment (Gemini Vision)

**What it does:**  
When a tenant uploads a photo during a voice or chat session, Gemini Vision analyzes the image and returns a structured assessment that feeds into agent decision-making.

**Assessment output:**
```json
{
  "damageType": "water_leak",
  "severity": "HIGH",
  "confidence": 0.89,
  "observations": [
    "Active water staining visible on ceiling",
    "Drip point identified at light fixture",
    "Floor damage: warped boards approximately 0.5m²"
  ],
  "recommendedPriority": "URGENT",
  "specialistRequired": false,
  "estimatedCategory": "plumbing"
}
```

This assessment:
- Sets the initial AI severity score on the work order
- Informs the agent's response to the tenant
- Is attached to the work order and visible to the technician
- Influences SLA window assignment (urgent = 2h, high = 4h, medium = 24h)

---

## 6. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Tenant Portal  │  │ Technician View  │  │ Manager Dashboard│  │
│  │  (React/TS)     │  │  (React/TS)      │  │  (React/TS)      │  │
│  │                 │  │                  │  │                  │  │
│  │ Voice Widget    │  │ Voice Widget     │  │ Live KPI Cards   │  │
│  │ Chat Fallback   │  │ Job Queue        │  │ Work Order Queue │  │
│  │ Photo Upload    │  │ Voice Status     │  │ Escalation Feed  │  │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘  │
└───────────┼────────────────────┼─────────────────────┼────────────┘
            │ HTTPS / WSS        │ HTTPS / WSS          │ HTTPS / WSS
┌───────────▼────────────────────▼─────────────────────▼────────────┐
│                      BACKEND (NestJS)                               │
│                    Google Cloud Run                                  │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │
│  │   Auth   │ │  Work    │ │  Tech    │ │Escalate│ │ Metrics  │  │
│  │  Module  │ │  Orders  │ │ Schedule │ │ Module │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │
│  │  Agent   │ │Properties│ │  Users   │ │  WebSocket Gateway  │   │
│  │ Sessions │ │  Module  │ │  Module  │ │   (Socket.IO)       │   │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    AI ORCHESTRATION LAYER                    │  │
│  │                     (Google ADK)                             │  │
│  │                                                              │  │
│  │  OpslyRouterAgent → [TriageAgent, StatusAgent,              │  │
│  │                       ScheduleAgent, EscalationAgent,       │  │
│  │                       AnalyticsAgent]                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────┬─────────────┘
                           │                          │
            ┌──────────────▼──────────┐   ┌──────────▼──────────┐
            │     PostgreSQL          │   │   Google Gemini API  │
            │  (Cloud SQL / Supabase) │   │                      │
            │                         │   │  - Live API (voice)  │
            │                         │   │  - Vision API (photo)│
            └─────────────────────────┘   │  - ADK (agents)      │
                                          └──────────────────────┘
```

### Architecture Principles (from CallSphere)
- **Backend owns all data and domain logic** — agents never write data directly, they call backend tools
- **Frontend is a thin client** — all business logic lives in NestJS modules
- **WebSocket gateway is the real-time backbone** — all state changes push to subscribers
- **RBAC enforced at every layer** — guards on REST, auth on WebSocket channels, role-gated UI

---

## 7. Data Model

### 7.1 User
```
id              UUID PK
name            string
email           string (unique)
role            enum: TENANT | TECHNICIAN | MANAGER | ADMIN
passwordHash    string
isActive        boolean
createdAt       DateTime
updatedAt       DateTime
```

### 7.2 Property
```
id              UUID PK
name            string           -- "12 Maple Street"
address         string
city            string
managerId       FK → User (MANAGER)
createdAt       DateTime
```

### 7.3 Unit
```
id              UUID PK
propertyId      FK → Property
unitNumber      string           -- "4B"
floor           int (nullable)
tenantId        FK → User (TENANT, nullable)
isOccupied      boolean
```

### 7.4 WorkOrder  ← (CallSphere: Shipment)
```
id              UUID PK
orderNumber     string unique    -- "WO-2847"
unitId          FK → Unit
propertyId      FK → Property
reportedById    FK → User (TENANT)
assignedToId    FK → User (TECHNICIAN, nullable)

issueCategory   enum: PLUMBING | ELECTRICAL | HVAC | STRUCTURAL | 
                       APPLIANCE | PEST | LOCKSMITH | OTHER
issueDescription text
status          enum: REPORTED | TRIAGED | ASSIGNED | EN_ROUTE | 
                       IN_PROGRESS | NEEDS_PARTS | COMPLETED | 
                       ESCALATED | CANCELLED

priority        enum: LOW | MEDIUM | HIGH | URGENT
aiSeverityScore float (0-1)       -- from Gemini Vision
slaDeadline     DateTime          -- computed from priority
slaBreached     boolean

photoUrls       string[]          -- uploaded damage photos
visionAssessment JSON             -- Gemini Vision output
resolutionNotes text (nullable)
completedAt     DateTime (nullable)
createdAt       DateTime
updatedAt       DateTime
```

### 7.5 WorkOrderEvent  ← (CallSphere: ShipmentScan)
```
id              UUID PK
workOrderId     FK → WorkOrder (indexed)
eventType       enum: CREATED | STATUS_CHANGED | TECHNICIAN_ASSIGNED |
                       PHOTO_UPLOADED | ETA_UPDATED | NOTE_ADDED |
                       ESCALATED | COMPLETED
actorId         FK → User (nullable)
fromStatus      enum (nullable)
toStatus        enum (nullable)
notes           text (nullable)
metadata        JSON (nullable)   -- ETA value, photo url, etc
createdAt       DateTime (indexed)
```

### 7.6 TechnicianSchedule  ← (CallSphere: Route)
```
id              UUID PK
scheduleCode    string unique     -- "SCH-2024-02-28-MIKE"
date            DateTime (indexed)
technicianId    FK → User (TECHNICIAN)
region          string
status          enum: PLANNED | ACTIVE | COMPLETED
createdAt       DateTime
```

### 7.7 ScheduleStop  ← (CallSphere: RouteStop)
```
id              UUID PK
scheduleId      FK → TechnicianSchedule (indexed)
workOrderId     FK → WorkOrder (indexed)
sequenceNumber  int
plannedEta      DateTime
actualArrival   DateTime (nullable)
status          enum: PENDING | EN_ROUTE | ARRIVED | COMPLETED | SKIPPED
notes           text (nullable)
```

### 7.8 EscalationContact  ← (CallSphere: EscalationContact)
```
id              UUID PK
userId          FK → User
propertyId      FK → Property (nullable)  -- null = global
position        int                        -- escalation ladder level
timeoutSeconds  int                        -- how long before advancing
isActive        boolean
```

### 7.9 EscalationLog  ← (CallSphere: EscalationLog)
```
id              UUID PK
workOrderId     FK → WorkOrder
contactId       FK → EscalationContact
attemptNumber   int
eventType       enum: TRIGGERED | ADVANCED | ACKNOWLEDGED | RESOLVED
payload         JSON
ackReceived     boolean
acknowledgedAt  DateTime (nullable)
acknowledgedBy  FK → User (nullable)
ackNotes        text (nullable)
createdAt       DateTime
```

### 7.10 AgentSession  ← (CallSphere: AgentSession)
```
id              UUID PK
userId          FK → User (nullable)
role            string
channel         enum: VOICE | CHAT
linkedWorkOrderId FK → WorkOrder (nullable)
geminiSessionId string               -- Gemini Live API session ID
startedAt       DateTime
endedAt         DateTime (nullable)
status          enum: ACTIVE | COMPLETED | ERROR
lastAgentName   string               -- which specialist agent was active
transcript      JSON                 -- full conversation log
outcome         JSON                 -- workOrderCreated, statusUpdated, etc
```

### 7.11 MetricDefinition  ← (CallSphere: MetricDefinition)
```
id                  UUID PK
key                 string unique     -- "avg_response_time"
name                string
aggregationType     enum: RATIO | COUNT | AVG | SUM
targetValue         float
warningThreshold    float (nullable)
criticalThreshold   float (nullable)
isVisible           boolean
createdAt           DateTime
updatedAt           DateTime
```

### 7.12 MetricSnapshot  ← (CallSphere: MetricSnapshot)
```
id              UUID PK
metricId        FK → MetricDefinition
value           float
rangeStart      DateTime
rangeEnd        DateTime
computedAt      DateTime
breakdown       JSON                  -- by property, by technician
```

---

## 8. AI Agent Architecture

### Overview

OPSLY uses **Google ADK** (Agent Development Kit) for multi-agent orchestration. All agents communicate with the backend exclusively through defined tools — they never hallucinate data writes.

The voice interface runs on **Gemini Live API**, which streams audio bidirectionally, enabling real-time interruptible conversation. The Live API session connects to the OpslyRouterAgent, which routes to specialist agents as needed.

### Agent Architecture Diagram

```
GEMINI LIVE API SESSION
        │
        ▼
┌───────────────────┐
│  OpslyRouterAgent │  ← Classifies user intent, routes to specialist
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
    └─────┬─────┴────────────┴──────────┘─────────┘
          │
          ▼
   BACKEND TOOLS (REST API calls)
   ├── createWorkOrder()
   ├── getWorkOrderStatus()
   ├── updateWorkOrderStatus()
   ├── assignTechnician()
   ├── getSchedule()
   ├── addScheduleNote()
   ├── triggerEscalation()
   ├── acknowledgeEscalation()
   ├── getMetricsOverview()
   └── assessPhoto() → Gemini Vision
```

---

### Agent 1: OpslyRouterAgent

**Role:** Entry point for all voice and chat sessions. Classifies intent and hands off to the right specialist.

**System Prompt (summary):**
> You are OPSLY, a friendly and efficient AI assistant for property management. You help tenants report maintenance issues, help technicians manage their day, and help managers get operational insights. Listen to what the user needs and route them to the right specialist. You are warm, professional, and concise.

**Intent classification:**
```
"my ceiling is leaking"         → TriageAgent
"where is my technician"        → StatusAgent  
"what jobs do I have today"     → ScheduleAgent
"we have an emergency at unit"  → EscalationAgent
"what's our response time"      → AnalyticsAgent
```

**Handoff pattern (from CallSphere's LogisticsRouterAgent):**
Router passes full conversation context + user role to specialist agent. Specialist completes the task and returns control to the router.

---

### Agent 2: TriageAgent  ← (CallSphere: DeliveryIssueAgent)

**Role:** Handles all new issue reporting from tenants. Collects details, triggers Gemini Vision if photo is provided, sets priority, and creates the work order.

**Tools available:**
- `getUnitByTenant(tenantId)` — confirm unit number
- `assessPhoto(imageBase64)` → calls Gemini Vision API
- `createWorkOrder({ unitId, category, description, priority, photoUrls, visionAssessment })`
- `getWorkOrderConfirmation(workOrderId)`

**Conversation goals:**
1. Identify: what is the issue?
2. Locate: which unit, which room?
3. Assess: request photo if applicable
4. Classify: issue category + AI priority
5. Confirm: read back work order details to tenant

**Priority assignment logic:**
```
Gemini Vision severity HIGH + active water/gas/electrical → URGENT (2h SLA)
Gemini Vision severity HIGH, no immediate danger         → HIGH (4h SLA)
Gemini Vision severity MEDIUM or no photo                → MEDIUM (24h SLA)
Cosmetic, aesthetic, non-functional                      → LOW (72h SLA)
```

---

### Agent 3: StatusAgent  ← (CallSphere: ShipmentTrackingAgent)

**Role:** Answers status queries from tenants ("where is my technician?", "has my issue been fixed?") and from managers ("what's the status on WO-2847?").

**Tools available:**
- `getWorkOrderByNumber(orderNumber)`
- `getWorkOrderEvents(workOrderId)`
- `getTechnicianETA(workOrderId)`
- `getOpenWorkOrdersByTenant(tenantId)`

**Response pattern:**
Reads from verified backend data only. Never estimates or guesses ETA — if no ETA is available, says so clearly and offers to notify when one is set.

---

### Agent 4: ScheduleAgent  ← (CallSphere: DeliveryChangeAgent)

**Role:** Manages the technician's day. Reads job queue, accepts voice status updates, handles reschedule requests, and updates ETAs.

**Tools available:**
- `getTechnicianSchedule(technicianId, date)`
- `getWorkOrderDetails(workOrderId)` — includes vision assessment, tenant notes
- `updateWorkOrderStatus(workOrderId, status, notes)`
- `setTechnicianETA(workOrderId, etaMinutes)`
- `flagNeedsParts(workOrderId, partsList)`
- `requestReschedule(workOrderId, reason)`

**Voice briefing pattern:**
When technician asks for their schedule, the agent:
1. Reads jobs in priority order
2. For each job: address → issue type → AI severity → tenant notes → special instructions
3. Confirms the technician's readiness to proceed
4. Listens for status updates throughout the day

---

### Agent 5: EscalationAgent  ← (CallSphere: LogisticsEscalationAgent)

**Role:** Monitors SLA breaches and triggers the escalation ladder. Also handles manual escalation requests from managers.

**Tools available:**
- `getOverduWorkOrders()` — SLA breached, unacknowledged
- `triggerEscalation(workOrderId, reason)`
- `advanceEscalation(escalationLogId)`
- `acknowledgeEscalation(escalationLogId, userId, notes)`
- `getEscalationStatus(workOrderId)`

**Background job trigger (from CallSphere's SLA scanning pattern):**
Runs every 5 minutes. Scans all open URGENT and HIGH work orders for SLA breaches. Triggers escalation automatically — agent is not required to be in an active voice session.

---

### Agent 6: AnalyticsAgent  ← (CallSphere: LogisticsAnalyticsAgent)

**Role:** Answers manager queries about operational performance using metrics data.

**Tools available:**
- `getMetricsOverview(dateRange)`
- `getMetricsByProperty(propertyId, dateRange)`
- `getMetricsByTechnician(technicianId, dateRange)`
- `getOpenWorkOrdersSummary()`

**Example queries:**
- "What's our first-time fix rate this month?"
- "Which property has the most open issues?"
- "How long does it take on average to close a plumbing issue?"

---

### Gemini Live API — Voice Session Handler

**Session lifecycle:**
```
1. User clicks microphone → frontend requests session token from backend
2. Backend creates AgentSession record (status: ACTIVE)
3. Backend opens Gemini Live API session with OpslyRouterAgent config
4. Audio streams bidirectionally: browser ↔ Gemini Live API
5. Agent tool calls → backend REST endpoints → database
6. WebSocket events fire on state changes → all dashboards update
7. Session ends → backend records transcript + outcome → AgentSession (status: COMPLETED)
```

**Interruption handling:**
Gemini Live API natively supports mid-sentence interruption. When the user speaks while the agent is responding, the agent stops and listens. No custom implementation needed.

**Fallback to chat:**
If browser does not support WebRTC audio or user declines microphone, the same agent pipeline runs in text-only mode. Same agents, same tools, same outcomes.

---

## 9. Real-Time Event System

### WebSocket Gateway (Socket.IO — from CallSphere)

**Connection auth:**
JWT verified on WebSocket handshake. Connection rejected if token invalid or expired.

**Channel subscriptions by role:**
```
TENANT     subscribes to: workorder:{workOrderId}  (only their own)
TECHNICIAN subscribes to: schedule:{technicianId}, workorder:{workOrderId}
MANAGER    subscribes to: ops:all, escalations, metrics:overview
ADMIN      subscribes to: ops:all, escalations, metrics:overview, audit
```

### Event Definitions

| Event | Triggered by | Subscribers |
|---|---|---|
| `workorder.created` | TriageAgent tool call | MANAGER, ADMIN |
| `workorder.status_changed` | ScheduleAgent, Technician update | TENANT (their order), MANAGER |
| `workorder.technician_assigned` | Manager action | TENANT, TECHNICIAN |
| `workorder.eta_updated` | ScheduleAgent | TENANT (their order) |
| `workorder.photo_assessed` | Gemini Vision tool | MANAGER |
| `workorder.completed` | ScheduleAgent tool | TENANT, MANAGER |
| `escalation.triggered` | EscalationAgent background job | MANAGER, ADMIN |
| `escalation.advanced` | EscalationAgent | MANAGER, ADMIN |
| `escalation.acknowledged` | Manager action | ADMIN |
| `metrics.snapshot_updated` | Background job (5min) | MANAGER, ADMIN |

---

## 10. API Design

### Auth
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /auth/me
```

### Work Orders
```
POST   /work-orders                    -- tenant creates (or agent tool call)
GET    /work-orders                    -- manager/admin: all; tenant: own only
GET    /work-orders/:id
PATCH  /work-orders/:id/status         -- technician/manager
PATCH  /work-orders/:id/assign         -- manager assigns technician
GET    /work-orders/:id/events         -- full event timeline
POST   /work-orders/:id/photos         -- tenant uploads damage photo
```

### Properties & Units
```
GET    /properties
POST   /properties                     -- admin only
GET    /properties/:id
GET    /properties/:id/units
GET    /units/:id
PATCH  /units/:id/tenant               -- admin assigns tenant to unit
```

### Technician Schedules
```
GET    /schedules                      -- manager: all; technician: own
POST   /schedules                      -- manager creates
GET    /schedules/:id/stops
PATCH  /schedule-stops/:id/status      -- technician updates stop
```

### Escalations
```
GET    /escalations                    -- manager/admin
POST   /escalations/:id/acknowledge   -- manager/admin
GET    /work-orders/:id/escalation     -- current escalation status
```

### Metrics
```
GET    /metrics/overview               -- manager/admin
GET    /metrics/definitions            -- admin
PATCH  /metrics/definitions/:id        -- admin only
GET    /metrics/snapshots              -- manager/admin
```

### AI / Agent Sessions
```
POST   /agent-sessions                 -- create session, get Gemini token
GET    /agent-sessions/:id             -- session details + transcript
POST   /agent-sessions/:id/end         -- close session
POST   /ai/assess-photo                -- Gemini Vision call (from agent tool)
```

---

## 11. Frontend Architecture

### Tech Stack
```
Framework:      React 18 + TypeScript
Build:          Vite
Styling:        TailwindCSS
Components:     shadcn/ui (from CallSphere)
State:          TanStack Query (server state) + Zustand (UI state)
WebSocket:      Socket.IO Client
Forms:          React Hook Form + Zod
Routing:        React Router v6
```

### Application Views

```
/login                    → Auth page (all roles)
/register                 → Tenant self-registration

/tenant                   → Tenant Dashboard
  /tenant/report          → Report issue (voice/chat widget)
  /tenant/orders          → My work orders list
  /tenant/orders/:id      → Order detail + event timeline

/technician               → Technician Dashboard
  /technician/schedule    → Today's job queue
  /technician/voice       → Voice briefing interface
  /technician/orders/:id  → Job detail view

/manager                  → Manager Command Center
  /manager/orders         → Work order queue (live)
  /manager/orders/:id     → Work order detail
  /manager/technicians    → Technician overview
  /manager/escalations    → Escalation feed
  /manager/metrics        → KPI dashboard

/admin                    → Admin Panel
  /admin/users            → User management
  /admin/properties       → Portfolio management
  /admin/metrics          → Metric definitions editor
  /admin/escalations      → Escalation contacts + ladder config
```

### Voice Widget Component

Used on both the Tenant and Technician views. Self-contained React component:

```
VoiceWidget
├── ConnectionState (idle / connecting / active / error)
├── MicButton (start/stop recording)
├── AudioVisualizer (waveform while speaking)
├── TranscriptDisplay (scrolling conversation history)
├── AgentStatusBadge (which agent is active: Triage / Status / Schedule)
├── ActionConfirmation (shows what action agent is about to take)
├── PhotoUploadTrigger (appears when agent requests a photo)
└── FallbackTextInput (if mic unavailable)
```

### Real-Time Dashboard Component

Manager's command center uses a live data approach:

```
CommandCenter
├── KPICards (WebSocket: metrics.snapshot_updated)
├── WorkOrderTable (WebSocket: workorder.*)
│   ├── SLACountdownTimer (client-side countdown from slaDeadline)
│   ├── PriorityBadge
│   ├── StatusBadge
│   └── AssignButton
├── EscalationFeed (WebSocket: escalation.*)
│   └── AcknowledgeButton
├── TechnicianStatusPanel (WebSocket: workorder.status_changed)
└── FilterBar (property, priority, status, technician)
```

---

## 12. Google Cloud & Hackathon Compliance

### Required Technology Checklist

| Requirement | Implementation | Status |
|---|---|---|
| Gemini model | Gemini 2.0 Flash (Live API) throughout | ✅ |
| Gemini Live API | Tenant + Technician voice agents | ✅ |
| Google ADK | Multi-agent orchestration (all 5 agents) | ✅ |
| Gemini Vision | Photo damage assessment in TriageAgent | ✅ |
| Google Cloud service | Cloud Run (backend hosting) | ✅ |
| Multimodal input | Voice (audio) + Photo (image) | ✅ |
| Beyond text-in/text-out | Voice conversation + real-time dashboard updates | ✅ |

### Google Cloud Services Used

**Google Cloud Run** — Backend NestJS app containerized and deployed  
**Google Cloud SQL (optional)** — Managed PostgreSQL, or use Supabase for speed  
**Google Gemini API** — Live API, Vision API, ADK all under one key  

### Deployment Architecture
```
Developer Machine
      │ docker build
      ▼
Google Artifact Registry
      │ deploy
      ▼
Google Cloud Run (Backend API + WebSocket)
      │ connects to
      ▼
Cloud SQL / Supabase (PostgreSQL)
      
Frontend → Vercel (fastest for solo hackathon deployment)
```

---

## 13. Demo Flow — The 3-Minute WOW

This is the exact sequence to run during the hackathon demo. It flows across all three user personas without stopping.

### Act 1: The Tenant (0:00 — 0:55)
*Screen: Tenant portal, Sarah's account, Unit 4B*

1. Sarah clicks the microphone on the OPSLY widget
2. **Sarah (voice):** "Hi, my bathroom ceiling has been leaking since last night, there's water damage on the floor"
3. **OPSLY (voice):** "I'm sorry Sarah, that sounds stressful. Is this in the main bathroom or the en suite?"
4. **Sarah:** "Main bathroom"
5. **OPSLY:** "Thanks. Can you take a quick photo of the damage so our team knows what they're dealing with?"
6. Sarah uploads a photo of water-stained ceiling
7. *Gemini Vision processes → severity HIGH, active drip, plumbing category*
8. **OPSLY:** "I can see an active ceiling leak — I've marked this as urgent. A technician will be in touch within 2 hours. Your reference number is WO-2847."

**Switch to split screen → Manager Dashboard**  
*Work order WO-2847 appears live. Priority: URGENT. AI Score: 0.84. Photo attached.*  
*SLA countdown starts: 2:00:00*

---

### Act 2: The Manager (0:55 — 1:45)
*Screen: Manager Command Center, James's account*

1. James sees WO-2847 appear in real time on the dashboard
2. He opens the work order — sees the damage photo and Gemini Vision assessment
3. Clicks "Assign Technician" → selects Mike Thompson (closest, available)
4. **Live:** Tenant Sarah receives "Your technician Mike has been assigned and will contact you shortly"
5. James sees the escalation feed — another work order (WO-2841) has breached SLA
6. Clicks "Acknowledge" — escalation resolved, audit trail recorded

---

### Act 3: The Technician (1:45 — 2:45)
*Screen: Technician view, Mike's account*

1. Mike clicks the microphone on his schedule view
2. **Mike (voice):** "Hey, what do I need to know about my next job?"
3. **OPSLY (voice):** "Your next job is WO-2847 — Unit 4B at 12 Maple Street. Active ceiling leak in the main bathroom. Gemini assessed it as high severity, likely a pipe joint issue in the unit above. The tenant, Sarah, works from home, so give her a call before you arrive. The unit above is 5B — you'll need roof access too."
4. **Mike:** "Got it, I'm about 20 minutes away"
5. **OPSLY:** "I've updated Sarah's ETA to 20 minutes and notified the manager"

**Live on Manager Dashboard:** WO-2847 status → En Route. ETA updated.  
**Live on Tenant Portal:** "Mike is on his way, estimated arrival in 20 minutes"

6. *[Time jump]* Mike speaks again: "Job done. It was a cracked joint in unit 5B's waste pipe. Fixed and pressure tested. Tenant should monitor ceiling for 48 hours."
7. **OPSLY:** "WO-2847 marked complete. Notes recorded. Sarah has been notified."

**Live on Manager Dashboard:** WO-2847 → Completed. KPIs update. SLA compliance: maintained.

---

### Demo Summary — What Judges See
- ✅ Gemini Live API — real, interruptible voice conversation
- ✅ Multimodal — photo uploaded mid-conversation, Vision assesses it live
- ✅ Multi-agent — router → triage → status → schedule agents all invoked
- ✅ Real-time — every agent action updates the dashboard instantly
- ✅ Real problem — immediately understandable, relatable, impactful
- ✅ Google Cloud — backend running on Cloud Run throughout

---

## 14. Build Plan — Solo Dev Milestones

### Guiding Principle
> Ship the demo flow first. Everything else is polish.

The demo flow in Section 13 is the north star. Every milestone either enables a step in that demo or makes it more impressive. Scope creep kills solo hackathon projects.

---

### Milestone 1 — Foundation (Day 1-2)
*Reference: CallSphere's auth module + Prisma setup*

- [ ] Initialize NestJS project with TypeScript
- [ ] Configure Prisma with PostgreSQL connection
- [ ] Implement User model + auth module (JWT, register, login, refresh)
- [ ] Implement RBAC guards (role-based, from CallSphere's guard pattern)
- [ ] Create Property, Unit, User seed data (2 properties, 8 units, 4 users)
- [ ] Deploy skeleton to Cloud Run (confirm GCP connectivity early)

**Done when:** Can register/login as each role, token contains role claim

---

### Milestone 2 — Work Order Core (Day 2-3)
*Reference: CallSphere's shipments + delivery-issues modules*

- [ ] WorkOrder Prisma model + migrations
- [ ] WorkOrderEvent model
- [ ] Work Orders REST API (create, read, update status, assign)
- [ ] Properties + Units REST API
- [ ] Seed: 10 work orders in various states across units
- [ ] Basic role-filtering (tenants only see own orders)

**Done when:** Can create, read, and update work orders via API

---

### Milestone 3 — Real-Time WebSockets (Day 3)
*Reference: CallSphere's WebSocket gateway + events module*

- [ ] Socket.IO gateway in NestJS
- [ ] JWT auth on WebSocket connection
- [ ] Channel subscription by role
- [ ] Emit events on work order state changes
- [ ] Frontend WebSocket client connected to manager dashboard
- [ ] Test: create work order via API → watch it appear on dashboard live

**Done when:** Dashboard updates in real time without page refresh

---

### Milestone 4 — Gemini Vision Integration (Day 3-4)
*Reference: CallSphere's AI module structure*

- [ ] `/ai/assess-photo` endpoint
- [ ] Gemini Vision API integration (multipart image → structured JSON)
- [ ] Map Vision output to WorkOrder.aiSeverityScore + priority
- [ ] Photo upload to Cloud Storage (or base64 for demo)
- [ ] Display photo + assessment on work order detail view

**Done when:** Upload a photo → get severity score → work order priority set automatically

---

### Milestone 5 — AI Agents (Google ADK) (Day 4-5)
*Reference: CallSphere's ai/ module + agent-sessions module*

- [ ] AgentSession model + API
- [ ] OpslyRouterAgent definition in Google ADK
- [ ] TriageAgent + tools (createWorkOrder, assessPhoto, getUnit)
- [ ] StatusAgent + tools (getWorkOrder, getEvents, getETA)
- [ ] ScheduleAgent + tools (getSchedule, updateStatus, setETA)
- [ ] EscalationAgent (background SLA scan + triggerEscalation tool)
- [ ] All agents verified: tool calls hit real backend endpoints

**Done when:** Can run a full text-based agent conversation that creates a real work order

---

### Milestone 6 — Gemini Live API Voice (Day 5-6)
*Reference: CallSphere's OpenAI Realtime session handler (as pattern reference)*

- [ ] Backend: create Gemini Live API session handler
- [ ] Frontend: VoiceWidget component (mic button, audio streaming, transcript)
- [ ] Connect voice session → OpslyRouterAgent → specialist agents
- [ ] Test: full voice conversation → work order created
- [ ] Handle interruptions (Gemini Live handles natively)
- [ ] Fallback to text if mic unavailable

**Done when:** Can speak to the agent and it creates a real work order with real data

---

### Milestone 7 — Manager Dashboard (Day 6)
*Reference: CallSphere's frontend ops dashboard*

- [ ] Work order live queue with WebSocket updates
- [ ] Priority badges, SLA countdown timers
- [ ] Assign technician action
- [ ] Work order detail with event timeline + photo + Vision assessment
- [ ] Escalation feed with acknowledge button
- [ ] KPI cards (open orders, urgent, avg response time)

**Done when:** Full manager demo flow works end to end

---

### Milestone 8 — Technician Voice View (Day 7)
*Reference: CallSphere's driver dashboard pattern*

- [ ] Technician schedule view
- [ ] VoiceWidget on technician view connected to ScheduleAgent
- [ ] Voice status update → WorkOrder status changes → WebSocket fires → dashboard updates
- [ ] ETA update via voice → tenant notified

**Done when:** Full technician voice demo flow works end to end

---

### Milestone 9 — Escalation System (Day 7)
*Reference: CallSphere's escalations module — most directly reusable*

- [ ] EscalationContact seed data (3-level ladder)
- [ ] Background job: scan SLA breaches every 5 minutes
- [ ] Auto-trigger escalation → WebSocket event to manager
- [ ] Acknowledge action on dashboard
- [ ] EscalationLog audit trail

**Done when:** Let a work order breach SLA → escalation appears on dashboard → acknowledge it

---

### Milestone 10 — Demo Polish & Deploy (Day 8)
- [ ] End-to-end demo run: all 3 acts in Section 13
- [ ] Seed data tuned for demo (right work orders, right states)
- [ ] UI polish: loading states, error handling, mobile-friendly
- [ ] Cloud Run production deploy + domain
- [ ] README with demo script + setup instructions
- [ ] Record backup video of demo (in case of live demo issues)

---

### Daily Schedule (Solo Dev)
```
Day 1:   Milestone 1 (Foundation)
Day 2:   Milestone 2 (Work Orders)
Day 3:   Milestone 3 + start 4 (WebSockets + Vision)
Day 4:   Milestone 4 + start 5 (Vision + Agents text)
Day 5:   Milestone 5 (All agents working in text)
Day 6:   Milestone 6 + 7 (Voice + Manager Dashboard)
Day 7:   Milestone 7 + 8 + 9 (Polish all flows)
Day 8:   Milestone 10 (Demo prep + deploy)
```

---

## 15. CallSphere Reference Map

Use this table whenever you're building a module to know exactly where to look in CallSphere for a proven pattern.

| OPSLY Module | CallSphere Reference | What to copy | What to change |
|---|---|---|---|
| Auth + RBAC | `backend/src/auth/` | Guard structure, JWT strategy, role decorators | Nothing — copy exactly |
| Work Orders | `backend/src/shipments/` | Module structure, service pattern, Prisma queries | Domain fields: shipment → workOrder, all logistics fields |
| Work Order Events | `backend/src/shipment-scans/` | Event logging pattern, indexed queries | scanType → eventType enum |
| Properties/Units | `backend/src/routes/` | Module structure | Completely different domain — use only as NestJS pattern |
| Technician Schedule | `backend/src/routes/` + `route-stops/` | Stop sequencing, status enum | route → schedule, stop → scheduleStop |
| Escalations | `backend/src/escalations/` | **Copy almost entirely** — ladder logic, ACK pattern, log structure | escalationContact property scope |
| Metrics | `backend/src/metrics/` | **Copy almost entirely** — snapshot pattern, KPI computation | Metric keys renamed to OPSLY KPIs |
| WebSocket Gateway | `backend/src/events/` | **Copy almost entirely** — gateway setup, auth, channel pattern | Event names, channel names |
| Agent Sessions | `backend/src/agent-sessions/` | Session model, transcript logging, outcome JSON | geminiSessionId instead of openAiSessionId |
| AI Module | `backend/src/ai/` | Module structure, tool definition pattern | Replace OpenAI SDK → Google ADK entirely |
| Frontend Dashboard | `frontend/src/pages/` | Layout structure, component organization | All domain components rebuilt |
| Frontend Voice Widget | `frontend/src/components/` (voice) | Component lifecycle, mic handling pattern | Replace OpenAI Realtime → Gemini Live API |
| Seed Script | `backend/prisma/seed.ts` | Seeding pattern, relationships, demo data approach | All model names + demo scenario |

---

## 16. Out of Scope

The following are explicitly excluded to keep the solo build achievable:

| Feature | Why excluded | Future consideration |
|---|---|---|
| SMS/Email notifications to tenants | Requires Twilio/SendGrid setup, not essential for demo | Post-hackathon |
| Native mobile app for technicians | React web on mobile is sufficient for demo | React Native post-hackathon |
| Google Maps technician routing | Adds complexity without demo impact | Show static ETA instead |
| Tenant self-registration flow | Seed demo accounts instead | Post-hackathon |
| Invoice / billing module | Out of product scope for MVP | Post-hackathon |
| Multi-language voice support | English only for hackathon | Gemini supports multilingual post-hackathon |
| Offline mode for technicians | PWA caching adds scope | Post-hackathon |
| AI predictive maintenance | Requires historical data pipeline | Post-hackathon |
| Complex dashboard customization | Fixed layout sufficient for demo | Admin config post-hackathon |
| Recurring maintenance scheduling | Not in demo flow | Post-hackathon |

---

*Document version 1.0 — OPSLY PRD*  
*Built for Google Gemini Hackathon — Live Agents Category*  
*Reference: CallSphere MultiAgentPlatform*
