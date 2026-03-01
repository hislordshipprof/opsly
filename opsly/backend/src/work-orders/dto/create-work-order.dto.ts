import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  IsArray,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';
import { IssueCategory, Priority } from '@prisma/client';

export class CreateWorkOrderDto {
  @IsUUID()
  unitId!: string;

  @IsEnum(IssueCategory)
  issueCategory!: IssueCategory;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  issueDescription!: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  photoUrls?: string[];
}
