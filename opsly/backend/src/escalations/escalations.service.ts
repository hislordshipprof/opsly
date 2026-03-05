import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OpslyGateway } from '../websocket/opsly.gateway.js';
import { EscalationEventType, Priority, WorkOrderStatus } from '@prisma/client';

/** SLA thresholds by priority (in milliseconds) */
const SLA_THRESHOLDS: Partial<Record<Priority, number>> = {
  URGENT: 2 * 60 * 60 * 1000,  // 2 hours
  HIGH:   4 * 60 * 60 * 1000,  // 4 hours
};

@Injectable()
export class EscalationsService {
  private readonly logger = new Logger(EscalationsService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: OpslyGateway,
  ) {}

  /** Scan for SLA-breached work orders and trigger escalations */
  async scanAndEscalate() {
    const now = new Date();

    // Find URGENT/HIGH orders that are overdue + not completed/cancelled + not already escalated
    const breachedOrders = await this.prisma.workOrder.findMany({
      where: {
        priority: { in: ['URGENT', 'HIGH'] },
        slaDeadline: { lt: now },
        slaBreached: false,
        status: { notIn: ['COMPLETED', 'CANCELLED', 'ESCALATED'] },
      },
      select: { id: true, orderNumber: true, priority: true, slaDeadline: true, reportedById: true },
    });

    for (const wo of breachedOrders) {
      // Mark SLA as breached
      await this.prisma.workOrder.update({
        where: { id: wo.id },
        data: { slaBreached: true },
      });

      // Check if ANY escalation already exists for this order (prevents re-triggering)
      const existing = await this.prisma.escalationLog.findFirst({
        where: { workOrderId: wo.id },
      });

      if (!existing) {
        await this.triggerEscalation(wo.id, wo.reportedById);
        this.logger.warn(`SLA breached for ${wo.orderNumber} (${wo.priority}) — escalation triggered`);
      }
    }

    // Advance any unacknowledged escalations past their timeout
    await this.advanceTimedOutEscalations();

    return { scanned: breachedOrders.length };
  }

