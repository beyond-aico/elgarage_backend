import { IsInt, IsNotEmpty, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCarDto {
  @ApiProperty({ description: 'UUID of the car model' })
  @IsNotEmpty()
  @IsString()
  modelId!: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @ApiProperty({ example: 45000 })
  @IsInt()
  @Min(0)
  mileageKm!: number;

  @ApiProperty({ example: 'White' })
  @IsNotEmpty()
  @IsString()
  color!: string;

  @ApiProperty({ example: 'ABC-1234' })
  @IsNotEmpty()
  @IsString()
  plateNumber!: string;

  // isFleetVehicle and barcode are intentionally excluded from user input.
  // They are set server-side based on ownership context:
  //   - Fleet cars (org-owned): isFleetVehicle = true
  //   - Personal cars (user-owned): isFleetVehicle = false
}
