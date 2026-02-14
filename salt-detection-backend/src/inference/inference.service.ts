import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as ort from 'onnxruntime-node';
import { v4 as uuidv4 } from 'uuid';
import { PreprocessingService } from './preprocessing.service';
import { PostprocessingService } from './postprocessing.service';
import { DetectionResult } from '../common/interfaces/detection-result.interface';

@Injectable()
export class InferenceService implements OnModuleInit {
  private readonly logger = new Logger(InferenceService.name);
  private session: ort.InferenceSession | null = null;
  private readonly modelPath: string;
  private readonly inputSize: number;
  private isModelLoaded = false;

  constructor(
    private readonly preprocessingService: PreprocessingService,
    private readonly postprocessingService: PostprocessingService,
  ) {
    this.modelPath = process.env.MODEL_PATH || './models/best.onnx';
    this.inputSize = parseInt(process.env.INPUT_SIZE || '320', 10);
  }

  async onModuleInit() {
    await this.loadModel();
  }

  private async loadModel(): Promise<void> {
    try {
      this.logger.log(`Loading ONNX model from: ${this.modelPath}`);

      this.session = await ort.InferenceSession.create(this.modelPath, {
        executionProviders: ['cpu'], // Use 'cuda' if GPU available
        graphOptimizationLevel: 'all',
      });

      this.isModelLoaded = true;
      this.logger.log('ONNX model loaded successfully');
      this.logger.log(`Input names: ${this.session.inputNames}`);
      this.logger.log(`Output names: ${this.session.outputNames}`);

      // Warmup inference
      await this.warmup();
    } catch (error) {
      this.logger.error(`Failed to load ONNX model: ${error.message}`);
      throw error;
    }
  }

  private async warmup(): Promise<void> {
    this.logger.log('Warming up model...');

    // Create a dummy tensor for warmup
    const dummyTensor = new Float32Array(1 * 3 * this.inputSize * this.inputSize);
    const inputTensor = new ort.Tensor('float32', dummyTensor, [
      1,
      3,
      this.inputSize,
      this.inputSize,
    ]);

    const inputName = this.session!.inputNames[0];
    const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

    await this.session!.run(feeds);
    this.logger.log('Model warmup complete');
  }

  getModelStatus(): { loaded: boolean; path: string } {
    return {
      loaded: this.isModelLoaded,
      path: this.modelPath,
    };
  }

  /**
   * Run inference on an image buffer
   */
  async runInference(imageBuffer: Buffer): Promise<DetectionResult> {
    if (!this.session || !this.isModelLoaded) {
      throw new Error('Model not loaded');
    }

    const startTime = performance.now();

    // Preprocess image
    const { tensor, originalWidth, originalHeight } =
      await this.preprocessingService.preprocess(imageBuffer);

    // Create ONNX tensor
    const inputTensor = new ort.Tensor('float32', tensor, [
      1,
      3,
      this.inputSize,
      this.inputSize,
    ]);

    // Run inference
    const inputName = this.session.inputNames[0];
    const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };
    const results = await this.session.run(feeds);

    // Get output tensor
    const outputName = this.session.outputNames[0];
    const outputTensor = results[outputName];
    const outputData = outputTensor.data as Float32Array;

    // Debug: log output tensor shape and first few values
    this.logger.debug(`Output tensor shape: ${outputTensor.dims}`);
    this.logger.debug(`Output data length: ${outputData.length}`);
    this.logger.debug(`First 20 values: ${Array.from(outputData.slice(0, 20)).map(v => v.toFixed(4)).join(', ')}`);

    // Postprocess results
    const boundingBoxes = this.postprocessingService.processOutput(
      outputData,
      originalWidth,
      originalHeight,
    );

    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;

    // Calculate counts (classId 0=impure, classId 1=pure, classId 2=unwanted)
    const impureCount = boundingBoxes.filter((b) => b.classId === 0).length;
    const pureCount = boundingBoxes.filter((b) => b.classId === 1).length;
    const unwantedCount = boundingBoxes.filter((b) => b.classId === 2).length;
    const totalCount = boundingBoxes.length;
    // Purity excludes unwanted: pure / (pure + impure)
    const saltCount = pureCount + impureCount;
    const purityPercentage =
      saltCount > 0 ? (pureCount / saltCount) * 100 : 100;

    return {
      frameId: uuidv4(),
      timestamp: Date.now(),
      processingTimeMs,
      pureCount,
      impureCount,
      unwantedCount,
      totalCount,
      purityPercentage,
      boundingBoxes,
      frameWidth: originalWidth,
      frameHeight: originalHeight,
    };
  }
}
