import { IsISO8601 } from 'class-validator';

export class UpdateStopEtaDto {
  @IsISO8601()
  eta!: string;
}
