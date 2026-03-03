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
import { SchedulesService } from './schedules.service.js';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto.js';
import { UpdateStopEtaDto } from './dto/update-stop-eta.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  /** GET /schedules — technician sees their own schedule for a given date */
  @Get()
  @Roles(Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  getSchedule(@Request() req: any, @Query('date') date?: string) {
    return this.schedulesService.getTechnicianSchedule(req.user.sub, date);
  }

  /** PATCH /schedules/stops/:id/status — update a stop's status */
  @Patch('stops/:id/status')
  @Roles(Role.TECHNICIAN)
  updateStopStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStopStatusDto,
    @Request() req: any,
  ) {
    return this.schedulesService.updateStopStatus(
      id,
      req.user.sub,
      dto.status as any,
      dto.notes,
    );
  }

  /** PATCH /schedules/stops/:id/eta — update a stop's ETA */
  @Patch('stops/:id/eta')
  @Roles(Role.TECHNICIAN)
  updateStopEta(
    @Param('id') id: string,
    @Body() dto: UpdateStopEtaDto,
    @Request() req: any,
  ) {
    return this.schedulesService.updateStopEta(id, req.user.sub, dto.eta);
  }
}
