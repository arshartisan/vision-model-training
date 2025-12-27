import { Module } from '@nestjs/common';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { DetectionGateway } from './detection.gateway';
import { InferenceModule } from '../inference/inference.module';

@Module({
  imports: [InferenceModule],
  controllers: [DetectionController],
  providers: [DetectionService, DetectionGateway],
  exports: [DetectionService],
})
export class DetectionModule {}
