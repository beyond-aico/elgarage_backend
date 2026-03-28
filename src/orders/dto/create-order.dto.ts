import {
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  partId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  /**
   * XOR guard A — fires when NEITHER partId nor serviceId is provided.
   * Result: "must have one" error.
   */
  @ValidateIf((o: OrderItemDto) => !o.partId && !o.serviceId)
  @IsNotEmpty({
    message: 'Each order item must have either a partId or a serviceId.',
  })
  _xorGuardNeither?: never;

  /**
   * XOR guard B — fires when BOTH partId and serviceId are provided.
   * Result: "must not have both" error.
   */
  @ValidateIf((o: OrderItemDto) => !!(o.partId && o.serviceId))
  @IsNotEmpty({
    message:
      'Each order item must have either a partId or a serviceId, not both.',
  })
  _xorGuardBoth?: never;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  carId!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
