import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgentChannel, AgentSessionStatus, Role } from '@prisma/client';

/** Tool declarations for Gemini Live — mirrors ADK tools from M5 */
const VOICE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'get_unit_by_tenant',
        description: 'Finds the unit a tenant currently occupies',
        parameters: {
          type: 'object' as const,
          properties: {
            tenant_id: { type: 'string', description: 'The tenant user ID' },
          },
          required: ['tenant_id'],
        },
      },
      {
        name: 'create_work_order',
        description: 'Creates a new maintenance work order',
        parameters: {
          type: 'object' as const,
          properties: {
            unit_id: { type: 'string', description: 'UUID of the unit' },
            issue_category: {
              type: 'string',
              enum: ['PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'PEST', 'LOCKSMITH', 'OTHER'],
              description: 'Category of the maintenance issue',
            },
            issue_description: { type: 'string', description: 'Detailed description' },
          },
          required: ['unit_id', 'issue_category', 'issue_description'],
        },
      },
      {
        name: 'get_work_order',
        description: 'Looks up a work order by order number',
        parameters: {
          type: 'object' as const,
          properties: {
            order_number: { type: 'string', description: 'e.g. WO-0001' },
          },
          required: ['order_number'],
        },
      },
      {
        name: 'get_open_work_orders',
        description: 'Lists open work orders for a user based on their role',
        parameters: {
          type: 'object' as const,
          properties: {
            user_id: { type: 'string', description: 'The user ID' },
            user_role: { type: 'string', enum: ['TENANT', 'TECHNICIAN', 'MANAGER', 'ADMIN'] },
          },
          required: ['user_id', 'user_role'],
        },
      },
      {
        name: 'get_technician_schedule',
        description: 'Gets today\'s assigned work orders for a technician',
        parameters: {
          type: 'object' as const,
          properties: {
            technician_id: { type: 'string', description: 'The technician user ID' },
          },
          required: ['technician_id'],
        },
      },
      {
        name: 'update_work_order_status',
        description: 'Updates the status of a work order',
        parameters: {
          type: 'object' as const,
          properties: {
            order_number: { type: 'string', description: 'e.g. WO-0001' },
            status: {
              type: 'string',
              enum: ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
            },
            notes: { type: 'string', description: 'Optional status update notes' },
          },
          required: ['order_number', 'status'],
        },
      },
    ],
  },
];

const VOICE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

export interface VoiceTokenResult {
  sessionId: string;
  ephemeralToken: string;
  model: string;
  systemInstruction: string;
  tools: typeof VOICE_TOOLS;
  voiceConfig: { voiceName: string };
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private genAI: GoogleGenAI | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn('GEMINI_API_KEY not set — voice sessions will fail');
    }
  }

  /** Create an ephemeral token + DB session for a voice conversation */
  async createVoiceSession(
    userId: string,
    userRole: Role,
    userName: string,
  ): Promise<VoiceTokenResult> {
    if (!this.genAI) {
      throw new BadRequestException('Voice service not configured — GEMINI_API_KEY missing');
    }

    // 1. Create DB session record
    const dbSession = await this.prisma.agentSession.create({
      data: {
        userId,
        role: userRole,
        channel: AgentChannel.VOICE,
        status: AgentSessionStatus.ACTIVE,
        transcript: [],
      },
    });

    // 2. Create ephemeral token (expires in 10 min, must connect within 2 min)
    const token = await this.genAI.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });

    this.logger.log(`Voice session ${dbSession.id} created for user ${userId} (${userRole})`);

    // 3. Build system instruction with user context
    const systemInstruction = this.buildSystemInstruction(userName, userRole, userId);

    return {
      sessionId: dbSession.id,
      ephemeralToken: (token as any).name ?? String(token),
      model: VOICE_MODEL,
      systemInstruction,
      tools: VOICE_TOOLS,
      voiceConfig: { voiceName: 'Kore' },
    };
  }

  /** Save transcript + outcome when voice session ends */
  async endVoiceSession(
    sessionId: string,
    transcript?: Array<{ role: string; content: string }>,
    outcome?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        status: AgentSessionStatus.COMPLETED,
        endedAt: new Date(),
        ...(transcript && { transcript: JSON.parse(JSON.stringify(transcript)) }),
        ...(outcome && { outcome: JSON.parse(JSON.stringify(outcome)) }),
      },
    });
    this.logger.log(`Voice session ${sessionId} ended`);
  }

  private buildSystemInstruction(userName: string, userRole: Role, userId: string): string {
    return `You are OPSLY, a friendly and efficient AI voice assistant for property management.

You are speaking with ${userName} (role: ${userRole}).

Your responsibilities based on role:
- TENANT: Help report maintenance issues, check work order status, upload photos
- TECHNICIAN: Give job briefings, accept status updates, provide ETAs
- MANAGER: Answer operational questions, provide metrics, handle escalations

Key rules:
- Be concise — this is a voice conversation, not a text chat
- Confirm important actions before executing (creating work orders, changing status)
- Always provide the work order number after creating one
- If you need a photo, ask the user to upload one through the app
- The current user's ID is "${userId}" — use this for lookups
- Never make up data — always use your tools to look up real information`;
  }
}
