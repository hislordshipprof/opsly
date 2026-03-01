import {
  PrismaClient,
  Role,
  IssueCategory,
  WorkOrderStatus,
  Priority,
  WorkOrderEventType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding OPSLY database...');

  const password = await bcrypt.hash('password123', 10);

  // ─── Users ─────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@opsly.io' },
    update: {},
    create: { name: 'James Admin', email: 'admin@opsly.io', passwordHash: password, role: Role.ADMIN },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'sarah@opsly.io' },
    update: {},
    create: { name: 'Sarah Manager', email: 'sarah@opsly.io', passwordHash: password, role: Role.MANAGER },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'mike@opsly.io' },
    update: {},
    create: { name: 'Mike Thompson', email: 'mike@opsly.io', passwordHash: password, role: Role.TECHNICIAN },
  });

  const tenant1 = await prisma.user.upsert({
    where: { email: 'tenant@opsly.io' },
    update: {},
    create: { name: 'Sarah Tenant', email: 'tenant@opsly.io', passwordHash: password, role: Role.TENANT },
  });

  const tenant2 = await prisma.user.upsert({
    where: { email: 'david@opsly.io' },
    update: {},
    create: { name: 'David Renter', email: 'david@opsly.io', passwordHash: password, role: Role.TENANT },
  });

  const tenant3 = await prisma.user.upsert({
    where: { email: 'lisa@opsly.io' },
    update: {},
    create: { name: 'Lisa Chen', email: 'lisa@opsly.io', passwordHash: password, role: Role.TENANT },
  });

  // ─── Properties (2) ───────────────────────────────
  const prop1 = await prisma.property.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '12 Maple Street', address: '12 Maple Street', city: 'London', managerId: manager.id,
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
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
    const unit = await prisma.unit.upsert({
      where: { propertyId_unitNumber: { propertyId: def.propertyId, unitNumber: def.unitNumber } },
      update: {},
      create: def,
    });
    units[def.unitNumber] = { id: unit.id, propertyId: def.propertyId };
  }

  // ─── Work Orders (10) ─────────────────────────────
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

  const workOrders = [
    // 2x REPORTED (new, unassigned)
    {
      orderNumber: 'WO-0001', unit: '4B', reporter: tenant1.id,
      category: IssueCategory.PLUMBING, description: 'Kitchen sink is leaking under the cabinet, water pooling on floor',
      status: WorkOrderStatus.REPORTED, priority: Priority.HIGH,
      slaDeadline: hoursFromNow(3), createdAt: hoursAgo(1),
    },
    {
      orderNumber: 'WO-0002', unit: '101', reporter: tenant3.id,
      category: IssueCategory.ELECTRICAL, description: 'Living room ceiling light flickers constantly and makes buzzing noise',
      status: WorkOrderStatus.REPORTED, priority: Priority.MEDIUM,
      slaDeadline: hoursFromNow(22), createdAt: hoursAgo(2),
    },

    // 2x ASSIGNED (assigned to technician)
    {
      orderNumber: 'WO-0003', unit: '2A', reporter: tenant2.id, assignee: tech.id,
      category: IssueCategory.HVAC, description: 'Air conditioning unit not cooling, blowing warm air only',
      status: WorkOrderStatus.ASSIGNED, priority: Priority.HIGH,
      slaDeadline: hoursFromNow(2), createdAt: hoursAgo(2),
    },
    {
      orderNumber: 'WO-0004', unit: '4B', reporter: tenant1.id, assignee: tech.id,
      category: IssueCategory.APPLIANCE, description: 'Dishwasher not draining properly after wash cycle completes',
      status: WorkOrderStatus.ASSIGNED, priority: Priority.MEDIUM,
      slaDeadline: hoursFromNow(20), createdAt: hoursAgo(4),
    },

    // 2x IN_PROGRESS (technician working)
    {
      orderNumber: 'WO-0005', unit: '101', reporter: tenant3.id, assignee: tech.id,
      category: IssueCategory.LOCKSMITH, description: 'Front door lock mechanism is jammed, key turns but door does not open',
      status: WorkOrderStatus.IN_PROGRESS, priority: Priority.URGENT,
      slaDeadline: hoursFromNow(0.5), createdAt: hoursAgo(1.5),
    },
    {
      orderNumber: 'WO-0006', unit: '2A', reporter: tenant2.id, assignee: tech.id,
      category: IssueCategory.STRUCTURAL, description: 'Crack appearing along bedroom wall near the window frame',
      status: WorkOrderStatus.IN_PROGRESS, priority: Priority.LOW,
      slaDeadline: hoursFromNow(60), createdAt: hoursAgo(12),
    },

    // 2x COMPLETED (resolved)
    {
      orderNumber: 'WO-0007', unit: '4B', reporter: tenant1.id, assignee: tech.id,
      category: IssueCategory.PEST, description: 'Ants found in kitchen near the sink area, multiple trails visible',
      status: WorkOrderStatus.COMPLETED, priority: Priority.MEDIUM,
      slaDeadline: hoursAgo(10), createdAt: hoursAgo(34), completedAt: hoursAgo(12),
      resolutionNotes: 'Applied treatment to kitchen perimeter and sealed entry points',
    },
    {
      orderNumber: 'WO-0008', unit: '101', reporter: tenant3.id, assignee: tech.id,
      category: IssueCategory.PLUMBING, description: 'Bathroom faucet dripping continuously, wasting water',
      status: WorkOrderStatus.COMPLETED, priority: Priority.LOW,
      slaDeadline: hoursAgo(20), createdAt: hoursAgo(92), completedAt: hoursAgo(24),
      resolutionNotes: 'Replaced faucet washer and tightened connections',
    },

    // 1x URGENT (breaching SLA soon)
    {
      orderNumber: 'WO-0009', unit: '2A', reporter: tenant2.id,
      category: IssueCategory.PLUMBING, description: 'Water heater making loud banging noises and leaking from the base',
      status: WorkOrderStatus.REPORTED, priority: Priority.URGENT,
      slaDeadline: hoursFromNow(0.5), createdAt: hoursAgo(1.5),
    },

    // 1x ESCALATED (already breached SLA)
    {
      orderNumber: 'WO-0010', unit: '4B', reporter: tenant1.id,
      category: IssueCategory.ELECTRICAL, description: 'Multiple power outlets in bedroom stopped working simultaneously',
      status: WorkOrderStatus.ESCALATED, priority: Priority.URGENT,
      slaDeadline: hoursAgo(1), slaBreached: true, createdAt: hoursAgo(3),
    },
  ];

  for (const wo of workOrders) {
    const unit = units[wo.unit]!;
    await prisma.workOrder.upsert({
      where: { orderNumber: wo.orderNumber },
      update: {},
      create: {
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

  console.log('Seed complete.');
  console.log(`  Users: 6 (admin, manager, technician, 3 tenants)`);
  console.log(`  Properties: ${prop1.name}, ${prop2.name}`);
  console.log('  Units: 8 total (4 occupied)');
  console.log('  Work Orders: 10 (2 REPORTED, 2 ASSIGNED, 2 IN_PROGRESS, 2 COMPLETED, 1 URGENT, 1 ESCALATED)');
  console.log('\n  Login with any email: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
