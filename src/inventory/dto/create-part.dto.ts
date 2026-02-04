import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsArray, 
  IsUUID, 
  Min 
} from 'class-validator';

export class CreatePartDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  sku!: string; // Stock Keeping Unit (Unique)

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  stockQty!: number;

  // THE SMART LINK: Array of Car Model IDs this part fits
  @IsArray()
  @IsUUID("4", { each: true })
  compatibleModelIds!: string[]; 
}