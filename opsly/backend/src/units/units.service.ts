import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '@prisma/client';
import { AssignTenantDto } from './dto/assign-tenant.dto.js';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string, userId: string, userRole: Role) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, name: true, address: true } },
        tenant: { select: { id: true, name: true, email: true } },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Unit ${id} not found`);
    }

    // Tenants can only view their own unit
    if (userRole === Role.TENANT && unit.tenantId !== userId) {
      throw new ForbiddenException('You can only view your own unit');
    }

    return unit;
  }

  async findByTenant(tenantId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { tenantId },
      include: {
        property: { select: { id: true, name: true, address: true } },
      },
    });

    if (!unit) {
      throw new NotFoundException(`No unit found for tenant ${tenantId}`);
    }

    return unit;
  }

  async assignTenant(id: string, dto: AssignTenantDto) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      select: { id: true, tenantId: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit ${id} not found`);
    }

    const tenant = await this.prisma.user.findUnique({
      where: { id: dto.tenantId },
      select: { id: true, role: true, isActive: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${dto.tenantId} not found`);
    }
    if (tenant.role !== Role.TENANT) {
      throw new BadRequestException('User is not a tenant');
    }
    if (!tenant.isActive) {
      throw new BadRequestException('Tenant account is not active');
    }

    // Check if tenant is already assigned to another unit
    const existingUnit = await this.prisma.unit.findUnique({
      where: { tenantId: dto.tenantId },
      select: { id: true, unitNumber: true },
    });

    if (existingUnit && existingUnit.id !== id) {
      throw new BadRequestException(
        `Tenant is already assigned to unit ${existingUnit.unitNumber}`,
      );
    }

    return this.prisma.unit.update({
      where: { id },
      data: {
        tenantId: tenant.id,
        isOccupied: true,
      },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
