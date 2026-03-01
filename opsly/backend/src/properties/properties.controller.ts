import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PropertiesService } from './properties.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CreatePropertyDto } from './dto/create-property.dto.js';

@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get()
  @Roles(Role.MANAGER, Role.ADMIN)
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.findOne(id);
  }

  @Get(':id/units')
  @Roles(Role.MANAGER, Role.ADMIN)
  getUnits(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.getUnits(id);
  }
}
