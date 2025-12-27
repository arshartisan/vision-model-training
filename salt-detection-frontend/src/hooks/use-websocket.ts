"use client";

import { useEffect, useCallback, useRef } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket-client";
import { useDetectionStore } from "@/stores/detection-store";
import { DetectionResult } from "@/types/detection";

export function useWebSocket() {
  const socketRef = useRef(getSocket());
  const lastFrameTime = useRef(Date.now());
  const frameCount = useRef(0);
  const isStreamingRef = useRef(false); // Use ref to track streaming state

  const {
    isConnected,
    isStreaming,
    setConnected,
    setModelLoaded,
    setStreaming,
    setSessionId,
    setCurrentResult,
    setFps,
    incrementFrames,
    reset,
  } = useDetectionStore();

  // Keep ref in sync with store
  useEffect(() => {
    isStreamingRef.current = isStreaming;
    console.log("isStreaming updated:", isStreaming);
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

    socket.on("stream_started", (data: { sessionId: string }) => {
      console.log("Stream started:", data.sessionId);
      setSessionId(data.sessionId);
      setStreaming(true);
    });

    socket.on("stream_stopped", () => {
      console.log("Stream stopped");
      setStreaming(false);
      setSessionId(null);
    });

    socket.on("detection_result", (result: DetectionResult) => {
      console.log("Detection result received:", {
        pureCount: result.pureCount,
        impureCount: result.impureCount,
        boxCount: result.boundingBoxes?.length || 0,
        boxes: result.boundingBoxes?.slice(0, 2), // Log first 2 boxes for debugging
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
  ]);

  const startStream = useCallback(() => {
    socketRef.current.emit("start_stream", {});
  }, []);

  const stopStream = useCallback(() => {
    socketRef.current.emit("stop_stream", {});
    reset();
  }, [reset]);

  const sendFrame = useCallback((frameData: string) => {
    if (!isStreamingRef.current) {
      console.log("sendFrame: not streaming, skipping");
      return;
    }
    console.log("sendFrame: sending frame, size:", frameData.length);
    socketRef.current.emit("frame", {
      data: frameData,
      timestamp: Date.now(),
    });
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    reset();
  }, [reset]);

  return {
    isConnected,
    isStreaming,
    startStream,
    stopStream,
    sendFrame,
    disconnect,
  };
}
