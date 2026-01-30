import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiPropertyOptional({
    description: 'ID of the Part (Inventory)',
    example: 'uuid-part',
  })
  @IsOptional()
  @IsUUID()
  partId?: string;

  @ApiPropertyOptional({
    description: 'ID of the Service',
    example: 'uuid-service',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({ example: 1, description: 'Quantity of the item' })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'The ID of the car being serviced' })
  @IsUUID()
  @IsNotEmpty()
  carId!: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'List of parts or services',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
