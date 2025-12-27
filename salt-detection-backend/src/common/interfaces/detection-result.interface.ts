export interface BoundingBoxResult {
  x: number;           // normalized 0-1, top-left x
  y: number;           // normalized 0-1, top-left y
  width: number;       // normalized 0-1
  height: number;      // normalized 0-1
  classId: number;     // 0 = pure, 1 = impure
  className: string;   // "pure" or "impure"
  confidence: number;  // 0-1
  color: string;       // hex color for rendering
}

export interface DetectionResult {
  frameId: string;
  timestamp: number;
  processingTimeMs: number;

  // Counts
  pureCount: number;
  impureCount: number;
  totalCount: number;
  purityPercentage: number;

  // Bounding boxes for overlay
  boundingBoxes: BoundingBoxResult[];

  // Frame dimensions
  frameWidth: number;
  frameHeight: number;
}

export interface InferenceOutput {
  boxes: number[][];    // [x, y, w, h] in absolute pixels
  scores: number[];
  classIds: number[];
}
