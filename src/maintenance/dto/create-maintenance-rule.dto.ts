import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateMaintenanceRuleDto {
  @IsNotEmpty()
  @IsUUID()
  serviceId!: string; // e.g. "Oil Change" ID

  @IsNotEmpty()
  @IsUUID()
  modelId!: string;   // e.g. "Toyota Corolla" ID (This is the new DNA link)

  @IsOptional()
  @IsInt()
  @Min(1000)
  intervalKm?: number; // e.g. 10000

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMonths?: number; // e.g. 12
}