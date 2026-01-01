import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchFilterDto {
  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ description: 'Start date filter', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date filter', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Session ID filter', required: false })
  @IsOptional()
  sessionId?: string;
}

export class PaginatedBatchResponseMeta {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrev: boolean;
}

export class PaginatedBatchResponse<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  meta: PaginatedBatchResponseMeta;
}
