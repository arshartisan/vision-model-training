import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { InferenceModule } from './inference/inference.module';
import { DetectionModule } from './detection/detection.module';
import { StatisticsModule } from './statistics/statistics.module';
import { HealthModule } from './health/health.module';
import { ROIModule } from './roi/roi.module';
import { BatchModule } from './batch/batch.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    InferenceModule,
    DetectionModule,
    StatisticsModule,
    HealthModule,
    ROIModule,
    BatchModule,
  ],
})
export class AppModule {}
