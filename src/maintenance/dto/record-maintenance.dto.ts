import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class RecordMaintenanceDto {
  @ApiProperty({ description: 'ID of the Service performed' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({
    example: 50000,
    description: 'Car mileage at time of service',
  })
  @IsInt()
  @Min(0)
  mileageKm!: number;

  @ApiPropertyOptional({ description: 'Date performed', default: 'now' })
  @IsDateString()
  @IsOptional()
  performedAt?: string;

  @ApiPropertyOptional({ description: 'Notes from the mechanic' })
  @IsString()
  @IsOptional()
  notes?: string;
}
