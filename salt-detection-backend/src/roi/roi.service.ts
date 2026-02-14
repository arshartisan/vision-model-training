import { Injectable } from '@nestjs/common';
import { BoundingBoxResult } from '../common/interfaces/detection-result.interface';

export interface ROIConfig {
  x: number; // normalized 0-1, top-left x
  y: number; // normalized 0-1, top-left y
  width: number; // normalized 0-1
  height: number; // normalized 0-1
}

export interface ROIStats {
  pureCount: number;
  impureCount: number;
  unwantedCount: number;
  totalCount: number;
  purityPercentage: number;
}

export interface BoundingBoxWithROI extends BoundingBoxResult {
  insideROI: boolean;
}

@Injectable()
export class ROIService {
  private readonly DEFAULT_ROI: ROIConfig = {
    x: 0.05,
    y: 0.05,
    width: 0.9,
    height: 0.9,
  };

  getDefaultROI(): ROIConfig {
    return { ...this.DEFAULT_ROI };
  }

  /**
   * Check if a bounding box center point is inside the ROI
   */
  isInsideROI(box: BoundingBoxResult, roi: ROIConfig): boolean {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    return (
      centerX >= roi.x &&
      centerX <= roi.x + roi.width &&
      centerY >= roi.y &&
      centerY <= roi.y + roi.height
    );
  }

  /**
   * Filter bounding boxes to only those inside the ROI
   */
  filterByROI(boxes: BoundingBoxResult[], roi: ROIConfig): BoundingBoxResult[] {
    return boxes.filter((box) => this.isInsideROI(box, roi));
  }

  /**
   * Mark each bounding box with whether it's inside the ROI
   */
  markBoxesWithROI(
    boxes: BoundingBoxResult[],
    roi: ROIConfig,
  ): BoundingBoxWithROI[] {
    return boxes.map((box) => ({
      ...box,
      insideROI: this.isInsideROI(box, roi),
    }));
  }

  /**
   * Calculate purity statistics for boxes inside the ROI
   * classId 0 = impure, classId 1 = pure, classId 2 = unwanted
   * Purity excludes unwanted: pure / (pure + impure)
   */
  calculateROIStats(boxes: BoundingBoxResult[], roi: ROIConfig): ROIStats {
    const insideBoxes = this.filterByROI(boxes, roi);
    const pureCount = insideBoxes.filter((b) => b.classId === 1).length;
    const impureCount = insideBoxes.filter((b) => b.classId === 0).length;
    const unwantedCount = insideBoxes.filter((b) => b.classId === 2).length;
    const totalCount = insideBoxes.length;
    const saltCount = pureCount + impureCount;
    const purityPercentage =
      saltCount > 0 ? (pureCount / saltCount) * 100 : 100;

    return {
      pureCount,
      impureCount,
      unwantedCount,
      totalCount,
      purityPercentage,
    };
  }

  /**
   * Validate ROI configuration
   */
  validateROI(roi: ROIConfig): boolean {
    return (
      roi.x >= 0 &&
      roi.x <= 1 &&
      roi.y >= 0 &&
      roi.y <= 1 &&
      roi.width > 0 &&
      roi.width <= 1 &&
      roi.height > 0 &&
      roi.height <= 1 &&
      roi.x + roi.width <= 1 &&
      roi.y + roi.height <= 1
    );
  }
}
