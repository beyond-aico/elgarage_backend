import { IsInt, IsNotEmpty, IsString, Length, Min, Max } from 'class-validator';

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
  @Length(17, 17, { message: 'VIN must be exactly 17 characters' })
  vin!: string;

  @IsNotEmpty()
  @IsString()
  plateNumber!: string;
}