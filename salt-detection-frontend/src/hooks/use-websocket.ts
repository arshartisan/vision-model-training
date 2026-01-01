"use client";

import { useEffect, useCallback, useRef } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket-client";
import { useDetectionStore } from "@/stores/detection-store";
import { DetectionResult, ROIConfig, BatchStats, BatchSummary } from "@/types/detection";

export function useWebSocket() {
  const socketRef = useRef(getSocket());
  const lastFrameTime = useRef(Date.now());
  const frameCount = useRef(0);
  const isStreamingRef = useRef(false);

  const {
    isConnected,
    isStreaming,
    roi,
    currentBatchId,
    autoBatchEnabled,
    setConnected,
    setModelLoaded,
    setStreaming,
    setSessionId,
    setCurrentResult,
    setFps,
    incrementFrames,
    setCurrentBatch,
    setBatchStats,
    addBatchToHistory,
    setBatchHistory,
    setROI,
    reset,
  } = useDetectionStore();

  // Keep auto-batch ref in sync
  const autoBatchEnabledRef = useRef(autoBatchEnabled);
  useEffect(() => {
    autoBatchEnabledRef.current = autoBatchEnabled;
  }, [autoBatchEnabled]);

  // Keep ref in sync with store
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      setStreaming(false);
    });

    socket.on("connection_status", (data: { connected: boolean; modelLoaded: boolean }) => {
      setModelLoaded(data.modelLoaded);
    });

    socket.on("stream_started", (data: { sessionId: string; roi?: ROIConfig }) => {
      console.log("Stream started:", data.sessionId);
      setSessionId(data.sessionId);
      setStreaming(true);
      if (data.roi) {
        setROI(data.roi);
      }
    });

    socket.on("stream_stopped", () => {
      console.log("Stream stopped");
      setStreaming(false);
      setSessionId(null);
    });

    // Batch events
    socket.on("batch_started", (data: {
      batchId: string;
      batchNumber: number;
      roi: ROIConfig;
    }) => {
      console.log("Batch started:", data.batchNumber);
      setCurrentBatch(data.batchId, data.batchNumber);
      setROI(data.roi);
      setBatchStats(null); // Reset batch stats
    });

    socket.on("batch_ended", (batch: BatchSummary) => {
      console.log("Batch ended:", batch.batchNumber);
      addBatchToHistory(batch);
      setCurrentBatch(null, batch.batchNumber);
      setBatchStats(null);
    });

    socket.on("batch_stats_updated", (stats: BatchStats) => {
      setBatchStats(stats);
    });

    socket.on("batch_history", (data: { batches: BatchSummary[] }) => {
      setBatchHistory(data.batches);
    });

    socket.on("roi_updated", (data: { roi: ROIConfig }) => {
      setROI(data.roi);
    });

    socket.on("detection_result", (result: DetectionResult) => {
      console.log("Detection result received:", {
        roiPureCount: result.roiPureCount,
        roiImpureCount: result.roiImpureCount,
        boxCount: result.boundingBoxes?.length || 0,
      });
      setCurrentResult(result);
      incrementFrames();

      // Calculate FPS
      frameCount.current++;
      const now = Date.now();
      const elapsed = now - lastFrameTime.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      // Auto-batch: End current batch and start new one for next frame
      if (autoBatchEnabledRef.current && result.currentBatchId) {
        socket.emit("end_batch", {});
        socket.emit("start_batch", {});
      }
    });

    socket.on("error", (error: { code: string; message: string }) => {
      console.error("WebSocket error:", error);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connection_status");
      socket.off("stream_started");
      socket.off("stream_stopped");
      socket.off("batch_started");
      socket.off("batch_ended");
      socket.off("batch_stats_updated");
      socket.off("batch_history");
      socket.off("roi_updated");
      socket.off("detection_result");
      socket.off("error");
    };
  }, [
    setConnected,
    setModelLoaded,
    setStreaming,
    setSessionId,
    setCurrentResult,
    setFps,
    incrementFrames,
    setCurrentBatch,
    setBatchStats,
    addBatchToHistory,
    setBatchHistory,
    setROI,
  ]);

  const startStream = useCallback(() => {
    socketRef.current.emit("start_stream", { roi });
  }, [roi]);

  const stopStream = useCallback(() => {
    socketRef.current.emit("stop_stream", {});
    reset();
  }, [reset]);

  const sendFrame = useCallback((frameData: string) => {
    if (!isStreamingRef.current) {
      return;
    }
    socketRef.current.emit("frame", {
      data: frameData,
      timestamp: Date.now(),
    });
  }, []);

  // Batch methods
  const startBatch = useCallback((customRoi?: ROIConfig) => {
    socketRef.current.emit("start_batch", { roi: customRoi });
  }, []);

  const endBatch = useCallback(() => {
    socketRef.current.emit("end_batch", {});
  }, []);

  const updateROI = useCallback((newRoi: ROIConfig) => {
    socketRef.current.emit("update_roi", { roi: newRoi });
  }, []);

  const getBatchHistory = useCallback((limit: number = 10) => {
    socketRef.current.emit("get_batch_history", { limit });
  }, []);

  const updateSettings = useCallback((settings: {
    saveDetections?: boolean;
    confidenceThreshold?: number;
  }) => {
    socketRef.current.emit("update_settings", settings);
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    reset();
  }, [reset]);

  return {
    isConnected,
    isStreaming,
    currentBatchId,
    startStream,
    stopStream,
    sendFrame,
    startBatch,
    endBatch,
    updateROI,
    getBatchHistory,
    updateSettings,
    disconnect,
  };
}
