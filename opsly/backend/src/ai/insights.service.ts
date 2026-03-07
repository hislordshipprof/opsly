import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private readonly model;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY', '');
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /** Generate actionable maintenance tips based on issue details */
  async getMaintenanceTips(issueCategory: string, issueDescription: string): Promise<string> {
    try {
      const result = await this.model.generateContent([{
        text: `You are a helpful property maintenance advisor. A tenant reported this issue:

Category: ${issueCategory}
Description: ${issueDescription}

Provide 2-3 short, actionable safety tips they can follow while waiting for a technician. Be specific and practical. Keep it under 80 words total. Do NOT use markdown formatting — plain text only.`,
      }]);
      return result.response.text().trim();
    } catch (err) {
      this.logger.error('Failed to generate maintenance tips', err);
      return 'Stay safe and avoid the affected area until the technician arrives.';
    }
  }

  /** Generate AI insights summary for a tenant's unit */
  async getTenantInsights(tenantId: string): Promise<string> {
    const orders = await this.prisma.workOrder.findMany({
      where: { reportedById: tenantId },
      select: {
        orderNumber: true,
        issueCategory: true,
        status: true,
        priority: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (orders.length === 0) {
      return 'No maintenance history yet. Your unit is in good standing.';
    }

    const active = orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status));
    const summary = orders.map((o) => `${o.orderNumber}: ${o.issueCategory} (${o.status}, ${o.priority})`).join('; ');

    try {
      const result = await this.model.generateContent([{
        text: `You are an AI property assistant. Summarize this tenant's maintenance situation in 2-3 sentences. Be concise and helpful. Mention any patterns or urgent items. Do NOT use markdown.

Active orders: ${active.length}
Total orders: ${orders.length}
Details: ${summary}`,
      }]);
      return result.response.text().trim();
    } catch (err) {
      this.logger.error('Failed to generate tenant insights', err);
      return `You have ${active.length} active request${active.length !== 1 ? 's' : ''} out of ${orders.length} total.`;
    }
  }

  /** Generate a recap of the tenant's last AI session */
  async getSessionRecap(tenantId: string): Promise<{ recap: string; sessionAge: string } | null> {
    const session = await this.prisma.agentSession.findFirst({
      where: { userId: tenantId, status: 'COMPLETED' },
      orderBy: { endedAt: 'desc' },
      include: { linkedWorkOrder: { select: { orderNumber: true, status: true, priority: true } } },
    });

    if (!session?.transcript || !session.endedAt) return null;

    const ageMs = Date.now() - new Date(session.endedAt).getTime();
    if (ageMs > 7 * 24 * 60 * 60 * 1000) return null; // Older than 7 days — skip

    const ageHours = Math.floor(ageMs / 3_600_000);
    const sessionAge = ageHours < 1 ? 'just now' : ageHours < 24 ? `${ageHours}h ago` : `${Math.floor(ageHours / 24)}d ago`;

    const transcript = typeof session.transcript === 'string'
      ? session.transcript
      : JSON.stringify(session.transcript);

    try {
      const result = await this.model.generateContent([{
        text: `Summarize this maintenance support conversation in ONE sentence. Include the issue reported, any work order number created, and current status. Do NOT use markdown.

Transcript: ${transcript.slice(0, 2000)}
${session.linkedWorkOrder ? `Work order: ${session.linkedWorkOrder.orderNumber} (${session.linkedWorkOrder.status}, ${session.linkedWorkOrder.priority})` : ''}`,
      }]);
      return { recap: result.response.text().trim(), sessionAge };
    } catch (err) {
      this.logger.error('Failed to generate session recap', err);
      return null;
    }
  }
}