  /** Trigger a new escalation for a work order (Level 1) */
  async triggerEscalation(workOrderId: string, tenantUserId: string) {
    const firstContact = await this.prisma.escalationContact.findFirst({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!firstContact) {
      this.logger.error('No escalation contacts configured — cannot escalate');
      return null;
    }

    const log = await this.prisma.escalationLog.create({
      data: {
        workOrderId,
        contactId: firstContact.id,
        attemptNumber: 1,
        eventType: EscalationEventType.TRIGGERED,
        reason: 'SLA breached — auto-escalation',
      },
      include: {
        workOrder: { select: { id: true, orderNumber: true, priority: true, status: true } },
        contact: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    // Update work order status
    await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: WorkOrderStatus.ESCALATED },
    });

    // Log event
    await this.prisma.workOrderEvent.create({
      data: {
        workOrderId,
        eventType: 'ESCALATED',
        toStatus: WorkOrderStatus.ESCALATED,
        notes: `Escalated to ${firstContact.label} (${firstContact.user.name})`,
      },
    });

    this.gateway.emitEscalationTriggered(log as unknown as Record<string, unknown>);
    return log;
  }

  /** Advance timed-out escalations to the next contact in the ladder */
  private async advanceTimedOutEscalations() {
    const now = new Date();

    const unacked = await this.prisma.escalationLog.findMany({
      where: {
        ackReceived: false,
        eventType: { in: ['TRIGGERED', 'ADVANCED'] },
      },
      include: { contact: true, workOrder: { select: { id: true, orderNumber: true, reportedById: true } } },
    });

    for (const log of unacked) {
      const elapsed = now.getTime() - log.createdAt.getTime();
      if (elapsed < log.contact.timeoutSeconds * 1000) continue;

      // Find next contact in ladder
      const nextContact = await this.prisma.escalationContact.findFirst({
        where: { isActive: true, position: { gt: log.contact.position } },
        orderBy: { position: 'asc' },
        include: { user: { select: { name: true, email: true } } },
      });

      if (!nextContact) continue; // Already at highest level

      // Prevent duplicate: check if next level already exists for this WO
      const alreadyAtNextLevel = await this.prisma.escalationLog.findFirst({
        where: { workOrderId: log.workOrderId, contactId: nextContact.id },
      });
      if (alreadyAtNextLevel) {
        // Still mark source as superceded even if next level already exists
        if (!log.ackReceived) {
          await this.prisma.escalationLog.update({
            where: { id: log.id },
            data: { ackReceived: true, eventType: EscalationEventType.RESOLVED },
          });
        }
        continue;
      }

      const advanced = await this.prisma.escalationLog.create({
        data: {
          workOrderId: log.workOrderId,
          contactId: nextContact.id,
          attemptNumber: log.attemptNumber + 1,
          eventType: EscalationEventType.ADVANCED,
          reason: `Advanced from Level ${log.contact.position} — no acknowledgment after ${log.contact.timeoutSeconds}s`,
        },
        include: {
          workOrder: { select: { id: true, orderNumber: true, priority: true, status: true } },
          contact: { include: { user: { select: { name: true, email: true } } } },
        },
      });

      // Mark the source entry as superceded so it no longer shows as active
      await this.prisma.escalationLog.update({
        where: { id: log.id },
        data: { ackReceived: true, eventType: EscalationEventType.RESOLVED },
      });

      this.gateway.emitEscalationAdvanced(advanced as unknown as Record<string, unknown>);
      this.logger.warn(`Escalation advanced for ${log.workOrder.orderNumber} → Level ${nextContact.position} (${nextContact.label})`);
    }
  }

  /** Acknowledge an escalation */
  async acknowledge(escalationLogId: string, userId: string, notes?: string) {
    const log = await this.prisma.escalationLog.findUnique({
      where: { id: escalationLogId },
      include: { workOrder: { select: { id: true, orderNumber: true, reportedById: true } } },
    });

    if (!log) throw new NotFoundException(`Escalation log ${escalationLogId} not found`);

    const updated = await this.prisma.escalationLog.update({
      where: { id: escalationLogId },
      data: {
        ackReceived: true,
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
        ackNotes: notes,
        eventType: EscalationEventType.ACKNOWLEDGED,
      },
      include: {
        workOrder: { select: { id: true, orderNumber: true, priority: true, status: true } },
        contact: { include: { user: { select: { name: true, email: true } } } },
        acknowledgedBy: { select: { name: true, email: true } },
      },
    });

    // Also mark any other open escalations for this WO as resolved
    await this.prisma.escalationLog.updateMany({
      where: {
        workOrderId: log.workOrderId,
        id: { not: escalationLogId },
        ackReceived: false,
      },
      data: { ackReceived: true, eventType: EscalationEventType.RESOLVED },
    });

    this.gateway.emitEscalationAcknowledged(updated as unknown as Record<string, unknown>);
    this.logger.log(`Escalation for ${log.workOrder.orderNumber} acknowledged by user ${userId}`);
    return updated;
  }

  /** List active (unacknowledged) escalations for the dashboard */
  async findActive() {
    return this.prisma.escalationLog.findMany({
      where: { ackReceived: false },
      include: {
        workOrder: {
          select: {
            id: true, orderNumber: true, priority: true, status: true,
            issueCategory: true, issueDescription: true,
            slaDeadline: true, slaBreached: true,
            unit: { select: { unitNumber: true, property: { select: { name: true, address: true } } } },
            assignedTo: { select: { name: true } },
          },
        },
        contact: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** List all escalation logs for a specific work order */
  async findByWorkOrder(workOrderId: string) {
    return this.prisma.escalationLog.findMany({
      where: { workOrderId },
      include: {
        contact: { include: { user: { select: { name: true } } } },
        acknowledgedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
