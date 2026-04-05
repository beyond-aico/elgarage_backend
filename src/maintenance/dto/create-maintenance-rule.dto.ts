import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * At least one of intervalKm or intervalMonths must be provided.
 * The @ValidateIf guards below implement this XOR-minimum constraint:
 *   - intervalKm is required when intervalMonths is absent
 *   - intervalMonths is required when intervalKm is absent
 * A rule with both is valid; a rule with neither is rejected.
 */
export class CreateMaintenanceRuleDto {
  @ApiProperty({ description: 'UUID of the Service' })
  @IsNotEmpty()
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ description: 'UUID of the CarModel' })
  @IsNotEmpty()
  @IsUUID()
  modelId!: string;

  @ApiPropertyOptional({
    example: 10000,
    description:
      'Service interval in kilometres (required if intervalMonths is absent)',
  })
  @ValidateIf((o: CreateMaintenanceRuleDto) => o.intervalMonths == null)
  @IsInt({ message: 'intervalKm is required when intervalMonths is not set' })
  @Min(1000)
  @IsOptional()
  intervalKm?: number;

  @ApiPropertyOptional({
    example: 6,
    description:
      'Service interval in months (required if intervalKm is absent)',
  })
  @ValidateIf((o: CreateMaintenanceRuleDto) => o.intervalKm == null)
  @IsInt({ message: 'intervalMonths is required when intervalKm is not set' })
  @Min(1)
  @IsOptional()
  intervalMonths?: number;
}
