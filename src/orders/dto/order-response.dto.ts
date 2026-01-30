import { Expose, Transform, Type } from 'class-transformer';
import { OrderStatus, Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemResponseDto {
  @Expose()
  id!: string;

  @Expose()
  partId?: string | null;

  @Expose()
  serviceId?: string | null;

  @Expose()
  quantity!: number;

  @ApiProperty({ type: Number, example: 50.0 })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Prisma.Decimal ? value.toNumber() : (value as number),
  )
  price!: number | Prisma.Decimal;

  // Include names for easier frontend display
  @Expose()
  @Transform(
    ({
      obj,
    }: {
      obj: { part?: { name?: unknown }; service?: { name?: unknown } };
    }): string | undefined => {
      const candidate = obj.part?.name ?? obj.service?.name;
      return typeof candidate === 'string' ? candidate : undefined;
    },
  )
  name?: string;

  constructor(partial: Partial<OrderItemResponseDto>) {
    Object.assign(this, partial);
    if (this.price instanceof Prisma.Decimal) {
      this.price = this.price.toNumber();
    }
  }
}

export class OrderResponseDto {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  carId!: string;

  @Expose()
  status!: OrderStatus;

  @ApiProperty({ type: Number, example: 150.0 })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Prisma.Decimal ? value.toNumber() : (value as number),
  )
  totalPrice!: number | Prisma.Decimal;

  @Expose()
  createdAt!: Date;

  @Expose()
  @Type(() => OrderItemResponseDto)
  items!: OrderItemResponseDto[];

  constructor(partial: Partial<OrderResponseDto>) {
    Object.assign(this, partial);
    if (this.totalPrice instanceof Prisma.Decimal) {
      this.totalPrice = this.totalPrice.toNumber();
    }
    if (this.items && Array.isArray(this.items)) {
      this.items = this.items.map((i) => new OrderItemResponseDto(i));
    }
  }
}
