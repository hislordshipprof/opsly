// ─── Enums (mirror Prisma schema exactly) ──────────────

export enum Role {
  TENANT = 'TENANT',
  TECHNICIAN = 'TECHNICIAN',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum WorkOrderStatus {
  REPORTED = 'REPORTED',
  TRIAGED = 'TRIAGED',
  ASSIGNED = 'ASSIGNED',
  EN_ROUTE = 'EN_ROUTE',
  IN_PROGRESS = 'IN_PROGRESS',
  NEEDS_PARTS = 'NEEDS_PARTS',
  COMPLETED = 'COMPLETED',
  ESCALATED = 'ESCALATED',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum IssueCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  STRUCTURAL = 'STRUCTURAL',
  APPLIANCE = 'APPLIANCE',
  PEST = 'PEST',
  LOCKSMITH = 'LOCKSMITH',
  OTHER = 'OTHER',
}

export enum WorkOrderEventType {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  TECHNICIAN_ASSIGNED = 'TECHNICIAN_ASSIGNED',
  PHOTO_UPLOADED = 'PHOTO_UPLOADED',
  ETA_UPDATED = 'ETA_UPDATED',
  NOTE_ADDED = 'NOTE_ADDED',
  ESCALATED = 'ESCALATED',
  COMPLETED = 'COMPLETED',
}

// ─── API Response Types ────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: number | null;
}

/** Work order as returned from GET /work-orders (list view) */
export interface WorkOrderListItem {
  id: string;
  orderNumber: string;
  issueCategory: IssueCategory;
  issueDescription: string;
  status: WorkOrderStatus;
  priority: Priority;
  slaDeadline: string | null;
  slaBreached: boolean;
  createdAt: string;
  unit: { unitNumber: string };
  property: { name: string };
  reportedBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
}

/** Work order as returned from GET /work-orders/:id (detail view) */
export interface WorkOrderDetail extends WorkOrderListItem {
  aiSeverityScore: number | null;
  photoUrls: string[];
  visionAssessment: VisionAssessment | null;
  resolutionNotes: string | null;
  completedAt: string | null;
  updatedAt: string;
  unit: { id: string; unitNumber: string; floor: number | null };
  property: { id: string; name: string; address: string };
  reportedBy: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string; email: string } | null;
  events: WorkOrderEvent[];
}

export interface WorkOrderEvent {
  id: string;
  workOrderId: string;
  eventType: WorkOrderEventType;
  actorId: string | null;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; name: string; role: string } | null;
}

export interface VisionAssessment {
  damageType: string;
  severity: string;
  confidence: number;
  description: string;
  recommendations: string[];
  recommendedPriority: string;
}

/** Dashboard KPI metrics from GET /work-orders/metrics */
export interface DashboardMetrics {
  openOrders: number;
  urgentOrders: number;
  inProgressOrders: number;
  completedToday: number;
  slaAtRisk: number;
  unassigned: number;
  avgResolutionHours: number | null;
}

/** Technician summary for dashboard panel */
export interface TechnicianSummary {
  id: string;
  name: string;
  email: string;
  activeOrders: number;
  currentStatus: string | null;
  currentOrderNumber: string | null;
}

// ─── Technician Schedule Types ─────────────────────────

export enum StopStatus {
  PENDING = 'PENDING',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export interface ScheduleStop {
  id: string;
  sequenceNumber: number;
  plannedEta: string | null;
  actualArrival: string | null;
  status: StopStatus;
  notes: string | null;
  workOrder: {
    id: string;
    orderNumber: string;
    issueCategory: IssueCategory;
    issueDescription: string;
    priority: Priority;
    status: WorkOrderStatus;
    aiSeverityScore: number | null;
    visionAssessment: VisionAssessment | null;
    photoUrls: string[];
    slaDeadline: string | null;
    slaBreached: boolean;
    resolutionNotes: string | null;
    unit: {
      unitNumber: string;
      floor: number | null;
      property: { name: string; address: string };
    };
    reportedBy: { name: string };
  };
}

export interface TechnicianSchedule {
  id: string;
  scheduleCode: string;
  date: string;
  region: string | null;
  status: string;
  stops: ScheduleStop[];
}

// ─── WebSocket Event Types ─────────────────────────────

export type WsEventName =
  | 'workorder.created'
  | 'workorder.status_changed'
  | 'workorder.technician_assigned'
  | 'workorder.photo_assessed'
  | 'workorder.completed'
  | 'escalation.triggered'
  | 'escalation.acknowledged'
  | 'metrics.snapshot_updated';
