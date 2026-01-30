import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCarDto {
  @ApiProperty({
    example: 'uuid-of-model',
    description: 'The ID of the car model',
  })
  @IsString()
  @IsNotEmpty()
  modelId!: string;

  @ApiProperty({ example: 2022, description: 'Manufacturing year' })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  @Type(() => Number)
  year!: number;

  @ApiProperty({ example: 15000, description: 'Current mileage in Kilometers' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  mileageKm!: number;

  @ApiProperty({ example: 'ABC-1234', description: 'License plate number' })
  @IsString()
  @IsNotEmpty()
  plateNumber!: string;

  @ApiPropertyOptional({
    example: 'SHMEGY123456',
    description: 'VIN or chassis number (optional in Egypt)',
  })
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiProperty({ example: 'Blue', description: 'Car color' })
  @IsString()
  @IsNotEmpty()
  color!: string;
}
