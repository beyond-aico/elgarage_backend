import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateMaintenanceRuleDto {
  @ApiProperty({ description: 'ID of the Service (e.g., Oil Change)' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Interval in Kilometers',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  intervalKm?: number;

  @ApiPropertyOptional({ example: 6, description: 'Interval in Months' })
  @IsInt()
  @Min(1)
  @IsOptional()
  intervalMonths?: number;
}
