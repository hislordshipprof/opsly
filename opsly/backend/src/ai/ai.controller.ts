import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { ChatDto } from './dto/chat.dto.js';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  async chat(@Body() dto: ChatDto, @Request() req: any) {
    return this.chatService.chat({
      userId: req.user.userId,
      userName: req.user.email?.split('@')[0] || 'User',
      userRole: req.user.role,
      message: dto.message,
      sessionId: dto.sessionId,
    });
  }
}
