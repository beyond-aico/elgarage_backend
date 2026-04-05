import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { FuelType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFuelLogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  carId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  odometerKms: number;

  @ApiProperty({ enum: FuelType })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  liters: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalCost: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
