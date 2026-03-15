import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto.js';
import { OpslyGateway } from '../websocket/opsly.gateway.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly gateway: OpslyGateway,
    private readonly prisma: PrismaService,
  ) {}

  @Get('threads')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  getThreads(@Request() req: any) {
    return this.chatService.getThreads(req.user.userId, req.user.role);
  }

  @Get(':workOrderId/messages')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  getMessages(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
    @Request() req?: any,
  ) {
    return this.chatService.getMessages(
      workOrderId,
      req.user.userId,
      req.user.role,
      take ? parseInt(take, 10) : 50,
      cursor,
    );
  }

  @Post(':workOrderId/messages')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  async sendMessage(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Body() dto: SendMessageDto,
    @Request() req: any,
  ) {
    const message = await this.chatService.sendMessage(
      workOrderId,
      req.user.userId,
      req.user.role,
      dto.content,
    );

    // Look up WO participants so notification badges update in real-time
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { reportedById: true, assignedToId: true },
    });
    const participantIds = [wo?.reportedById, wo?.assignedToId].filter(
      (id): id is string => !!id,
    );

    // Emit via WebSocket to work order room + personal rooms
    this.gateway.emitChatMessage(workOrderId, message, participantIds);

    return message;
  }
}
