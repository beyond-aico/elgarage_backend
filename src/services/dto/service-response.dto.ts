import { Expose, Transform } from 'class-transformer';
import { ServiceCategory, Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description?: string | null;

  @Expose()
  category!: ServiceCategory;

  @ApiProperty({ type: Number, example: 50.0 })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Prisma.Decimal ? value.toNumber() : (value as number),
  )
  basePrice!: number | Prisma.Decimal;

  @Expose()
  durationMinutes!: number;

  @Expose()
  isActive?: boolean;

  @Expose()
  createdAt!: Date;

  constructor(
    partial:
      | Partial<ServiceResponseDto>
      | { basePrice?: number | Prisma.Decimal },
  ) {
    Object.assign(this, partial);
    if (this.basePrice instanceof Prisma.Decimal) {
      this.basePrice = this.basePrice.toNumber();
    }
  }
}
