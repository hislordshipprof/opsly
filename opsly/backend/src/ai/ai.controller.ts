import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { VoiceService } from './voice.service.js';
import { VisionService } from './vision.service.js';
import { InsightsService } from './insights.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { ChatDto } from './dto/chat.dto.js';
import { EndVoiceSessionDto } from './dto/voice-session.dto.js';
import { AssessPhotoDto } from './dto/assess-photo.dto.js';
import { MaintenanceTipsDto } from './dto/maintenance-tips.dto.js';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly voiceService: VoiceService,
    private readonly visionService: VisionService,
    private readonly insightsService: InsightsService,
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

  /** Standalone photo assessment — no work order required */
  @Post('assess-photo')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  async assessPhoto(@Body() dto: AssessPhotoDto) {
    const result = await this.visionService.assessPhoto(dto.imageBase64, dto.mimeType);
    return { assessment: result };
  }

  /** AI maintenance tips for a reported issue */
  @Post('maintenance-tips')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  async getMaintenanceTips(@Body() dto: MaintenanceTipsDto) {
    const tips = await this.insightsService.getMaintenanceTips(dto.issueCategory, dto.issueDescription);
    return { tips };
  }

  /** AI-generated insights summary for the current tenant */
  @Get('tenant-insights')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  async getTenantInsights(@Request() req: any) {
    const summary = await this.insightsService.getTenantInsights(req.user.userId);
    return { summary };
  }

  /** Recap of the tenant's last AI session */
  @Get('session-recap')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  async getSessionRecap(@Request() req: any) {
    const recap = await this.insightsService.getSessionRecap(req.user.userId);
    return recap ?? { recap: null, sessionAge: null };
  }
}
