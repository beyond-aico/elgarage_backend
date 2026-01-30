import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.IN_PROGRESS })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;
}
