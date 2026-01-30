import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MaintenanceRecordResponseDto {
  @Expose()
  id!: string;

  @Expose()
  carId!: string;

  @Expose()
  serviceId!: string;

  @Expose()
  mileageKm!: number;

  @Expose()
  notes?: string | null;

  @Expose()
  performedAt!: Date;

  // Nested service name for frontend convenience
  @ApiProperty({ example: 'Oil Change' })
  @Expose()
  @Type(() => Object)
  service?: { name: string };

  constructor(partial: Partial<MaintenanceRecordResponseDto>) {
    Object.assign(this, partial);
  }
}
