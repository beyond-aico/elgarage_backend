import {
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ required: false, description: 'UUID of the part to order' })
  @IsOptional()
  @IsUUID()
  partId?: string;

  @ApiProperty({ required: false, description: 'UUID of the service to order' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  /** Fires when NEITHER partId nor serviceId is provided */
  @ValidateIf((o: OrderItemDto) => !o.partId && !o.serviceId)
  @IsNotEmpty({
    message: 'Each order item must have either a partId or a serviceId.',
  })
  _xorGuardNeither?: never;

  /** Fires when BOTH partId and serviceId are provided */
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
  @ApiProperty({ description: 'UUID of the car this order is for' })
  @IsNotEmpty()
  @IsUUID()
  carId!: string;

  @ApiProperty({
    type: [OrderItemDto],
    description: 'At least one item (part or service) is required',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'An order must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
