import { IsUUID } from 'class-validator';

export class AssignTenantDto {
  @IsUUID()
  tenantId!: string;
}
