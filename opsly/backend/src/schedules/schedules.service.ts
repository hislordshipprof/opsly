import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OpslyGateway } from '../websocket/opsly.gateway.js';
import { ScheduleStatus, StopStatus, WorkOrderStatus } from '@prisma/client';

/** Shared include for schedule queries — keeps both paths consistent */
const SCHEDULE_INCLUDE = {
  stops: {
    orderBy: { sequenceNumber: 'asc' as const },
    include: {
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          issueCategory: true,
          issueDescription: true,
          priority: true,
          status: true,
          aiSeverityScore: true,
          visionAssessment: true,
          photoUrls: true,
          slaDeadline: true,
          slaBreached: true,
          resolutionNotes: true,
          unit: {
            select: {
              unitNumber: true,
              floor: true,
              property: { select: { name: true, address: true } },
            },
          },
          reportedBy: { select: { name: true, email: true } },
        },
      },
    },
  },
};

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: OpslyGateway,
  ) {}

  /** Get today's schedule for a technician (with stops + work order details).
   *  Auto-generates a schedule from assigned work orders if none exists for today. */
  async getTechnicianSchedule(technicianId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));

    // 1. Look for an existing schedule for today
    const existing = await this.prisma.technicianSchedule.findFirst({
      where: {
        technicianId,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: SCHEDULE_INCLUDE,
    });

    if (existing) return existing;

    // 2. No schedule for today — auto-generate from assigned work orders
    const assignedOrders = await this.prisma.workOrder.findMany({
      where: {
        assignedToId: technicianId,
        status: { notIn: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED] },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    if (assignedOrders.length === 0) return null;

    this.logger.log(`Auto-generating schedule for technician ${technicianId} with ${assignedOrders.length} stops`);

    const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '');
    const schedule = await this.prisma.technicianSchedule.create({
      data: {
        scheduleCode: `SCH-${dateStr}-AUTO`,
        date: dayStart,
        technicianId,
        region: 'Auto-generated',
        status: ScheduleStatus.ACTIVE,
        stops: {
          create: assignedOrders.map((wo, i) => ({
            sequenceNumber: i + 1,
            workOrderId: wo.id,
            status: wo.status === WorkOrderStatus.IN_PROGRESS ? StopStatus.ARRIVED : StopStatus.PENDING,
            plannedEta: new Date(dayStart.getTime() + (i + 1) * 3600000),
          })),
        },
      },
      include: SCHEDULE_INCLUDE,
    });

    return schedule;
  }

  /** Update a schedule stop's status + sync work order status */
  async updateStopStatus(
    stopId: string,
    technicianId: string,
    status: StopStatus,
    notes?: string,
  ) {
    const stop = await this.prisma.scheduleStop.findUnique({
      where: { id: stopId },
      include: { schedule: true, workOrder: { select: { reportedById: true } } },
    });

    if (!stop) throw new NotFoundException(`Schedule stop ${stopId} not found`);
    if (stop.schedule.technicianId !== technicianId) {
      throw new ForbiddenException('You can only update your own schedule stops');
    }

    // Map stop status → work order status
    const woStatusMap: Partial<Record<StopStatus, WorkOrderStatus>> = {
      EN_ROUTE: WorkOrderStatus.EN_ROUTE,
      ARRIVED: WorkOrderStatus.IN_PROGRESS,
      COMPLETED: WorkOrderStatus.COMPLETED,
    };

    const updatedStop = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.scheduleStop.update({
        where: { id: stopId },
        data: {
          status,
          notes,
          ...(status === StopStatus.ARRIVED && { actualArrival: new Date() }),
        },
      });

      // Sync work order status if applicable
      const woStatus = woStatusMap[status];
      if (woStatus) {
        await tx.workOrder.update({
          where: { id: stop.workOrderId },
          data: {
            status: woStatus,
            ...(woStatus === WorkOrderStatus.COMPLETED && {
              completedAt: new Date(),
              resolutionNotes: notes,
            }),
          },
        });

        await tx.workOrderEvent.create({
          data: {
            workOrderId: stop.workOrderId,
            eventType: woStatus === WorkOrderStatus.COMPLETED ? 'COMPLETED' : 'STATUS_CHANGED',
            actorId: technicianId,
            toStatus: woStatus,
            notes,
          },
        });
      }

      return updated;
    });

    // Emit WebSocket events so dashboard + tenant update in real-time
    const woStatus = woStatusMap[status];
    if (woStatus) {
      const updatedWo = await this.prisma.workOrder.findUnique({
        where: { id: stop.workOrderId },
      });
      if (updatedWo) {
        const payload = updatedWo as unknown as Record<string, unknown>;
        if (woStatus === WorkOrderStatus.COMPLETED) {
          this.gateway.emitWorkOrderCompleted(payload, stop.workOrder.reportedById);
        } else {
          this.gateway.emitWorkOrderStatusChanged(payload, stop.workOrder.reportedById);
        }
      }
    }

    return updatedStop;
  }

  /** Update a schedule stop's ETA + notify tenant via WebSocket */
  async updateStopEta(
    stopId: string,
    technicianId: string,
    eta: string,
  ) {
    const stop = await this.prisma.scheduleStop.findUnique({
      where: { id: stopId },
      include: { schedule: true, workOrder: { select: { id: true, reportedById: true } } },
    });

    if (!stop) throw new NotFoundException(`Schedule stop ${stopId} not found`);
    if (stop.schedule.technicianId !== technicianId) {
      throw new ForbiddenException('You can only update your own schedule stops');
    }

    const updated = await this.prisma.scheduleStop.update({
      where: { id: stopId },
      data: { plannedEta: new Date(eta) },
    });

    // Log event + emit WebSocket
    await this.prisma.workOrderEvent.create({
      data: {
        workOrderId: stop.workOrder.id,
        eventType: 'ETA_UPDATED',
        actorId: technicianId,
        notes: `ETA updated to ${eta}`,
      },
    });

    this.gateway.emitEtaUpdated(
      { workOrderId: stop.workOrder.id, stopId, eta } as unknown as Record<string, unknown>,
      stop.workOrder.reportedById,
    );

    return updated;
  }
}
