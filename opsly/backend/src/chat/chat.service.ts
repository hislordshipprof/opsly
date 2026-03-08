import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '@prisma/client';
import { sanitizeText } from '../common/utils/sanitize.js';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Validate that the user is a participant of the work order */
  private async validateParticipant(
    workOrderId: string,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    // Managers and admins can access any work order chat
    if (userRole === Role.MANAGER || userRole === Role.ADMIN) return;

    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { reportedById: true, assignedToId: true },
    });

    if (!wo) throw new NotFoundException(`Work order ${workOrderId} not found`);

    const isParticipant =
      wo.reportedById === userId || wo.assignedToId === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'You can only chat on work orders you are involved in',
      );
    }
  }

  async getMessages(
    workOrderId: string,
    userId: string,
    userRole: Role,
    take = 50,
    cursor?: string,
  ) {
    await this.validateParticipant(workOrderId, userId, userRole);

    return this.prisma.chatMessage.findMany({
      where: { workOrderId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  /** Get recent chat threads for the current user's work orders */
  async getThreads(userId: string, userRole: Role) {
    // Find work orders where this user is a participant
    const whereClause =
      userRole === Role.MANAGER || userRole === Role.ADMIN
        ? {} // managers see all
        : {
            OR: [
              { reportedById: userId },
              { assignedToId: userId },
            ],
          };

    const workOrders = await this.prisma.workOrder.findMany({
      where: {
        ...whereClause,
        chatMessages: { some: {} }, // only WOs with at least 1 message
      },
      select: {
        id: true,
        orderNumber: true,
        issueDescription: true,
        assignedTo: { select: { id: true, name: true, role: true } },
        reportedBy: { select: { id: true, name: true, role: true } },
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            sender: { select: { id: true, name: true, role: true } },
          },
        },
        _count: {
          select: { chatMessages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return workOrders.map((wo) => ({
      workOrderId: wo.id,
      orderNumber: wo.orderNumber,
      issueDescription: wo.issueDescription,
      assignedTo: wo.assignedTo,
      reportedBy: wo.reportedBy,
      lastMessage: wo.chatMessages[0] ?? null,
      totalMessages: wo._count.chatMessages,
    }));
  }

  async sendMessage(
    workOrderId: string,
    userId: string,
    userRole: Role,
    content: string,
  ) {
    await this.validateParticipant(workOrderId, userId, userRole);

    const sanitized = sanitizeText(content, 2000);

    const message = await this.prisma.chatMessage.create({
      data: { workOrderId, senderId: userId, content: sanitized },
      select: {
        id: true,
        workOrderId: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    this.logger.log(
      `Chat message sent on WO ${workOrderId} by ${userId}`,
    );

    return message;
  }
}
