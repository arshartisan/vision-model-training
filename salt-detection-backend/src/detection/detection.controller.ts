import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DetectionService } from './detection.service';
import { CreateDetectionDto } from './dto/create-detection.dto';
import { DetectionFilterDto } from './dto/detection-filter.dto';

@ApiTags('detections')
@Controller('detections')
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new detection record' })
  @ApiResponse({ status: 201, description: 'Detection created successfully' })
  create(@Body() createDetectionDto: CreateDetectionDto) {
    return this.detectionService.create(createDetectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all detections with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated detections' })
  findAll(@Query() filter: DetectionFilterDto) {
    return this.detectionService.findAll(filter);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent detections' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns recent detections' })
  getRecent(@Query('limit') limit?: number) {
    return this.detectionService.getRecentDetections(limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single detection by ID' })
  @ApiParam({ name: 'id', description: 'Detection ID' })
  @ApiResponse({ status: 200, description: 'Returns the detection' })
  @ApiResponse({ status: 404, description: 'Detection not found' })
  findOne(@Param('id') id: string) {
    return this.detectionService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a detection' })
  @ApiParam({ name: 'id', description: 'Detection ID' })
  @ApiResponse({ status: 200, description: 'Detection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Detection not found' })
  remove(@Param('id') id: string) {
    return this.detectionService.remove(id);
  }
}
