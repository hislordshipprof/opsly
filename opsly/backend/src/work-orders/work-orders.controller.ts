import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CreateWorkOrderDto } from './dto/create-work-order.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { AssignTechnicianDto } from './dto/assign-technician.dto.js';
import { QueryWorkOrdersDto } from './dto/query-work-orders.dto.js';
import { UploadPhotoDto } from './dto/upload-photo.dto.js';

@Controller('work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @Roles(Role.TENANT, Role.MANAGER, Role.ADMIN)
  create(@Body() dto: CreateWorkOrderDto, @Request() req: any) {
    return this.workOrdersService.create(dto, req.user.userId);
  }

  @Get()
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  findAll(@Query() query: QueryWorkOrdersDto, @Request() req: any) {
    return this.workOrdersService.findAll(query, req.user.userId, req.user.role);
  }

  @Get(':id')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.workOrdersService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id/status')
  @Roles(Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req: any,
  ) {
    return this.workOrdersService.updateStatus(
      id, dto, req.user.userId, req.user.role,
    );
  }

  @Patch(':id/assign')
  @Roles(Role.MANAGER, Role.ADMIN)
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTechnicianDto,
    @Request() req: any,
  ) {
    return this.workOrdersService.assign(
      id, dto, req.user.userId, req.user.role,
    );
  }

  @Post(':id/photos')
  @Roles(Role.TENANT, Role.MANAGER, Role.ADMIN)
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadPhotoDto,
    @Request() req: any,
  ) {
    return this.workOrdersService.uploadPhoto(
      id, dto.imageBase64, dto.mimeType, req.user.userId, req.user.role,
    );
  }

  @Get(':id/events')
  @Roles(Role.TENANT, Role.TECHNICIAN, Role.MANAGER, Role.ADMIN)
  getEvents(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.workOrdersService.getEvents(id, req.user.userId, req.user.role);
  }
}
