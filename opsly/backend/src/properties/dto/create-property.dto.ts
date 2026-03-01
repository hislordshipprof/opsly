import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @IsUUID()
  managerId!: string;
}
