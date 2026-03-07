import { IsString, MinLength, MaxLength } from 'class-validator';

export class MaintenanceTipsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  issueCategory!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  issueDescription!: string;
}
