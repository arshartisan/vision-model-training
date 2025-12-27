import { create } from "zustand";
import { DetectionResult } from "@/types/detection";

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

  // Actions
  setConnected: (connected: boolean) => void;
  setModelLoaded: (loaded: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setSessionId: (id: string | null) => void;
  setCurrentResult: (result: DetectionResult) => void;
  addRecentResult: (result: DetectionResult) => void;
  setFps: (fps: number) => void;
  incrementFrames: () => void;
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

  reset: () =>
    set({
      isStreaming: false,
      sessionId: null,
      currentResult: null,
      recentResults: [],
      fps: 0,
      totalFrames: 0,
    }),
}));
