export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  classId: number;
  className: "pure" | "impure";
  confidence: number;
  color: string;
}

export interface Detection {
  id: string;
  timestamp: string;
  frameWidth: number;
  frameHeight: number;
  processingTimeMs: number;
  pureCount: number;
  impureCount: number;
  totalCount: number;
  purityPercentage: number;
  sessionId?: string;
  boundingBoxes: BoundingBox[];
}

export interface DetectionResult {
  frameId: string;
  timestamp: number;
  processingTimeMs: number;
  pureCount: number;
  impureCount: number;
  totalCount: number;
  purityPercentage: number;
  frameWidth: number;
  frameHeight: number;
  boundingBoxes: BoundingBox[];
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
  avgPurity: number;
}

export interface DailyStats {
  date: string;
  detections: number;
  pureCount: number;
  impureCount: number;
  avgPurity: number;
}

export interface TrendData {
  timestamp: string;
  purity: number;
}
