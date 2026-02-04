import { 
  IsNotEmpty, 
  IsUUID, 
  IsArray, 
  ValidateNested, 
  IsOptional, 
  IsInt, 
  Min 
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsOptional()
  @IsUUID()
  partId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  carId!: string; // Which car is this for?

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[]; // The list of things to buy
}