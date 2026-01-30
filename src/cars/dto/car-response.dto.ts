import { Exclude, Expose, Type } from 'class-transformer';

export class CarResponseDto {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  modelId!: string;

  @Expose()
  year!: number;

  @Expose()
  mileageKm!: number;

  @Expose()
  plateNumber!: string;

  @Expose()
  color!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  vin?: string | null;

  @Expose()
  @Type(() => Object)
  model?: any;

  constructor(partial: Partial<CarResponseDto>) {
    Object.assign(this, partial);
  }
}
