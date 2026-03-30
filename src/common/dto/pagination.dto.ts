import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

export function paginate<T>(
  data: T[],
  total: number,
  pagination: PaginationDto,
): PaginatedResult<T> {
  return {
    data,
    total,
    skip: pagination.skip ?? 0,
    take: pagination.take ?? 20,
  };
}
