import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InferenceService } from '../inference/inference.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly inferenceService: InferenceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async check() {
    const modelStatus = this.inferenceService.getModelStatus();

    let databaseStatus = 'healthy';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'unhealthy';
    }

    return {
      status: modelStatus.loaded && databaseStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      model: {
        loaded: modelStatus.loaded,
        path: modelStatus.path,
      },
      database: {
        status: databaseStatus,
      },
    };
  }
}
