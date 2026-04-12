import { IsInt, IsNotEmpty, IsString, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCarDto {
  // Added @IsUUID('4') — modelId must be a valid UUID v4.
  // Without this, any non-UUID string passes the validation pipe and only
  // fails later inside Prisma with a confusing database-level error instead
  // of a clean 400 Bad Request at the request boundary.
  @ApiProperty({ description: 'UUID of the car model' })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4', { message: 'modelId must be a valid UUID' })
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
