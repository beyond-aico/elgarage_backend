import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePartDto {
  @ApiProperty({ example: 'Oil Filter Type A' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'FIL-001', description: 'Unique Stock Keeping Unit' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiPropertyOptional({ example: 'Compatible with Toyota/Honda 2015+' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 100, description: 'Initial stock quantity' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity!: number;

  @ApiProperty({ example: 10, description: 'Alert threshold for low stock' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  lowStockThreshold!: number;

  @ApiProperty({ example: 15.5, description: 'Price per unit' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price!: number;

  @ApiPropertyOptional({ example: 'Bin A-42' })
  @IsString()
  @IsOptional()
  location?: string;
}
