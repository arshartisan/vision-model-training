import { Module } from '@nestjs/common';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { DetectionGateway } from './detection.gateway';
import { InferenceModule } from '../inference/inference.module';
import { ROIModule } from '../roi/roi.module';
import { BatchModule } from '../batch/batch.module';

@Module({
  imports: [InferenceModule, ROIModule, BatchModule],
  controllers: [DetectionController],
  providers: [DetectionService, DetectionGateway],
  exports: [DetectionService],
})
export class DetectionModule {}
