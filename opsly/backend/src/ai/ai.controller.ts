import {
  Controller,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { VoiceService } from './voice.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { ChatDto } from './dto/chat.dto.js';
import { EndVoiceSessionDto } from './dto/voice-session.dto.js';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly voiceService: VoiceService,
  ) {}

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

  /** Returns ephemeral token + config for Gemini Live voice session */
  @Post('voice/token')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  async createVoiceToken(@Request() req: any) {
    return this.voiceService.createVoiceSession(
      req.user.userId,
      req.user.role,
      req.user.email?.split('@')[0] || 'User',
    );
  }

  /** End a voice session — saves transcript + outcome */
  @Post('voice/:sessionId/end')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  async endVoiceSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: EndVoiceSessionDto,
  ) {
    await this.voiceService.endVoiceSession(sessionId, dto.transcript, dto.outcome);
    return { success: true };
  }
}
