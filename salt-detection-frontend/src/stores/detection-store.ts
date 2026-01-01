import { create } from "zustand";
import { DetectionResult, ROIConfig, BatchStats, BatchSummary } from "@/types/detection";

const DEFAULT_ROI: ROIConfig = {
  x: 0.05,
  y: 0.05,
  width: 0.9,
  height: 0.9,
};

interface DetectionState {
  // Connection state
  isConnected: boolean;
  isModelLoaded: boolean;
  isStreaming: boolean;
  sessionId: string | null;

  // Current detection
  currentResult: DetectionResult | null;
  recentResults: DetectionResult[];

  // Stats
  fps: number;
  totalFrames: number;

  // Batch state
  currentBatchId: string | null;
  currentBatchNumber: number;

  // ROI state
  roi: ROIConfig;

  // Current batch statistics (ROI-filtered, snapshot from current frame)
  currentBatchStats: BatchStats | null;

  // Batch history
  batchHistory: BatchSummary[];

  // Auto-batch mode
  autoBatchEnabled: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setModelLoaded: (loaded: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setSessionId: (id: string | null) => void;
  setCurrentResult: (result: DetectionResult) => void;
  addRecentResult: (result: DetectionResult) => void;
  setFps: (fps: number) => void;
  incrementFrames: () => void;

  // Batch actions
  setCurrentBatch: (batchId: string | null, batchNumber: number) => void;
  setBatchStats: (stats: BatchStats | null) => void;
  addBatchToHistory: (batch: BatchSummary) => void;
  setBatchHistory: (batches: BatchSummary[]) => void;

  // ROI actions
  setROI: (roi: ROIConfig) => void;

  // Auto-batch actions
  setAutoBatchEnabled: (enabled: boolean) => void;

  reset: () => void;
}

export const useDetectionStore = create<DetectionState>((set) => ({
  // Initial state
  isConnected: false,
  isModelLoaded: false,
  isStreaming: false,
  sessionId: null,
  currentResult: null,
  recentResults: [],
  fps: 0,
  totalFrames: 0,

  // Batch initial state
  currentBatchId: null,
  currentBatchNumber: 0,

  // ROI initial state
  roi: DEFAULT_ROI,

  // Batch stats
  currentBatchStats: null,
  batchHistory: [],

  // Auto-batch mode
  autoBatchEnabled: false,

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  setModelLoaded: (loaded) => set({ isModelLoaded: loaded }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setSessionId: (id) => set({ sessionId: id }),

  setCurrentResult: (result) =>
    set((state) => ({
      currentResult: result,
      recentResults: [result, ...state.recentResults.slice(0, 9)],
    })),

  addRecentResult: (result) =>
    set((state) => ({
      recentResults: [result, ...state.recentResults.slice(0, 9)],
    })),

  setFps: (fps) => set({ fps }),
  incrementFrames: () => set((state) => ({ totalFrames: state.totalFrames + 1 })),

  // Batch actions
  setCurrentBatch: (batchId, batchNumber) =>
    set({
      currentBatchId: batchId,
      currentBatchNumber: batchNumber,
    }),

  setBatchStats: (stats) => set({ currentBatchStats: stats }),

  addBatchToHistory: (batch) =>
    set((state) => {
      // Prevent duplicate entries
      if (state.batchHistory.some((b) => b.id === batch.id)) {
        return state;
      }
      return {
        batchHistory: [batch, ...state.batchHistory.slice(0, 9)],
      };
    }),

  setBatchHistory: (batches) => set({ batchHistory: batches }),

  // ROI actions
  setROI: (roi) => set({ roi }),

  // Auto-batch actions
  setAutoBatchEnabled: (enabled) => set({ autoBatchEnabled: enabled }),

  reset: () =>
    set({
      isStreaming: false,
      sessionId: null,
      currentResult: null,
      recentResults: [],
      fps: 0,
      totalFrames: 0,
      currentBatchId: null,
      currentBatchNumber: 0,
      currentBatchStats: null,
      batchHistory: [],
      roi: DEFAULT_ROI,
      autoBatchEnabled: false,
    }),
}));
