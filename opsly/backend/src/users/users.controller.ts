import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.MANAGER, Role.ADMIN)
  findAll(@Query('role') role?: string) {
    const validRole = role && Object.values(Role).includes(role as Role)
      ? (role as Role)
      : undefined;
    return this.usersService.findByRole(validRole);
  }
}
