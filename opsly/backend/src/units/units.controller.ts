import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UnitsService } from './units.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { AssignTenantDto } from './dto/assign-tenant.dto.js';

@Controller('units')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get(':id')
  @Roles(Role.TENANT, Role.MANAGER, Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.unitsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id/tenant')
  @Roles(Role.ADMIN)
  assignTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTenantDto,
  ) {
    return this.unitsService.assignTenant(id, dto);
  }
}
