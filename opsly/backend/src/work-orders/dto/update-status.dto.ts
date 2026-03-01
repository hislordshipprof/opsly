import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(WorkOrderStatus)
  status!: WorkOrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
