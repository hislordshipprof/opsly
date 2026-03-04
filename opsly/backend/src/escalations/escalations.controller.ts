import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EscalationsService } from './escalations.service.js';
import { AcknowledgeEscalationDto } from './dto/acknowledge-escalation.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('escalations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EscalationsController {
  constructor(private readonly escalationsService: EscalationsService) {}

  /** GET /escalations — list active (unacknowledged) escalations */
  @Get()
  @Roles(Role.MANAGER, Role.ADMIN)
  findActive() {
    return this.escalationsService.findActive();
  }

  /** GET /escalations/work-order/:id — escalation history for a work order */
  @Get('work-order/:id')
  @Roles(Role.MANAGER, Role.ADMIN)
  findByWorkOrder(@Param('id') id: string) {
    return this.escalationsService.findByWorkOrder(id);
  }

  /** PATCH /escalations/:id/acknowledge — manager acknowledges an escalation */
  @Patch(':id/acknowledge')
  @Roles(Role.MANAGER, Role.ADMIN)
  acknowledge(
    @Param('id') id: string,
    @Body() dto: AcknowledgeEscalationDto,
    @Request() req: any,
  ) {
    return this.escalationsService.acknowledge(id, req.user.sub, dto.notes);
  }
}
