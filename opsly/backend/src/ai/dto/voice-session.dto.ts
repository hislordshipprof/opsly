import { IsOptional, IsArray, ValidateNested, IsString, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class TranscriptEntry {
  @IsString()
  role!: string;

  @IsString()
  content!: string;
}

export class EndVoiceSessionDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranscriptEntry)
  transcript?: TranscriptEntry[];

  @IsOptional()
  @IsObject()
  outcome?: Record<string, unknown>;
}
