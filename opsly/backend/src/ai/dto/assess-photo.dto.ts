import { IsString, IsNotEmpty } from 'class-validator';

export class AssessPhotoDto {
  @IsString()
  @IsNotEmpty()
  imageBase64!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}
