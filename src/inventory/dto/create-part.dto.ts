import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePartDto {
  @ApiProperty({ example: 'Air Filter' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'AF-12345',
    description: 'Unique Stock Keeping Unit',
  })
  @IsNotEmpty()
  @IsString()
  sku!: string;

  @ApiPropertyOptional({ example: 'OEM air filter for 1.6L engines' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({ example: 10, description: 'Initial stock quantity' })
  @IsInt()
  @Min(0)
  quantity!: number; // was stockQty — renamed to match Prisma schema

  @ApiPropertyOptional({
    example: 5,
    description: 'Alert threshold for low stock',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: 'Shelf A3' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    type: [String],
    description: 'UUIDs of car models this part is compatible with',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  compatibleModelIds!: string[];
}
