import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role, WorkOrderStatus, Priority, WorkOrderEventType } from '@prisma/client';
import { CreateWorkOrderDto } from './dto/create-work-order.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { AssignTechnicianDto } from './dto/assign-technician.dto.js';
import { QueryWorkOrdersDto } from './dto/query-work-orders.dto.js';
import { sanitizeText } from '../common/utils/sanitize.js';
import { computeSlaDeadline } from '../common/utils/sla.js';
import { OpslyGateway } from '../websocket/opsly.gateway.js';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OpslyGateway,
  ) {}

  async create(dto: CreateWorkOrderDto, userId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
      select: { id: true, propertyId: true, tenantId: true, isOccupied: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit ${dto.unitId} not found`);
    }
    if (!unit.isOccupied) {
      throw new BadRequestException('Cannot create work order for an unoccupied unit');
    }

    const description = sanitizeText(dto.issueDescription, 1000);
    const priority = dto.priority ?? Priority.MEDIUM;
    const slaDeadline = computeSlaDeadline(priority);
    const orderNumber = await this.generateOrderNumber();

    const workOrder = await this.prisma.workOrder.create({
      data: {
        orderNumber,
        unitId: unit.id,
        propertyId: unit.propertyId,
        reportedById: userId,
        issueCategory: dto.issueCategory,
        issueDescription: description,
        priority,
        slaDeadline,
        photoUrls: dto.photoUrls ?? [],
        events: {
          create: {
            eventType: WorkOrderEventType.CREATED,
            actorId: userId,
            toStatus: WorkOrderStatus.REPORTED,
            notes: `Work order created: ${dto.issueCategory}`,
          },
        },
      },
      include: {
        unit: { select: { unitNumber: true } },
        property: { select: { name: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    });

    this.logger.log(`Work order ${orderNumber} created by user ${userId}`);
    this.gateway.emitWorkOrderCreated(workOrder as unknown as Record<string, unknown>);
    return workOrder;
  }

  async findAll(query: QueryWorkOrdersDto, userId: string, userRole: Role) {
    const where: Record<string, unknown> = {};

    // Role-based filtering: tenants see own, technicians see assigned
    if (userRole === Role.TENANT) {
      where.reportedById = userId;
    } else if (userRole === Role.TECHNICIAN) {
      where.assignedToId = userId;
    }

    // Optional filters from query params
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedToId && userRole !== Role.TECHNICIAN) {
      where.assignedToId = query.assignedToId;
    }

    return this.prisma.workOrder.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        issueCategory: true,
        issueDescription: true,
        status: true,
        priority: true,
        slaDeadline: true,
        slaBreached: true,
        createdAt: true,
        unit: { select: { unitNumber: true } },
        property: { select: { name: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query.take ?? 50,
      skip: query.skip ?? 0,
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, unitNumber: true, floor: true } },
        property: { select: { id: true, name: true, address: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        events: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`Work order ${id} not found`);
    }

    this.enforceAccess(workOrder, userId, userRole);
    return workOrder;
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    userId: string,
    userRole: Role,
  ) {
    const workOrder = await this.findOne(id, userId, userRole);

    // Technicians can only update their assigned work orders
    if (userRole === Role.TECHNICIAN && workOrder.assignedToId !== userId) {
      throw new ForbiddenException('You can only update work orders assigned to you');
    }

    const notes = dto.notes ? sanitizeText(dto.notes, 500) : undefined;
    const isCompleting = dto.status === WorkOrderStatus.COMPLETED;

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        status: dto.status,
        ...(isCompleting && { completedAt: new Date() }),
        events: {
          create: {
            eventType: WorkOrderEventType.STATUS_CHANGED,
            actorId: userId,
            fromStatus: workOrder.status,
            toStatus: dto.status,
            notes,
          },
        },
      },
      include: {
        unit: { select: { unitNumber: true } },
        property: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    this.logger.log(
      `Work order ${workOrder.orderNumber} status: ${workOrder.status} → ${dto.status}`,
    );

    if (isCompleting) {
      this.gateway.emitWorkOrderCompleted(
        updated as unknown as Record<string, unknown>,
        workOrder.reportedById,
      );
    } else {
      this.gateway.emitWorkOrderStatusChanged(
        updated as unknown as Record<string, unknown>,
        workOrder.reportedById,
      );
    }

    return updated;
  }

  async assign(
    id: string,
    dto: AssignTechnicianDto,
    userId: string,
    userRole: Role,
  ) {
    const workOrder = await this.findOne(id, userId, userRole);

    // Verify the technician exists and has the right role
    const technician = await this.prisma.user.findUnique({
      where: { id: dto.technicianId },
      select: { id: true, name: true, role: true, isActive: true },
    });

    if (!technician) {
      throw new NotFoundException(`Technician ${dto.technicianId} not found`);
    }
    if (technician.role !== Role.TECHNICIAN) {
      throw new BadRequestException('User is not a technician');
    }
    if (!technician.isActive) {
      throw new BadRequestException('Technician account is not active');
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        assignedToId: technician.id,
        status: WorkOrderStatus.ASSIGNED,
        events: {
          create: {
            eventType: WorkOrderEventType.TECHNICIAN_ASSIGNED,
            actorId: userId,
            fromStatus: workOrder.status,
            toStatus: WorkOrderStatus.ASSIGNED,
            notes: `Assigned to ${technician.name}`,
            metadata: { technicianId: technician.id },
          },
        },
      },
      include: {
        unit: { select: { unitNumber: true } },
        property: { select: { name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    this.logger.log(
      `Work order ${workOrder.orderNumber} assigned to ${technician.name}`,
    );
    this.gateway.emitTechnicianAssigned(
      updated as unknown as Record<string, unknown>,
      workOrder.reportedById,
      technician.id,
    );
    return updated;
  }

  async getEvents(id: string, userId: string, userRole: Role) {
    // enforceAccess via findOne
    await this.findOne(id, userId, userRole);

    return this.prisma.workOrderEvent.findMany({
      where: { workOrderId: id },
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Generates a unique order number in format WO-XXXX */
  private async generateOrderNumber(): Promise<string> {
    const count = await this.prisma.workOrder.count();
    const number = (count + 1).toString().padStart(4, '0');
    return `WO-${number}`;
  }

  /** Post-fetch access check — tenants see own, technicians see assigned */
  private enforceAccess(
    workOrder: { reportedById: string; assignedToId: string | null },
    userId: string,
    userRole: Role,
  ): void {
    if (userRole === Role.TENANT && workOrder.reportedById !== userId) {
      throw new ForbiddenException('You can only view your own work orders');
    }
    if (userRole === Role.TECHNICIAN && workOrder.assignedToId !== userId) {
      throw new ForbiddenException('You can only view work orders assigned to you');
    }
  }
}
