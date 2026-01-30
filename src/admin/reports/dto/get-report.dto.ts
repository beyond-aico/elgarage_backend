import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetReportDto {
  @ApiPropertyOptional({
    description: 'Start date for the report range (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the report range (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
