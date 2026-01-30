import { Expose, Transform } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class PartResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  sku!: string;

  @Expose()
  description?: string | null;

  @Expose()
  quantity!: number;

  @Expose()
  lowStockThreshold!: number;

  @ApiProperty({ type: Number, example: 15.5 })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Prisma.Decimal ? value.toNumber() : (value as number),
  )
  price!: number | Prisma.Decimal;

  @Expose()
  location?: string | null;

  @Expose()
  createdAt!: Date;

  constructor(
    partial: Partial<PartResponseDto> | { price?: number | Prisma.Decimal },
  ) {
    Object.assign(this, partial);
    if (this.price instanceof Prisma.Decimal) {
      this.price = this.price.toNumber();
    }
  }
}
