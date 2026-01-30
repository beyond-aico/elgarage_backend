import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceCategory } from '@prisma/client';

export class CreateServiceDto {
  @ApiProperty({ example: 'Full Synthetic Oil Change' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Includes filter replacement and 5L of oil' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ServiceCategory, example: ServiceCategory.OIL })
  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @ApiProperty({ example: 50.0, description: 'Base price of the service' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  basePrice!: number;

  @ApiProperty({ example: 45, description: 'Duration in minutes' })
  @IsNumber()
  @Min(15)
  @Type(() => Number)
  durationMinutes!: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
