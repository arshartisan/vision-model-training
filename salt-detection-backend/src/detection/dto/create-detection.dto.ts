import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BoundingBoxDto {
  @ApiProperty({ description: 'Normalized x coordinate (0-1)', example: 0.25 })
  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @ApiProperty({ description: 'Normalized y coordinate (0-1)', example: 0.25 })
  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  @ApiProperty({ description: 'Normalized width (0-1)', example: 0.1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  width: number;

  @ApiProperty({ description: 'Normalized height (0-1)', example: 0.1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  height: number;

  @ApiProperty({ description: 'Class ID (0=pure, 1=impure)', example: 0 })
  @IsNumber()
  classId: number;

  @ApiProperty({ description: 'Class name', example: 'pure' })
  @IsString()
  className: string;

  @ApiProperty({ description: 'Confidence score (0-1)', example: 0.95 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;
}

export class CreateDetectionDto {
  @ApiProperty({ description: 'Frame width in pixels', example: 1280 })
  @IsNumber()
  frameWidth: number;

  @ApiProperty({ description: 'Frame height in pixels', example: 720 })
  @IsNumber()
  frameHeight: number;

  @ApiProperty({ description: 'Processing time in milliseconds', example: 45.5 })
  @IsNumber()
  processingTimeMs: number;

  @ApiProperty({ description: 'Session ID', required: false })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({ description: 'Batch ID', required: false })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiProperty({ description: 'ROI pure count', required: false })
  @IsNumber()
  @IsOptional()
  roiPureCount?: number;

  @ApiProperty({ description: 'ROI impure count', required: false })
  @IsNumber()
  @IsOptional()
  roiImpureCount?: number;

  @ApiProperty({ description: 'ROI total count', required: false })
  @IsNumber()
  @IsOptional()
  roiTotalCount?: number;

  @ApiProperty({ description: 'ROI purity percentage', required: false })
  @IsNumber()
  @IsOptional()
  roiPurityPercentage?: number;

  @ApiProperty({ type: [BoundingBoxDto], description: 'Detected bounding boxes' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoundingBoxDto)
  boundingBoxes: BoundingBoxDto[];
}
