import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum StopStatusDto {
  PENDING = 'PENDING',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export class UpdateStopStatusDto {
  @IsEnum(StopStatusDto)
  status!: StopStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
