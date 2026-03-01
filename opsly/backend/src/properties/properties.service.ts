import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '@prisma/client';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { sanitizeText } from '../common/utils/sanitize.js';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePropertyDto) {
    const manager = await this.prisma.user.findUnique({
      where: { id: dto.managerId },
      select: { id: true, role: true, isActive: true },
    });

    if (!manager) {
      throw new NotFoundException(`Manager ${dto.managerId} not found`);
    }
    if (manager.role !== Role.MANAGER) {
      throw new BadRequestException('Assigned user is not a manager');
    }
    if (!manager.isActive) {
      throw new BadRequestException('Manager account is not active');
    }

    return this.prisma.property.create({
      data: {
        name: sanitizeText(dto.name, 200),
        address: sanitizeText(dto.address, 500),
        city: sanitizeText(dto.city, 100),
        managerId: manager.id,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.property.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        createdAt: true,
        manager: { select: { id: true, name: true } },
        _count: { select: { units: true, workOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        units: {
          select: {
            id: true,
            unitNumber: true,
            floor: true,
            isOccupied: true,
            tenant: { select: { id: true, name: true, email: true } },
          },
          orderBy: { unitNumber: 'asc' },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }

    return property;
  }

  async getUnits(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });

    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    return this.prisma.unit.findMany({
      where: { propertyId },
      select: {
        id: true,
        unitNumber: true,
        floor: true,
        isOccupied: true,
        tenant: { select: { id: true, name: true, email: true } },
      },
      orderBy: { unitNumber: 'asc' },
    });
  }
}
