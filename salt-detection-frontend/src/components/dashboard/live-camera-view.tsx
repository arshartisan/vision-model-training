"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { useWebSocket } from "@/hooks/use-websocket";
import { useDetectionStore } from "@/stores/detection-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Square, Play, Wifi, Cpu } from "lucide-react";

const CAPTURE_SIZE = 320; // Match model input size
const FRAME_INTERVAL = 5000; // 1 FPS - one detection per second

export function LiveCameraView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 480, height: 480 });

  const {
    videoRef,
    canvasRef,
    isReady: isCameraReady,
    error: cameraError,
    startCamera,
    stopCamera,
    captureFrame,
  } = useCamera({ width: 480, height: 480 }); // Use square aspect ratio

  const { isConnected, isStreaming, startStream, stopStream, sendFrame } =
    useWebSocket();

  const { currentResult, fps, isModelLoaded } = useDetectionStore();

  // Update canvas size to match container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Use actual dimensions (container is square via CSS)
        setCanvasSize({ width: rect.width, height: rect.height });
        console.log("Canvas size updated:", rect.width, "x", rect.height);
      }
    };

    // Initial update
    updateCanvasSize();

    // Use ResizeObserver for more reliable size tracking
    const observer = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener("resize", updateCanvasSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Draw bounding boxes on overlay canvas
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Skip if no results or no boxes
    if (!currentResult || !currentResult.boundingBoxes || currentResult.boundingBoxes.length === 0) {
      return;
    }

    // Use canvas dimensions for scaling
    const displayWidth = canvas.width;
    const displayHeight = canvas.height;

    console.log("Drawing", currentResult.boundingBoxes.length, "boxes on canvas:", displayWidth, "x", displayHeight);

    currentResult.boundingBoxes.forEach((box, index) => {
      // Scale normalized coordinates (0-1) to canvas size
      const x = box.x * displayWidth;
      const y = box.y * displayHeight;
      const width = box.width * displayWidth;
      const height = box.height * displayHeight;

      console.log(`Box ${index}: ${box.className} (${(box.confidence * 100).toFixed(1)}%) at [${x.toFixed(1)}, ${y.toFixed(1)}, ${width.toFixed(1)}, ${height.toFixed(1)}]`);

      // Draw box with thicker line - use className from backend
      const boxColor = box.className === "pure" ? "#10b981" : "#ef4444";
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw corner markers for better visibility
      const cornerSize = 15;
      ctx.fillStyle = boxColor;

      // Top-left corner
      ctx.fillRect(x - 2, y - 2, cornerSize, 4);
      ctx.fillRect(x - 2, y - 2, 4, cornerSize);

      // Top-right corner
      ctx.fillRect(x + width - cornerSize + 2, y - 2, cornerSize, 4);
      ctx.fillRect(x + width - 2, y - 2, 4, cornerSize);

      // Bottom-left corner
      ctx.fillRect(x - 2, y + height - 2, cornerSize, 4);
      ctx.fillRect(x - 2, y + height - cornerSize + 2, 4, cornerSize);

      // Bottom-right corner
      ctx.fillRect(x + width - cornerSize + 2, y + height - 2, cornerSize, 4);
      ctx.fillRect(x + width - 2, y + height - cornerSize + 2, 4, cornerSize);

      // Draw label background
      const label = `${box.className} ${(box.confidence * 100).toFixed(0)}%`;
      ctx.font = "bold 14px 'Space Grotesk', sans-serif";
      const textMetrics = ctx.measureText(label);
      const textHeight = 20;
      const padding = 6;

      // Position label above the box, or below if at top edge
      const labelY = y > textHeight + padding + 5 ? y - textHeight - padding : y + height + 5;

      ctx.fillStyle = boxColor;
      ctx.beginPath();
      ctx.roundRect(x, labelY, textMetrics.width + padding * 2, textHeight + padding, 4);
      ctx.fill();

      // Draw label text
      ctx.fillStyle = "white";
      ctx.fillText(label, x + padding, labelY + textHeight);
    });
  }, [currentResult, canvasSize]);

  // Start/stop frame capture
  const startCapturing = useCallback(() => {
    if (captureIntervalRef.current) return;

    console.log("Starting frame capture interval");
    captureIntervalRef.current = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        sendFrame(frame);
      } else {
        console.log("captureFrame returned null");
      }
    }, FRAME_INTERVAL);
  }, [captureFrame, sendFrame]);

  const stopCapturing = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  }, []);

  // Handle stream start/stop
  const handleStartDetection = useCallback(async () => {
    if (!isCameraReady) {
      await startCamera();
    }
    startStream();
    // Small delay to ensure stream is ready
    setTimeout(() => {
      startCapturing();
    }, 500);
  }, [isCameraReady, startCamera, startStream, startCapturing]);

  const handleStopDetection = useCallback(() => {
    stopCapturing();
    stopStream();
  }, [stopCapturing, stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapturing();
      stopCamera();
    };
  }, [stopCapturing, stopCamera]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-slate-900">
            <div className="p-2 rounded-lg bg-blue-50">
              <Camera className="h-5 w-5 text-blue-500" />
            </div>
            Live Detection
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isConnected
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
              }`}>
              <Wifi className={`h-3.5 w-3.5 ${isConnected ? "text-emerald-500" : "text-red-500"}`} />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
            {isModelLoaded && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Cpu className="h-3.5 w-3.5 text-emerald-500" />
                Model Ready
              </div>
            )}
            {isStreaming && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {fps} FPS
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div
          ref={containerRef}
          className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden mx-auto max-w-[600px] shadow-inner"
        >
          {/* Video element */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />

          {/* Hidden canvas for frame capture */}
          <canvas
            ref={canvasRef}
            width={CAPTURE_SIZE}
            height={CAPTURE_SIZE}
            className="hidden"
          />

          {/* Overlay canvas for bounding boxes */}
          <canvas
            ref={overlayCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
          />

          {/* Status overlay */}
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-white z-20">
              {cameraError ? (
                <div className="text-center">
                  <p className="text-red-400 font-medium">{cameraError}</p>
                  <p className="text-slate-400 text-sm mt-1">Please check camera permissions</p>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">Click Start to begin detection</p>
                </div>
              )}
            </div>
          )}

          {/* Detection counts overlay */}
          {isStreaming && currentResult && (
            <div className="absolute bottom-4 left-4 flex gap-2 z-20">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/90 text-white text-sm font-medium backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white" />
                Pure: {currentResult.pureCount}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-sm font-medium backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white" />
                Impure: {currentResult.impureCount}
              </div>
            </div>
          )}

          {/* Debug info */}
          {isStreaming && (
            <div className="absolute top-3 right-3 text-xs text-white bg-black/60 px-2.5 py-1.5 rounded-lg backdrop-blur-sm z-20 font-medium">
              {currentResult ? `${currentResult.boundingBoxes.length} detections` : "Analyzing..."}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-6 flex justify-center gap-4">
          {!isStreaming ? (
            <Button
              onClick={handleStartDetection}
              disabled={!isConnected || !isModelLoaded}
              size="lg"
              className="gap-2 px-8"
            >
              <Play className="h-5 w-5" />
              Start Detection
            </Button>
          ) : (
            <Button
              onClick={handleStopDetection}
              variant="destructive"
              size="lg"
              className="gap-2 px-8"
            >
              <Square className="h-5 w-5" />
              Stop Detection
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
