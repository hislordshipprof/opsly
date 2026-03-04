import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role, AgentSessionStatus } from '@prisma/client';
import { QuerySessionsDto } from './dto/query-sessions.dto.js';

@Injectable()
export class AgentSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySessionsDto, userId: string, userRole: Role) {
    const where: Record<string, unknown> = {};

    // RBAC: tenants/technicians see only their own sessions
    if (userRole === Role.TENANT || userRole === Role.TECHNICIAN) {
      where.userId = userId;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (query.channel) where.channel = query.channel;
    if (query.status) where.status = query.status;

    return this.prisma.agentSession.findMany({
      where,
      select: {
        id: true,
        channel: true,
        status: true,
        lastAgentName: true,
        startedAt: true,
        endedAt: true,
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: query.take ?? 50,
      skip: query.skip ?? 0,
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const session = await this.prisma.agentSession.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, role: true } },
        linkedWorkOrder: { select: { id: true, orderNumber: true } },
      },
    });

    if (!session) {
      throw new NotFoundException(`Agent session ${id} not found`);
    }

    // RBAC: tenants/technicians see only their own
    if (
      (userRole === Role.TENANT || userRole === Role.TECHNICIAN) &&
      session.userId !== userId
    ) {
      throw new ForbiddenException('You can only view your own sessions');
    }

    return session;
  }

  async endSession(id: string, userId: string, userRole: Role) {
    const session = await this.findOne(id, userId, userRole);

    if (session.status !== AgentSessionStatus.ACTIVE) {
      throw new BadRequestException('Session is not active');
    }

    return this.prisma.agentSession.update({
      where: { id },
      data: {
        status: AgentSessionStatus.COMPLETED,
        endedAt: new Date(),
      },
    });
  }
}
