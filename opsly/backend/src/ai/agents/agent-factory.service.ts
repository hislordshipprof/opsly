import { Injectable } from '@nestjs/common';
import { LlmAgent } from '@google/adk';
import { OpslyToolsService } from '../tools/opsly-tools.service.js';
import { ROUTER_PROMPT } from '../prompts/router.prompt.js';
import { TRIAGE_PROMPT } from '../prompts/triage.prompt.js';
import { STATUS_PROMPT } from '../prompts/status.prompt.js';
import { SCHEDULE_PROMPT } from '../prompts/schedule.prompt.js';
import { ESCALATION_PROMPT } from '../prompts/escalation.prompt.js';
import { ANALYTICS_PROMPT } from '../prompts/analytics.prompt.js';

const MODEL = 'gemini-2.5-flash';

@Injectable()
export class AgentFactoryService {
  constructor(private readonly tools: OpslyToolsService) {}

  /** Build the full agent hierarchy: Router → 5 specialists */
  createRootAgent(): LlmAgent {
    const triageAgent = new LlmAgent({
      name: 'Triage',
      model: MODEL,
      description: 'Handles new maintenance issue reports from tenants. Collects details and creates work orders.',
      instruction: TRIAGE_PROMPT,
      tools: this.tools.triageTools,
    });

    const statusAgent = new LlmAgent({
      name: 'Status',
      model: MODEL,
      description: 'Answers questions about work order status, technician assignments, and ETAs.',
      instruction: STATUS_PROMPT,
      tools: this.tools.statusTools,
    });

    const scheduleAgent = new LlmAgent({
      name: 'Schedule',
      model: MODEL,
      description: 'Helps technicians manage their daily job queue and update work order status.',
      instruction: SCHEDULE_PROMPT,
      tools: this.tools.scheduleTools,
    });

    const escalationAgent = new LlmAgent({
      name: 'Escalation',
      model: MODEL,
      description: 'Handles SLA breaches, overdue work orders, and emergency escalations.',
      instruction: ESCALATION_PROMPT,
      tools: this.tools.escalationTools,
    });

    const analyticsAgent = new LlmAgent({
      name: 'Analytics',
      model: MODEL,
      description: 'Provides operational metrics and performance insights for managers.',
      instruction: ANALYTICS_PROMPT,
      tools: this.tools.analyticsTools,
    });

    return new LlmAgent({
      name: 'OpslyRouter',
      model: MODEL,
      description: 'Main OPSLY assistant that routes requests to specialist agents.',
      instruction: ROUTER_PROMPT,
      subAgents: [triageAgent, statusAgent, scheduleAgent, escalationAgent, analyticsAgent],
    });
  }
}
