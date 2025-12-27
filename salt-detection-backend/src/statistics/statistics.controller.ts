import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get overall statistics summary' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns statistics summary' })
  getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getSummary(startDate, endDate);
  }

  @Get('hourly')
  @ApiOperation({ summary: 'Get hourly statistics breakdown' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Returns hourly statistics' })
  getHourlyStats(@Query('date') date?: string) {
    return this.statisticsService.getHourlyStats(date);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily statistics breakdown' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns daily statistics' })
  getDailyStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.statisticsService.getDailyStats(startDate, endDate, limit);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get purity trends over time' })
  @ApiQuery({ name: 'period', required: false, enum: ['hourly', 'daily', 'weekly'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns trend data' })
  getTrends(
    @Query('period') period?: 'hourly' | 'daily' | 'weekly',
    @Query('limit') limit?: number,
  ) {
    return this.statisticsService.getTrends(period, limit);
  }
}
