import type { WorkOrderStatus, Priority } from '@/types';

export interface WorkOrderFilters {
  propertyId?: string;
  status?: WorkOrderStatus;
  priority?: Priority;
  assignedToId?: string;
  take?: number;
  skip?: number;
}

export const QUERY_KEYS = {
  workOrders: (filters?: WorkOrderFilters) => ['work-orders', filters] as const,
  workOrder: (id: string) => ['work-orders', id] as const,
  workOrderEvents: (id: string) => ['work-orders', id, 'events'] as const,
  metrics: () => ['work-orders', 'metrics'] as const,
  technicians: () => ['work-orders', 'technicians'] as const,
  users: (role?: string) => ['users', role] as const,
  properties: () => ['properties'] as const,
  schedule: (date?: string) => ['schedules', date] as const,
  tenantUnit: (tenantId: string) => ['tenant-unit', tenantId] as const,
  tenantInsights: () => ['ai', 'tenant-insights'] as const,
  sessionRecap: () => ['ai', 'session-recap'] as const,
  chatMessages: (workOrderId: string) => ['chat', workOrderId] as const,
  chatThreads: () => ['chat', 'threads'] as const,
} as const;
