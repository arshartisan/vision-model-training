import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BatchService } from './batch.service';
import { BatchFilterDto } from './dto/batch-filter.dto';

@ApiTags('batches')
@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get()
  @ApiOperation({ summary: 'Get all batches with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated batches' })
  findAll(@Query() filter: BatchFilterDto) {
    return this.batchService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single batch by ID' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiResponse({ status: 200, description: 'Returns the batch' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  findOne(@Param('id') id: string) {
    return this.batchService.getBatch(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a batch' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiResponse({ status: 200, description: 'Batch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  remove(@Param('id') id: string) {
    return this.batchService.remove(id);
  }
}
