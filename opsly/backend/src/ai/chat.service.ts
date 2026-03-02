import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InMemoryRunner, isFinalResponse } from '@google/adk';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgentFactoryService } from './agents/agent-factory.service.js';
import { AgentChannel, AgentSessionStatus, Role } from '@prisma/client';

const APP_NAME = 'opsly';

interface ChatInput {
  userId: string;
  userName: string;
  userRole: Role;
  message: string;
  sessionId?: string;
}

export interface ChatOutput {
  text: string;
  sessionId: string;
  agentName?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private runner: InMemoryRunner;

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentFactory: AgentFactoryService,
    private readonly config: ConfigService,
  ) {
    // ADK reads GOOGLE_API_KEY — bridge from our GEMINI_API_KEY
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey && !process.env.GOOGLE_API_KEY) {
      process.env.GOOGLE_API_KEY = apiKey;
    }

    const rootAgent = this.agentFactory.createRootAgent();
    this.runner = new InMemoryRunner({ agent: rootAgent, appName: APP_NAME });
    this.logger.log('ADK InMemoryRunner initialized with OpslyRouter agent');
  }

  async chat(input: ChatInput): Promise<ChatOutput> {
    const { userId, userName, userRole, message } = input;

    // 1. Find or create the Prisma session record
    const dbSession = input.sessionId
      ? await this.prisma.agentSession.findUnique({ where: { id: input.sessionId } })
      : null;

    let sessionId: string;
    if (dbSession && dbSession.status === AgentSessionStatus.ACTIVE) {
      sessionId = dbSession.id;
    } else {
      const created = await this.prisma.agentSession.create({
        data: {
          userId,
          role: userRole,
          channel: AgentChannel.CHAT,
          status: AgentSessionStatus.ACTIVE,
          transcript: [],
        },
      });
      sessionId = created.id;
      this.logger.log(`New chat session ${sessionId} for user ${userId}`);
    }

    // 2. Ensure ADK in-memory session exists with user state
    let adkSession = await this.runner.sessionService.getSession({
      appName: APP_NAME,
      userId,
      sessionId,
    });

    if (!adkSession) {
      adkSession = await this.runner.sessionService.createSession({
        appName: APP_NAME,
        userId,
        sessionId,
        state: {
          user_id: userId,
          user_role: userRole,
          user_name: userName,
        },
      });
    }

    // 3. Run the agent pipeline
    const userContent = { role: 'user' as const, parts: [{ text: message }] };
    let responseText = '';
    let lastAgentName = 'OpslyRouter';

    try {
      for await (const event of this.runner.runAsync({
        userId,
        sessionId,
        newMessage: userContent,
      })) {
        if ((event as any).errorCode) {
          this.logger.error(`ADK error: ${(event as any).errorCode} - ${(event as any).errorMessage}`);
        }

        if (isFinalResponse(event)) {
          const parts = event.content?.parts ?? [];
          const text = parts.map((p: { text?: string }) => p.text ?? '').join('');
          if (text.trim()) {
            responseText = text.trim();
          }
        }
        // Track which agent handled the request
        if (event.author && event.author !== 'user') {
          lastAgentName = event.author;
        }
      }
    } catch (err) {
      this.logger.error(`ADK runner error: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!responseText) {
      responseText = "I'm sorry, I wasn't able to process that request. Could you try again?";
    }

    // 4. Update Prisma session with transcript
    const existingSession = await this.prisma.agentSession.findUnique({
      where: { id: sessionId },
      select: { transcript: true },
    });
    const transcript = Array.isArray(existingSession?.transcript)
      ? (existingSession.transcript as Array<Record<string, unknown>>)
      : [];
    transcript.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    transcript.push({ role: 'assistant', content: responseText, agent: lastAgentName, timestamp: new Date().toISOString() });

    await this.prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        transcript: JSON.parse(JSON.stringify(transcript)),
        lastAgentName,
      },
    });

    this.logger.log(`Chat session ${sessionId}: agent=${lastAgentName}, response=${responseText.substring(0, 80)}...`);

    return { text: responseText, sessionId, agentName: lastAgentName };
  }

  async endSession(sessionId: string): Promise<void> {
    await this.prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        status: AgentSessionStatus.COMPLETED,
        endedAt: new Date(),
      },
    });
    this.logger.log(`Session ${sessionId} ended`);
  }
}
