# Gemini AI & Agents Skill — OPSLY

## Purpose

Defines how to build all AI agent functionality using Google ADK, Gemini Live API, and Gemini Vision.

## Architecture

```
GEMINI LIVE API SESSION
        │
        ▼
┌───────────────────┐
│  OpslyRouterAgent │  ← Classifies intent, routes to specialist
└─────────┬─────────┘
    ┌─────┴─────────────────────────────┐
    ▼           ▼            ▼          ▼         ▼
TriageAgent  StatusAgent  ScheduleAgent  EscalationAgent  AnalyticsAgent
    │           │            │          │         │
    └─────┬─────┴────────────┴──────────┘─────────┘
          ▼
   BACKEND TOOLS (REST API calls — never direct DB writes)
```

## Agent Tool Pattern

Agents NEVER write to the database directly. They call backend REST endpoints:

```typescript
{
  name: 'createWorkOrder',
  description: 'Creates a new work order for a reported maintenance issue',
  parameters: z.object({
    unitId: z.string().uuid(),
    issueCategory: z.enum(['PLUMBING', 'ELECTRICAL', 'HVAC', ...]),
    issueDescription: z.string().min(10),
    photoUrls: z.array(z.string()).optional(),
  }),
  execute: async (params) => {
    const response = await this.httpService.post('/work-orders', params, {
      headers: { Authorization: `Bearer ${serviceToken}` }
    });
    return response.data;
  }
}
```

## Gemini Vision Integration

```typescript
// POST /ai/assess-photo
// Input: base64 image with mime_type
// Output: structured AssessmentResult

interface AssessmentResult {
  damageType: string;         // 'water_leak', 'electrical', etc.
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;         // 0-1
  observations: string[];
  recommendedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  specialistRequired: boolean;
  estimatedCategory: string;  // maps to IssueCategory enum
}
```

### Priority Assignment from Vision
```
Vision HIGH + active water/gas/electrical → URGENT (2h SLA)
Vision HIGH, no immediate danger          → HIGH (4h SLA)
Vision MEDIUM or no photo                 → MEDIUM (24h SLA)
Cosmetic, aesthetic, non-functional       → LOW (72h SLA)
```

## Gemini Live API Rules

- Model: gemini-2.0-flash-live
- Supports mid-sentence interruption natively
- Session tokens expire — always handle reconnection
- Agent tool calls must complete within 5 seconds
- Never store raw audio — only transcripts
- Fallback to text chat if mic unavailable

## Agent Session Lifecycle

```
1. User clicks microphone → frontend requests session token
2. Backend creates AgentSession record (ACTIVE)
3. Backend opens Gemini Live API session with router agent config
4. Audio streams bidirectionally: browser ↔ Gemini Live
5. Agent tool calls → backend REST → database
6. WebSocket events fire → dashboards update
7. Session ends → transcript + outcome saved → AgentSession (COMPLETED)
```

## Agent Prompts

Store all system prompts in `backend/src/ai/prompts/`:
- `router-agent.prompt.ts`
- `triage-agent.prompt.ts`
- `status-agent.prompt.ts`
- `schedule-agent.prompt.ts`
- `escalation-agent.prompt.ts`
- `analytics-agent.prompt.ts`
