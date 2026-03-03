import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StopStatus, WorkOrderStatus } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  /** Get today's schedule for a technician (with stops + work order details) */
  async getTechnicianSchedule(technicianId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    // Use UTC boundaries to avoid timezone mismatch with stored dates
    const dayStart = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));

    return this.prisma.technicianSchedule.findFirst({
      where: {
        technicianId,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        stops: {
          orderBy: { sequenceNumber: 'asc' },
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
      },
    });
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
      include: { schedule: true },
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

    return updatedStop;
  }
}
