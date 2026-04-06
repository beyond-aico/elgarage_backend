import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAnalyticsFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering fuel logs',
    example: '2026-03-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering fuel logs',
    example: '2026-03-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
