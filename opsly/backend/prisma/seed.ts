import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding OPSLY database...');

  const password = await bcrypt.hash('password123', 10);

  // ─── Users (1 per role) ──────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@opsly.io' },
    update: {},
    create: {
      name: 'James Admin',
      email: 'admin@opsly.io',
      passwordHash: password,
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'sarah@opsly.io' },
    update: {},
    create: {
      name: 'Sarah Manager',
      email: 'sarah@opsly.io',
      passwordHash: password,
      role: Role.MANAGER,
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'mike@opsly.io' },
    update: {},
    create: {
      name: 'Mike Thompson',
      email: 'mike@opsly.io',
      passwordHash: password,
      role: Role.TECHNICIAN,
    },
  });

  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@opsly.io' },
    update: {},
    create: {
      name: 'Sarah Tenant',
      email: 'tenant@opsly.io',
      passwordHash: password,
      role: Role.TENANT,
    },
  });

  // ─── Properties (2) ─────────────────────────────────
  const prop1 = await prisma.property.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '12 Maple Street',
      address: '12 Maple Street',
      city: 'London',
      managerId: manager.id,
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: '45 Oak Avenue',
      address: '45 Oak Avenue',
      city: 'London',
      managerId: manager.id,
    },
  });

  // ─── Units (8 total: 5 in prop1, 3 in prop2) ────────
  const units = [
    { propertyId: prop1.id, unitNumber: '1A', floor: 1 },
    { propertyId: prop1.id, unitNumber: '2A', floor: 2 },
    { propertyId: prop1.id, unitNumber: '3A', floor: 3 },
    { propertyId: prop1.id, unitNumber: '4B', floor: 4, tenantId: tenant.id, isOccupied: true },
    { propertyId: prop1.id, unitNumber: '5B', floor: 5 },
    { propertyId: prop2.id, unitNumber: '101', floor: 1 },
    { propertyId: prop2.id, unitNumber: '102', floor: 1 },
    { propertyId: prop2.id, unitNumber: '201', floor: 2 },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: {
        propertyId_unitNumber: {
          propertyId: unit.propertyId,
          unitNumber: unit.unitNumber,
        },
      },
      update: {},
      create: unit,
    });
  }

  console.log('Seed complete.');
  console.log(`  Users: admin(${admin.id}), manager(${manager.id}), tech(${tech.id}), tenant(${tenant.id})`);
  console.log(`  Properties: ${prop1.name}, ${prop2.name}`);
  console.log('  Units: 8 total (tenant assigned to 4B)');
  console.log('\n  Login with any role: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
