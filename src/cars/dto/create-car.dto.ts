import {
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  Max,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateCarDto {
  @IsNotEmpty()
  @IsString()
  modelId!: string; // We link to the CarModel (Toyota Corolla), not just a string name

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @IsInt()
  @Min(0)
  mileageKm!: number;

  @IsNotEmpty()
  @IsString()
  color!: string;

  @IsNotEmpty()
  @IsString()
  plateNumber!: string;

  @IsBoolean()
  @IsOptional()
  isFleetVehicle?: boolean;

  @IsString()
  @IsOptional()
  barcode?: string;
}
