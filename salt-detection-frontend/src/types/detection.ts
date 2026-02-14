export interface ROIConfig {
  x: number;      // normalized 0-1, top-left x
  y: number;      // normalized 0-1, top-left y
  width: number;  // normalized 0-1
  height: number; // normalized 0-1
}

export interface BoundingBox {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  classId: number;
  className: "pure" | "impure" | "unwanted";
  confidence: number;
  color: string;
  insideROI?: boolean;
  whitenessPercentage?: number;
  qualityScore?: number;
}

export interface Detection {
  id: string;
  timestamp: string;
  frameWidth: number;
  frameHeight: number;
  processingTimeMs: number;
  pureCount: number;
  impureCount: number;
  unwantedCount: number;
  totalCount: number;
  purityPercentage: number;
  sessionId?: string;
  batchId?: string;
  roiPureCount?: number;
  roiImpureCount?: number;
  roiUnwantedCount?: number;
  roiTotalCount?: number;
  roiPurityPercentage?: number;
  avgWhiteness?: number;
  avgQualityScore?: number;
  roiAvgWhiteness?: number;
  roiAvgQualityScore?: number;
  boundingBoxes: BoundingBox[];
}

export interface DetectionResult {
  frameId: string;
  timestamp: number;
  processingTimeMs: number;
  pureCount: number;
  impureCount: number;
  unwantedCount: number;
  totalCount: number;
  purityPercentage: number;
  frameWidth: number;
  frameHeight: number;
  boundingBoxes: BoundingBox[];
  // ROI-filtered counts
  roiPureCount?: number;
  roiImpureCount?: number;
  roiUnwantedCount?: number;
  roiTotalCount?: number;
  roiPurityPercentage?: number;
  // Whiteness metrics
  avgWhiteness?: number;
  avgQualityScore?: number;
  roiAvgWhiteness?: number;
  roiAvgQualityScore?: number;
  // ROI configuration
  roi?: ROIConfig;
  // Batch info
  currentBatchId?: string;
  currentBatchNumber?: number;
}

export interface BatchStats {
  pureCount: number;
  impureCount: number;
  unwantedCount: number;
  totalCount: number;
  purityPercentage: number;
  frameCount: number;
  avgWhiteness: number | null;
  avgQualityScore: number | null;
}

export interface BatchSummary {
  id: string;
  batchNumber: number;
  startTime: string;
  endTime: string | null;
  pureCount: number;
  impureCount: number;
  unwantedCount: number;
  totalCount: number;
  purityPercentage: number | null;
  frameCount: number;
  roi: ROIConfig;
  avgWhiteness: number | null;
  avgQualityScore: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface StatisticsSummary {
  totalDetections: number;
  totalPure: number;
  totalImpure: number;
  totalUnwanted: number;
  averagePurity: number;
  averageProcessingTime: number;
  detectionsPerHour: number;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface HourlyStats {
  hour: number;
  detections: number;
  pureCount: number;
  impureCount: number;
  unwantedCount: number;
  avgPurity: number;
}

export interface DailyStats {
  date: string;
  detections: number;
  pureCount: number;
  impureCount: number;
  unwantedCount: number;
  avgPurity: number;
}

export interface TrendData {
  timestamp: string;
  purity: number;
}
