import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class PreprocessingService {
  private readonly inputSize: number;

  constructor() {
    this.inputSize = parseInt(process.env.INPUT_SIZE || '320', 10);
  }

  /**
   * Preprocess image buffer for YOLO inference
   * - Resize to model input size
   * - Convert to RGB
   * - Normalize to 0-1 range
   * - Convert to NCHW format (batch, channels, height, width)
   */
  async preprocess(imageBuffer: Buffer): Promise<{
    tensor: Float32Array;
    originalWidth: number;
    originalHeight: number;
  }> {
    // Get original dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width || this.inputSize;
    const originalHeight = metadata.height || this.inputSize;

    // Resize and convert to raw RGB
    const resizedBuffer = await sharp(imageBuffer)
      .resize(this.inputSize, this.inputSize, {
        fit: 'fill',
        kernel: 'lanczos3',
      })
      .removeAlpha()
      .raw()
      .toBuffer();

    // Create Float32Array in NCHW format
    const tensor = new Float32Array(1 * 3 * this.inputSize * this.inputSize);

    // Convert HWC (height, width, channels) to NCHW and normalize to 0-1
    for (let y = 0; y < this.inputSize; y++) {
      for (let x = 0; x < this.inputSize; x++) {
        const srcIdx = (y * this.inputSize + x) * 3;
        const r = resizedBuffer[srcIdx] / 255.0;
        const g = resizedBuffer[srcIdx + 1] / 255.0;
        const b = resizedBuffer[srcIdx + 2] / 255.0;

        // NCHW format: batch 0, channel R/G/B, height y, width x
        const pixelIndex = y * this.inputSize + x;
        tensor[0 * this.inputSize * this.inputSize + pixelIndex] = r; // R channel
        tensor[1 * this.inputSize * this.inputSize + pixelIndex] = g; // G channel
        tensor[2 * this.inputSize * this.inputSize + pixelIndex] = b; // B channel
      }
    }

    return { tensor, originalWidth, originalHeight };
  }
}
