import { Injectable } from '@nestjs/common';
import { FunctionTool, ToolContext } from '@google/adk';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service.js';
import { WorkOrdersService } from '../../work-orders/work-orders.service.js';
import { Priority, Role, WorkOrderStatus } from '@prisma/client';

/** Helper: read user_id from ADK session state */
function getUserId(tc?: ToolContext): string {
  return (tc?.state?.get('user_id') as string) ?? '';
}

function getUserRole(tc?: ToolContext): Role {
  return (tc?.state?.get('user_role') as Role) ?? Role.TENANT;
}

@Injectable()
export class OpslyToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workOrders: WorkOrdersService,
  ) {}

  /** ── Triage Agent Tools ─────────────────────────── */

  get triageTools(): FunctionTool[] {
    return [this.getUnitByTenant(), this.createWorkOrder()];
  }

  private getUnitByTenant(): FunctionTool {
    return new FunctionTool({
      name: 'get_unit_by_tenant',
      description: 'Get the unit assigned to a tenant. Returns unit number, property, and floor.',
      parameters: z.object({
        tenantId: z.string().describe('The tenant user ID'),
      }),
      execute: async ({ tenantId }: { tenantId: string }) => {
        const unit = await this.prisma.unit.findFirst({
          where: { tenantId },
          include: { property: { select: { name: true, address: true } } },
        });
        if (!unit) return { found: false, error: 'No unit assigned to this tenant' };
        return {
          found: true,
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          floor: unit.floor,
          propertyName: unit.property.name,
          propertyAddress: unit.property.address,
        };
      },
    });
  }

  private createWorkOrder(): FunctionTool {
    return new FunctionTool({
      name: 'create_work_order',
      description: 'Create a new work order for a maintenance issue reported by a tenant.',
      parameters: z.object({
        unitId: z.string().describe('The unit UUID'),
        issueCategory: z.enum([
          'PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL',
          'APPLIANCE', 'PEST', 'LOCKSMITH', 'OTHER',
        ]).describe('The issue category'),
        issueDescription: z.string().describe('Detailed description of the issue (min 10 chars)'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
          .describe('Priority level (defaults to MEDIUM)'),
      }),
      execute: async (params: {
        unitId: string;
        issueCategory: string;
        issueDescription: string;
        priority?: string;
      }, tc?: ToolContext) => {
        try {
          const userId = getUserId(tc);
          const wo = await this.workOrders.create(
            {
              unitId: params.unitId,
              issueCategory: params.issueCategory as any,
              issueDescription: params.issueDescription,
              priority: params.priority as Priority | undefined,
            },
            userId,
          );
          return {
            success: true,
            orderNumber: wo.orderNumber,
            status: wo.status,
            priority: wo.priority,
            slaDeadline: wo.slaDeadline?.toISOString(),
          };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    });
  }

  /** ── Status Agent Tools ─────────────────────────── */

  get statusTools(): FunctionTool[] {
    return [this.getWorkOrder(), this.getWorkOrderEvents(), this.getOpenWorkOrders()];
  }

  private getWorkOrder(): FunctionTool {
    return new FunctionTool({
      name: 'get_work_order',
      description: 'Look up a work order by its order number (e.g. WO-0001).',
      parameters: z.object({
        orderNumber: z.string().describe('The work order number (e.g. WO-0001)'),
      }),
      execute: async ({ orderNumber }: { orderNumber: string }, tc?: ToolContext) => {
        const wo = await this.prisma.workOrder.findUnique({
          where: { orderNumber },
          select: {
            id: true, orderNumber: true, issueCategory: true,
            issueDescription: true, status: true, priority: true,
            slaDeadline: true, slaBreached: true, createdAt: true,
            unit: { select: { unitNumber: true } },
            property: { select: { name: true } },
            assignedTo: { select: { name: true } },
          },
        });
        if (!wo) return { found: false, error: `Work order ${orderNumber} not found` };
        return { found: true, ...wo, slaDeadline: wo.slaDeadline?.toISOString(), createdAt: wo.createdAt.toISOString() };
      },
    });
  }

  private getWorkOrderEvents(): FunctionTool {
    return new FunctionTool({
      name: 'get_work_order_events',
      description: 'Get the event timeline for a work order.',
      parameters: z.object({
        workOrderId: z.string().describe('The work order UUID'),
      }),
      execute: async ({ workOrderId }: { workOrderId: string }) => {
        const events = await this.prisma.workOrderEvent.findMany({
          where: { workOrderId },
          select: {
            eventType: true, notes: true, createdAt: true,
            actor: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        return { events: events.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })) };
      },
    });
  }

  private getOpenWorkOrders(): FunctionTool {
    return new FunctionTool({
      name: 'get_open_work_orders',
      description: 'Get all open (non-completed) work orders for the current user.',
      parameters: z.object({}),
      execute: async (_params: Record<string, never>, tc?: ToolContext) => {
        const userId = getUserId(tc);
        const role = getUserRole(tc);
        const where: Record<string, unknown> = {
          status: { notIn: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED] },
        };
        if (role === Role.TENANT) where.reportedById = userId;
        else if (role === Role.TECHNICIAN) where.assignedToId = userId;

        const orders = await this.prisma.workOrder.findMany({
          where,
          select: {
            orderNumber: true, issueCategory: true, status: true,
            priority: true, slaDeadline: true, createdAt: true,
            unit: { select: { unitNumber: true } },
            property: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        return { count: orders.length, orders: orders.map(o => ({
          ...o, slaDeadline: o.slaDeadline?.toISOString(), createdAt: o.createdAt.toISOString(),
        })) };
      },
    });
  }

  /** ── Schedule Agent Tools ───────────────────────── */

  get scheduleTools(): FunctionTool[] {
    return [this.getTechnicianSchedule(), this.getWorkOrderDetail(), this.updateWorkOrderStatus()];
  }

  private getTechnicianSchedule(): FunctionTool {
    return new FunctionTool({
      name: 'get_technician_schedule',
      description: 'Get the list of assigned work orders for a technician (today\'s jobs).',
      parameters: z.object({}),
      execute: async (_params: Record<string, never>, tc?: ToolContext) => {
        const userId = getUserId(tc);
        const orders = await this.prisma.workOrder.findMany({
          where: {
            assignedToId: userId,
            status: { notIn: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED] },
          },
          select: {
            id: true, orderNumber: true, issueCategory: true,
            issueDescription: true, status: true, priority: true,
            slaDeadline: true,
            unit: { select: { unitNumber: true, floor: true } },
            property: { select: { name: true, address: true } },
            reportedBy: { select: { name: true } },
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        });
        return { jobCount: orders.length, jobs: orders.map(o => ({
          ...o, slaDeadline: o.slaDeadline?.toISOString(),
        })) };
      },
    });
  }

  private getWorkOrderDetail(): FunctionTool {
    return new FunctionTool({
      name: 'get_work_order_detail',
      description: 'Get full details on a specific work order including vision assessment.',
      parameters: z.object({
        workOrderId: z.string().describe('The work order UUID'),
      }),
      execute: async ({ workOrderId }: { workOrderId: string }, tc?: ToolContext) => {
        try {
          const wo = await this.workOrders.findOne(workOrderId, getUserId(tc), getUserRole(tc));
          return { found: true, ...wo, createdAt: wo.createdAt.toISOString(), slaDeadline: wo.slaDeadline?.toISOString() };
        } catch {
          return { found: false, error: 'Work order not found or access denied' };
        }
      },
    });
  }

  private updateWorkOrderStatus(): FunctionTool {
    return new FunctionTool({
      name: 'update_work_order_status',
      description: 'Update the status of a work order. Technicians use this to mark progress.',
      parameters: z.object({
        workOrderId: z.string().describe('The work order UUID'),
        status: z.enum(['EN_ROUTE', 'IN_PROGRESS', 'NEEDS_PARTS', 'COMPLETED'])
          .describe('The new status'),
        notes: z.string().optional().describe('Optional notes about the update'),
      }),
      execute: async (params: {
        workOrderId: string;
        status: string;
        notes?: string;
      }, tc?: ToolContext) => {
        try {
          const updated = await this.workOrders.updateStatus(
            params.workOrderId,
            { status: params.status as WorkOrderStatus, notes: params.notes },
            getUserId(tc),
            getUserRole(tc),
          );
          return { success: true, orderNumber: updated.orderNumber, newStatus: updated.status };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    });
  }

  /** ── Escalation Agent Tools ─────────────────────── */

  get escalationTools(): FunctionTool[] {
    return [this.getOverdueWorkOrders(), this.triggerEscalation()];
  }

  private getOverdueWorkOrders(): FunctionTool {
    return new FunctionTool({
      name: 'get_overdue_work_orders',
      description: 'Get all work orders that have breached their SLA deadline.',
      parameters: z.object({}),
      execute: async () => {
        const now = new Date();
        const overdue = await this.prisma.workOrder.findMany({
          where: {
            slaDeadline: { lt: now },
            status: { notIn: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED] },
          },
          select: {
            orderNumber: true, priority: true, status: true,
            slaDeadline: true, createdAt: true,
            property: { select: { name: true } },
            unit: { select: { unitNumber: true } },
            assignedTo: { select: { name: true } },
          },
          orderBy: { slaDeadline: 'asc' },
        });
        return { overdueCount: overdue.length, orders: overdue.map(o => ({
          ...o,
          slaDeadline: o.slaDeadline?.toISOString(),
          createdAt: o.createdAt.toISOString(),
          hoursOverdue: o.slaDeadline
            ? Math.round((now.getTime() - o.slaDeadline.getTime()) / 3600000 * 10) / 10
            : null,
        })) };
      },
    });
  }

  private triggerEscalation(): FunctionTool {
    return new FunctionTool({
      name: 'trigger_escalation',
      description: 'Manually escalate a work order. Sets status to ESCALATED and marks SLA breached.',
      parameters: z.object({
        workOrderId: z.string().describe('The work order UUID to escalate'),
        reason: z.string().describe('Reason for escalation'),
      }),
      execute: async ({ workOrderId, reason }: { workOrderId: string; reason: string }, tc?: ToolContext) => {
        try {
          const updated = await this.prisma.workOrder.update({
            where: { id: workOrderId },
            data: {
              status: WorkOrderStatus.ESCALATED,
              slaBreached: true,
              events: {
                create: {
                  eventType: 'ESCALATED',
                  actorId: getUserId(tc) || null,
                  toStatus: WorkOrderStatus.ESCALATED,
                  notes: reason,
                },
              },
            },
            select: { orderNumber: true, status: true, priority: true },
          });
          return { success: true, ...updated };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    });
  }

  /** ── Analytics Agent Tools ──────────────────────── */

  get analyticsTools(): FunctionTool[] {
    return [this.getMetricsOverview()];
  }

  private getMetricsOverview(): FunctionTool {
    return new FunctionTool({
      name: 'get_metrics_overview',
      description: 'Get operational metrics: total orders, open count, completion rate, SLA breach count.',
      parameters: z.object({}),
      execute: async () => {
        const [total, open, completed, breached] = await Promise.all([
          this.prisma.workOrder.count(),
          this.prisma.workOrder.count({
            where: { status: { notIn: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED] } },
          }),
          this.prisma.workOrder.count({ where: { status: WorkOrderStatus.COMPLETED } }),
          this.prisma.workOrder.count({ where: { slaBreached: true } }),
        ]);
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const slaBreachRate = total > 0 ? Math.round((breached / total) * 100) : 0;
        return {
          totalWorkOrders: total,
          openWorkOrders: open,
          completedWorkOrders: completed,
          completionRate: `${completionRate}%`,
          slaBreaches: breached,
          slaBreachRate: `${slaBreachRate}%`,
        };
      },
    });
  }
}
