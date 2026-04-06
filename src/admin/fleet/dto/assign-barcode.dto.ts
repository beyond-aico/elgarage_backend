import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class AssignBarcodeDto {
  @ApiProperty({
    example: 'FLT-VODA-042',
    description:
      'Barcode string to assign to this fleet vehicle. ' +
      'Allowed characters: letters, numbers, hyphens, underscores.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\w-]+$/, {
    message:
      'Barcode may only contain letters, numbers, hyphens and underscores',
  })
  barcode!: string;
}
