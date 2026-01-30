import { IsString } from 'class-validator';

export class CreateModelDto {
  @IsString()
  brandId!: string;

  @IsString()
  name!: string;
}
