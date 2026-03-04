import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AcknowledgeEscalationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
