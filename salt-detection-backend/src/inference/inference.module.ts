import { Module } from '@nestjs/common';
import { InferenceService } from './inference.service';
import { PreprocessingService } from './preprocessing.service';
import { PostprocessingService } from './postprocessing.service';

@Module({
  providers: [InferenceService, PreprocessingService, PostprocessingService],
  exports: [InferenceService],
})
export class InferenceModule {}
