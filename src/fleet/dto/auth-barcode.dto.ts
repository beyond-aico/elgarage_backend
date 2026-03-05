import { IsString, IsNotEmpty } from 'class-validator';

export class AuthBarcodeDto {
  @IsString()
  @IsNotEmpty()
  barcode: string;
}
