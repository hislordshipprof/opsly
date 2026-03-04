import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AgentSessionsService } from './agent-sessions.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { QuerySessionsDto } from './dto/query-sessions.dto.js';

@Controller('agent-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentSessionsController {
  constructor(private readonly sessionsService: AgentSessionsService) {}

  @Get()
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  findAll(@Query() query: QuerySessionsDto, @Request() req: any) {
    return this.sessionsService.findAll(query, req.user.userId, req.user.role);
  }

  @Get(':id')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.sessionsService.findOne(id, req.user.userId, req.user.role);
  }

  @Post(':id/end')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  endSession(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.sessionsService.endSession(id, req.user.userId, req.user.role);
  }
}
