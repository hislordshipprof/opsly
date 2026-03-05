import {
  PrismaClient,
  Role,
  IssueCategory,
  WorkOrderStatus,
  Priority,
  WorkOrderEventType,
  ScheduleStatus,
  StopStatus,
  EscalationEventType,
  AgentChannel,
  AgentSessionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding OPSLY database...');

  // ─── Clean slate — delete all data in dependency order ───
  console.log('  Clearing existing data...');
  await prisma.escalationLog.deleteMany();
  await prisma.escalationContact.deleteMany();
  await prisma.agentSession.deleteMany();
  await prisma.scheduleStop.deleteMany();
  await prisma.technicianSchedule.deleteMany();
  await prisma.workOrderEvent.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  console.log('  Done.');

  const password = await bcrypt.hash('password123', 10);
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

  // ─── Users (6 + 2 extra technicians) ─────────────────
  const admin = await prisma.user.create({
    data: { name: 'James Admin', email: 'admin@opsly.io', passwordHash: password, role: Role.ADMIN },
  });

  const manager = await prisma.user.create({
    data: { name: 'Sarah Manager', email: 'sarah@opsly.io', passwordHash: password, role: Role.MANAGER },
  });

  const tech = await prisma.user.create({
    data: { name: 'Mike Thompson', email: 'mike@opsly.io', passwordHash: password, role: Role.TECHNICIAN },
  });

  const tech2 = await prisma.user.create({
    data: { name: 'Lisa Kim', email: 'lisa.tech@opsly.io', passwordHash: password, role: Role.TECHNICIAN },
  });

  const tech3 = await prisma.user.create({
    data: { name: 'James Ortiz', email: 'james.tech@opsly.io', passwordHash: password, role: Role.TECHNICIAN },
  });

  const tenant1 = await prisma.user.create({
    data: { name: 'Sarah Tenant', email: 'tenant@opsly.io', passwordHash: password, role: Role.TENANT },
  });

  const tenant2 = await prisma.user.create({
    data: { name: 'David Renter', email: 'david@opsly.io', passwordHash: password, role: Role.TENANT },
  });

  const tenant3 = await prisma.user.create({
    data: { name: 'Lisa Chen', email: 'lisa@opsly.io', passwordHash: password, role: Role.TENANT },
  });

  // ─── Properties (2) ───────────────────────────────
  const prop1 = await prisma.property.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '12 Maple Street', address: '12 Maple Street', city: 'London', managerId: manager.id,
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      id: '00000000-0000-0000-0000-000000000002',
      name: '45 Oak Avenue', address: '45 Oak Avenue', city: 'London', managerId: manager.id,
    },
  });

  // ─── Units (8 total, 4 occupied) ──────────────────
  const unitDefs = [
    { propertyId: prop1.id, unitNumber: '1A', floor: 1 },
    { propertyId: prop1.id, unitNumber: '2A', floor: 2, tenantId: tenant2.id, isOccupied: true },
    { propertyId: prop1.id, unitNumber: '3A', floor: 3 },
    { propertyId: prop1.id, unitNumber: '4B', floor: 4, tenantId: tenant1.id, isOccupied: true },
    { propertyId: prop1.id, unitNumber: '5B', floor: 5 },
    { propertyId: prop2.id, unitNumber: '101', floor: 1, tenantId: tenant3.id, isOccupied: true },
    { propertyId: prop2.id, unitNumber: '102', floor: 1 },
    { propertyId: prop2.id, unitNumber: '201', floor: 2 },
  ];

  const units: Record<string, { id: string; propertyId: string }> = {};
  for (const def of unitDefs) {
    const unit = await prisma.unit.create({ data: def });
    units[def.unitNumber] = { id: unit.id, propertyId: def.propertyId };
  }

  // ─── Work Orders (10) ─────────────────────────────
  // Distributed across 3 technicians for realistic dashboard
  const workOrders = [
    // 2x REPORTED (unassigned) — manager can assign from dashboard
    {
      orderNumber: 'WO-0001', unit: '4B', reporter: tenant1.id,
      category: IssueCategory.PLUMBING,
      description: 'Kitchen sink is leaking under the cabinet, water pooling on floor',
      status: WorkOrderStatus.REPORTED, priority: Priority.HIGH,
      slaDeadline: hoursFromNow(3), createdAt: hoursAgo(1),
    },
    {
      orderNumber: 'WO-0002', unit: '101', reporter: tenant3.id,
      category: IssueCategory.ELECTRICAL,
      description: 'Living room ceiling light flickers constantly and makes buzzing noise',
      status: WorkOrderStatus.REPORTED, priority: Priority.MEDIUM,
      slaDeadline: hoursFromNow(22), createdAt: hoursAgo(2),
    },

    // 2x ASSIGNED (distributed across technicians)
    {
      orderNumber: 'WO-0003', unit: '2A', reporter: tenant2.id, assignee: tech2.id,
      category: IssueCategory.HVAC,
      description: 'Air conditioning unit not cooling, blowing warm air only',
      status: WorkOrderStatus.ASSIGNED, priority: Priority.HIGH,
      slaDeadline: hoursFromNow(2), createdAt: hoursAgo(2),
    },
    {
      orderNumber: 'WO-0004', unit: '4B', reporter: tenant1.id, assignee: tech.id,
      category: IssueCategory.APPLIANCE,
      description: 'Dishwasher not draining properly after wash cycle completes',
      status: WorkOrderStatus.ASSIGNED, priority: Priority.MEDIUM,
      slaDeadline: hoursFromNow(20), createdAt: hoursAgo(4),
    },

    // 2x IN_PROGRESS (Mike + Lisa)
    {
      orderNumber: 'WO-0005', unit: '101', reporter: tenant3.id, assignee: tech.id,
      category: IssueCategory.LOCKSMITH,
      description: 'Front door lock mechanism is jammed, key turns but door does not open',
      status: WorkOrderStatus.IN_PROGRESS, priority: Priority.URGENT,
      slaDeadline: hoursFromNow(0.5), createdAt: hoursAgo(1.5),
    },
    {
      orderNumber: 'WO-0006', unit: '2A', reporter: tenant2.id, assignee: tech2.id,
      category: IssueCategory.STRUCTURAL,
      description: 'Crack appearing along bedroom wall near the window frame',
      status: WorkOrderStatus.IN_PROGRESS, priority: Priority.LOW,
      slaDeadline: hoursFromNow(60), createdAt: hoursAgo(12),
    },

    // 2x COMPLETED (Mike + James)
    {
      orderNumber: 'WO-0007', unit: '4B', reporter: tenant1.id, assignee: tech.id,
      category: IssueCategory.PEST,
      description: 'Ants found in kitchen near the sink area, multiple trails visible',
      status: WorkOrderStatus.COMPLETED, priority: Priority.MEDIUM,
      slaDeadline: hoursAgo(10), createdAt: hoursAgo(34), completedAt: hoursAgo(12),
      resolutionNotes: 'Applied treatment to kitchen perimeter and sealed entry points',
    },
    {
      orderNumber: 'WO-0008', unit: '101', reporter: tenant3.id, assignee: tech3.id,
      category: IssueCategory.PLUMBING,
      description: 'Bathroom faucet dripping continuously, wasting water',
      status: WorkOrderStatus.COMPLETED, priority: Priority.LOW,
      slaDeadline: hoursAgo(20), createdAt: hoursAgo(92), completedAt: hoursAgo(24),
      resolutionNotes: 'Replaced faucet washer and tightened connections',
    },

    // 1x URGENT — SLA breached, unassigned (triggers L1 escalation)
    {
      orderNumber: 'WO-0009', unit: '2A', reporter: tenant2.id,
      category: IssueCategory.PLUMBING,
      description: 'Water heater making loud banging noises and leaking from the base',
      status: WorkOrderStatus.ESCALATED, priority: Priority.URGENT,
      slaDeadline: hoursAgo(0.5), slaBreached: true, createdAt: hoursAgo(3),
    },

    // 1x ESCALATED — SLA breached, multi-level escalation active
    {
      orderNumber: 'WO-0010', unit: '4B', reporter: tenant1.id,
      category: IssueCategory.ELECTRICAL,
      description: 'Multiple power outlets in bedroom stopped working simultaneously',
      status: WorkOrderStatus.ESCALATED, priority: Priority.URGENT,
      slaDeadline: hoursAgo(2), slaBreached: true, createdAt: hoursAgo(4),
    },
  ];

  for (const wo of workOrders) {
    const unit = units[wo.unit]!;
    await prisma.workOrder.create({
      data: {
        orderNumber: wo.orderNumber,
        unitId: unit.id,
        propertyId: unit.propertyId,
        reportedById: wo.reporter,
        assignedToId: wo.assignee ?? null,
        issueCategory: wo.category,
        issueDescription: wo.description,
        status: wo.status,
        priority: wo.priority,
        slaDeadline: wo.slaDeadline,
        slaBreached: wo.slaBreached ?? false,
        resolutionNotes: wo.resolutionNotes ?? null,
        completedAt: wo.completedAt ?? null,
        createdAt: wo.createdAt,
        photoUrls: [],
        events: {
          create: {
            eventType: WorkOrderEventType.CREATED,
            actorId: wo.reporter,
            toStatus: wo.status,
            notes: `Seeded: ${wo.category} — ${wo.status}`,
            createdAt: wo.createdAt,
          },
        },
      },
    });
  }

  // ─── Extra Work Order Events (richer timelines) ────
  // WO-0005: REPORTED → ASSIGNED → IN_PROGRESS
  const wo5 = await prisma.workOrder.findUnique({ where: { orderNumber: 'WO-0005' } });
  if (wo5) {
    await prisma.workOrderEvent.createMany({
      data: [
        {
          workOrderId: wo5.id, eventType: WorkOrderEventType.STATUS_CHANGED,
          actorId: manager.id, fromStatus: WorkOrderStatus.REPORTED, toStatus: WorkOrderStatus.ASSIGNED,
          notes: 'Assigned to Mike Thompson', createdAt: hoursAgo(1),
        },
        {
          workOrderId: wo5.id, eventType: WorkOrderEventType.TECHNICIAN_ASSIGNED,
          actorId: manager.id, notes: 'Mike Thompson assigned — urgent lock issue',
          createdAt: hoursAgo(1),
        },
        {
          workOrderId: wo5.id, eventType: WorkOrderEventType.STATUS_CHANGED,
          actorId: tech.id, fromStatus: WorkOrderStatus.ASSIGNED, toStatus: WorkOrderStatus.IN_PROGRESS,
          notes: 'On-site, inspecting lock mechanism', createdAt: minsAgo(30),
        },
      ],
    });
  }

  // WO-0010: REPORTED → ESCALATED (SLA breach events)
  const wo10 = await prisma.workOrder.findUnique({ where: { orderNumber: 'WO-0010' } });
  if (wo10) {
    await prisma.workOrderEvent.createMany({
      data: [
        {
          workOrderId: wo10.id, eventType: WorkOrderEventType.ESCALATED,
          notes: 'SLA breached — URGENT 2h window expired, auto-escalation triggered',
          createdAt: hoursAgo(2),
        },
        {
          workOrderId: wo10.id, eventType: WorkOrderEventType.STATUS_CHANGED,
          fromStatus: WorkOrderStatus.REPORTED, toStatus: WorkOrderStatus.ESCALATED,
          notes: 'Escalated to L2 — no L1 acknowledgment', createdAt: hoursAgo(1.5),
        },
      ],
    });
  }

  // WO-0009: SLA breach event
  const wo9 = await prisma.workOrder.findUnique({ where: { orderNumber: 'WO-0009' } });
  if (wo9) {
    await prisma.workOrderEvent.create({
      data: {
        workOrderId: wo9.id, eventType: WorkOrderEventType.ESCALATED,
        notes: 'SLA breached — URGENT water heater, 2h window expired',
        createdAt: minsAgo(30),
      },
    });
  }

  // WO-0007: Full lifecycle events (REPORTED → ASSIGNED → IN_PROGRESS → COMPLETED)
  const wo7 = await prisma.workOrder.findUnique({ where: { orderNumber: 'WO-0007' } });
  if (wo7) {
    await prisma.workOrderEvent.createMany({
      data: [
        {
          workOrderId: wo7.id, eventType: WorkOrderEventType.TECHNICIAN_ASSIGNED,
          actorId: manager.id, notes: 'Mike Thompson assigned', createdAt: hoursAgo(30),
        },
        {
          workOrderId: wo7.id, eventType: WorkOrderEventType.STATUS_CHANGED,
          actorId: tech.id, fromStatus: WorkOrderStatus.ASSIGNED, toStatus: WorkOrderStatus.IN_PROGRESS,
          notes: 'Arrived on-site', createdAt: hoursAgo(20),
        },
        {
          workOrderId: wo7.id, eventType: WorkOrderEventType.COMPLETED,
          actorId: tech.id, fromStatus: WorkOrderStatus.IN_PROGRESS, toStatus: WorkOrderStatus.COMPLETED,
          notes: 'Applied treatment to kitchen perimeter and sealed entry points',
          createdAt: hoursAgo(12),
        },
      ],
    });
  }

  // ─── Technician Schedules ─────────────────────────
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Mike's schedule (WO-0004: ASSIGNED, WO-0005: IN_PROGRESS)
  const mikeOrders = await prisma.workOrder.findMany({
    where: { assignedToId: tech.id, status: { in: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS] } },
    orderBy: { priority: 'desc' },
  });

  if (mikeOrders.length > 0) {
    await prisma.technicianSchedule.create({
      data: {
        scheduleCode: `SCH-${dateStr}-MIKE`,
        date: today,
        technicianId: tech.id,
        region: 'London Central',
        status: ScheduleStatus.ACTIVE,
        stops: {
          create: mikeOrders.map((wo, i) => ({
            workOrderId: wo.id,
            sequenceNumber: i + 1,
            plannedEta: new Date(today.getTime() + (i + 1) * 60 * 60 * 1000),
            status: wo.status === WorkOrderStatus.IN_PROGRESS ? StopStatus.ARRIVED : StopStatus.PENDING,
            ...(wo.status === WorkOrderStatus.IN_PROGRESS && { actualArrival: new Date() }),
          })),
        },
      },
    });
    console.log(`  Schedule: SCH-${dateStr}-MIKE — ${mikeOrders.length} stops`);
  }

  // Lisa's schedule (WO-0003: ASSIGNED, WO-0006: IN_PROGRESS)
  const lisaOrders = await prisma.workOrder.findMany({
    where: { assignedToId: tech2.id, status: { in: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS] } },
    orderBy: { priority: 'desc' },
  });

  if (lisaOrders.length > 0) {
    await prisma.technicianSchedule.create({
      data: {
        scheduleCode: `SCH-${dateStr}-LISA`,
        date: today,
        technicianId: tech2.id,
        region: 'London Central',
        status: ScheduleStatus.ACTIVE,
        stops: {
          create: lisaOrders.map((wo, i) => ({
            workOrderId: wo.id,
            sequenceNumber: i + 1,
            plannedEta: new Date(today.getTime() + (i + 1) * 60 * 60 * 1000),
            status: wo.status === WorkOrderStatus.IN_PROGRESS ? StopStatus.ARRIVED : StopStatus.PENDING,
            ...(wo.status === WorkOrderStatus.IN_PROGRESS && { actualArrival: new Date() }),
          })),
        },
      },
    });
    console.log(`  Schedule: SCH-${dateStr}-LISA — ${lisaOrders.length} stops`);
  }

  // ─── Escalation Contacts (3-level ladder) ──────────
  await prisma.escalationContact.deleteMany();

  const [contactL1, contactL2, contactL3] = await Promise.all([
    prisma.escalationContact.create({
      data: { userId: tech.id, position: 1, timeoutSeconds: 1800, label: 'On-Call Dispatcher' },
    }),
    prisma.escalationContact.create({
      data: { userId: manager.id, position: 2, timeoutSeconds: 1800, label: 'Property Manager' },
    }),
    prisma.escalationContact.create({
      data: { userId: admin.id, position: 3, timeoutSeconds: 1800, label: 'Building Admin' },
    }),
  ]);
  console.log('  Escalation Contacts: 3-level ladder (Dispatcher → Manager → Admin)');

  // ─── Escalation Logs (active, unacknowledged) ─────
  // Clear any existing logs so re-seeding is clean
  await prisma.escalationLog.deleteMany();

  // WO-0010: Multi-level escalation (L1 triggered 2h ago, L2 advanced 1h ago)
  if (wo10) {
    await prisma.escalationLog.createMany({
      data: [
        {
          workOrderId: wo10.id,
          contactId: contactL1.id,
          attemptNumber: 1,
          eventType: EscalationEventType.TRIGGERED,
          reason: 'SLA breached — URGENT electrical issue, 2h window expired',
          ackReceived: false,
          createdAt: hoursAgo(2),
        },
        {
          workOrderId: wo10.id,
          contactId: contactL2.id,
          attemptNumber: 2,
          eventType: EscalationEventType.ADVANCED,
          reason: 'L1 timeout — no acknowledgment after 30 minutes',
          ackReceived: false,
          createdAt: hoursAgo(1),
        },
      ],
    });
    console.log('  Escalation: WO-0010 — L1 + L2 active (unacknowledged)');
  }

  // WO-0009: L1 escalation triggered 30min ago (water heater leak)
  if (wo9) {
    await prisma.escalationLog.create({
      data: {
        workOrderId: wo9.id,
        contactId: contactL1.id,
        attemptNumber: 1,
        eventType: EscalationEventType.TRIGGERED,
        reason: 'SLA breached — URGENT water heater leak, 2h window expired',
        ackReceived: false,
        createdAt: minsAgo(30),
      },
    });
    console.log('  Escalation: WO-0009 — L1 active (unacknowledged)');
  }

  // ─── Agent Session (demo: completed tenant voice report) ─
  await prisma.agentSession.create({
    data: {
      userId: tenant1.id,
      role: 'tenant',
      channel: AgentChannel.VOICE,
      linkedWorkOrderId: wo5?.id ?? null,
      status: AgentSessionStatus.COMPLETED,
      lastAgentName: 'tenant-intake',
      startedAt: hoursAgo(1.5),
      endedAt: hoursAgo(1.4),
      transcript: JSON.stringify([
        { role: 'user', text: 'Hi, my front door lock is jammed and I can\'t open it' },
        { role: 'agent', text: 'I\'m sorry to hear that. Is this the main entrance or a secondary door?' },
        { role: 'user', text: 'Main entrance, I\'m locked out' },
        { role: 'agent', text: 'I\'ve created an urgent work order WO-0005. A locksmith will be dispatched within 2 hours.' },
      ]),
      outcome: JSON.stringify({ workOrderCreated: 'WO-0005', priority: 'URGENT', category: 'LOCKSMITH' }),
    },
  });
  console.log('  Agent Session: 1 completed voice intake (WO-0005)');

  // ─── Summary ──────────────────────────────────────
  console.log('\nSeed complete.');
  console.log('  Users: 8 (admin, manager, 3 technicians, 3 tenants)');
  console.log(`  Properties: ${prop1.name}, ${prop2.name}`);
  console.log('  Units: 8 total (4 occupied)');
  console.log('  Work Orders: 10 (2 REPORTED, 2 ASSIGNED, 2 IN_PROGRESS, 2 COMPLETED, 2 ESCALATED)');
  console.log('  Escalations: 3 active (WO-0010 L1+L2, WO-0009 L1)');
  console.log('  Schedules: Mike (2 stops), Lisa (2 stops), James (available)');
  console.log('  Agent Sessions: 1 completed voice intake');
  console.log('\n  Login with any email: password123');
  console.log('  Technicians: mike@opsly.io, lisa.tech@opsly.io, james.tech@opsly.io');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
