import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetAnalyticsFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering fuel logs',
    example: '2026-03-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering fuel logs',
    example: '2026-03-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  endDate?: string;
}
