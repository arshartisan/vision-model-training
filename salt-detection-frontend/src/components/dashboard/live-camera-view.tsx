"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { useWebSocket } from "@/hooks/use-websocket";
import { useDetectionStore } from "@/stores/detection-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Square, Play, Wifi, Cpu, Plus, Check, RefreshCw } from "lucide-react";

const CAPTURE_SIZE = 320;
const FRAME_INTERVAL = 5000; // 1 FPS

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
  } = useCamera({ width: 480, height: 480 });

  const {
    isConnected,
    isStreaming,
    startStream,
    stopStream,
    sendFrame,
    startBatch,
    endBatch,
  } = useWebSocket();

  const {
    currentResult,
    fps,
    isModelLoaded,
    roi,
    currentBatchId,
    currentBatchNumber,
    currentBatchStats,
    autoBatchEnabled,
    setAutoBatchEnabled,
  } = useDetectionStore();

  // Update canvas size to match container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();

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

  // Draw ROI and bounding boxes on overlay canvas
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const displayWidth = canvas.width;
    const displayHeight = canvas.height;

    // Draw ROI overlay (darkened area outside ROI)
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";

    const roiX = roi.x * displayWidth;
    const roiY = roi.y * displayHeight;
    const roiW = roi.width * displayWidth;
    const roiH = roi.height * displayHeight;

    // Top region
    ctx.fillRect(0, 0, displayWidth, roiY);
    // Bottom region
    ctx.fillRect(0, roiY + roiH, displayWidth, displayHeight - roiY - roiH);
    // Left region
    ctx.fillRect(0, roiY, roiX, roiH);
    // Right region
    ctx.fillRect(roiX + roiW, roiY, displayWidth - roiX - roiW, roiH);

    // Draw ROI border
    ctx.strokeStyle = "#fbbf24"; // Yellow
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(roiX, roiY, roiW, roiH);
    ctx.setLineDash([]);

    // Draw corner markers
    const cornerSize = 20;
    ctx.fillStyle = "#fbbf24";

    // Top-left
    ctx.fillRect(roiX - 2, roiY - 2, cornerSize, 4);
    ctx.fillRect(roiX - 2, roiY - 2, 4, cornerSize);
    // Top-right
    ctx.fillRect(roiX + roiW - cornerSize + 2, roiY - 2, cornerSize, 4);
    ctx.fillRect(roiX + roiW - 2, roiY - 2, 4, cornerSize);
    // Bottom-left
    ctx.fillRect(roiX - 2, roiY + roiH - 2, cornerSize, 4);
    ctx.fillRect(roiX - 2, roiY + roiH - cornerSize + 2, 4, cornerSize);
    // Bottom-right
    ctx.fillRect(roiX + roiW - cornerSize + 2, roiY + roiH - 2, cornerSize, 4);
    ctx.fillRect(roiX + roiW - 2, roiY + roiH - cornerSize + 2, 4, cornerSize);

    // Draw "DETECTION ZONE" label
    ctx.font = "bold 12px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText("DETECTION ZONE", roiX + 10, roiY + 20);

    // Draw bounding boxes
    if (currentResult?.boundingBoxes && currentResult.boundingBoxes.length > 0) {
      currentResult.boundingBoxes.forEach((box) => {
        const x = box.x * displayWidth;
        const y = box.y * displayHeight;
        const width = box.width * displayWidth;
        const height = box.height * displayHeight;

        // Use different styling based on whether box is inside ROI
        const isInside = box.insideROI !== false;
        let boxColor: string;
        let opacity: number;

        if (isInside) {
          boxColor = box.className === "pure" ? "#10b981" : "#ef4444";
          opacity = 1;
        } else {
          boxColor = "#6b7280"; // Gray for outside ROI
          opacity = 0.5;
        }

        ctx.globalAlpha = opacity;
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw corner markers
        const cornerSize = 12;
        ctx.fillStyle = boxColor;

        ctx.fillRect(x - 2, y - 2, cornerSize, 3);
        ctx.fillRect(x - 2, y - 2, 3, cornerSize);
        ctx.fillRect(x + width - cornerSize + 2, y - 2, cornerSize, 3);
        ctx.fillRect(x + width - 2, y - 2, 3, cornerSize);
        ctx.fillRect(x - 2, y + height - 2, cornerSize, 3);
        ctx.fillRect(x - 2, y + height - cornerSize + 2, 3, cornerSize);
        ctx.fillRect(x + width - cornerSize + 2, y + height - 2, cornerSize, 3);
        ctx.fillRect(x + width - 2, y + height - cornerSize + 2, 3, cornerSize);

        // Draw label
        const label = isInside
          ? `${box.className} ${(box.confidence * 100).toFixed(0)}%`
          : "outside";
        ctx.font = "bold 12px 'Space Grotesk', sans-serif";
        const textMetrics = ctx.measureText(label);
        const labelY = y > 25 ? y - 8 : y + height + 18;

        ctx.fillStyle = boxColor;
        ctx.beginPath();
        ctx.roundRect(x, labelY - 14, textMetrics.width + 10, 18, 3);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.fillText(label, x + 5, labelY);

        ctx.globalAlpha = 1;
      });
    }
  }, [currentResult, canvasSize, roi]);

  // Start/stop frame capture
  const startCapturing = useCallback(() => {
    if (captureIntervalRef.current) return;

    captureIntervalRef.current = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        sendFrame(frame);
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
    setTimeout(() => {
      startCapturing();
      // If auto-batch is enabled, start the first batch
      if (autoBatchEnabled) {
        startBatch();
      }
    }, 500);
  }, [isCameraReady, startCamera, startStream, startCapturing, autoBatchEnabled, startBatch]);

  const handleStopDetection = useCallback(() => {
    stopCapturing();
    stopStream();
  }, [stopCapturing, stopStream]);

  // Handle batch start
  const handleStartBatch = useCallback(() => {
    startBatch();
  }, [startBatch]);

  // Handle batch end
  const handleEndBatch = useCallback(() => {
    endBatch();
  }, [endBatch]);

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
            <div className="p-2 rounded-lg bg-cyan-50">
              <Camera className="h-5 w-5 text-cyan-500" />
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
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
                {fps} FPS
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div
          ref={containerRef}
          className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden mx-auto max-w-[800px] shadow-inner"
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

          {/* Overlay canvas for ROI and bounding boxes */}
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

          {/* Batch info overlay */}
          {isStreaming && currentBatchId && (
            <div className="absolute top-3 left-3 bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm z-20">
              <div className="text-white text-sm font-medium">
                Batch #{currentBatchNumber}
              </div>
              <div className="text-emerald-400 text-xs">Recording...</div>
            </div>
          )}

          {/* Current batch stats overlay */}
          {isStreaming && currentBatchStats && (
            <div className="absolute bottom-4 right-4 bg-black/70 px-4 py-3 rounded-lg backdrop-blur-sm z-20">
              <div className="text-slate-300 text-xs mb-1">Batch Stats</div>
              <div className="flex gap-3">
                <div className="text-center">
                  <div className="text-emerald-400 text-lg font-bold">{currentBatchStats.pureCount}</div>
                  <div className="text-slate-400 text-xs">Pure</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 text-lg font-bold">{currentBatchStats.impureCount}</div>
                  <div className="text-slate-400 text-xs">Impure</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 text-lg font-bold">
                    {currentBatchStats.purityPercentage.toFixed(0)}%
                  </div>
                  <div className="text-slate-400 text-xs">Purity</div>
                </div>
              </div>
            </div>
          )}

          {/* ROI-filtered counts overlay */}
          {isStreaming && currentResult && (
            <div className="absolute bottom-4 left-4 flex gap-2 z-20">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/90 text-white text-sm font-medium backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white" />
                Pure: {currentResult.roiPureCount ?? currentResult.pureCount}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-sm font-medium backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white" />
                Impure: {currentResult.roiImpureCount ?? currentResult.impureCount}
              </div>
            </div>
          )}

          {/* Detection count info */}
          {isStreaming && (
            <div className="absolute top-3 right-3 text-xs text-white bg-black/60 px-2.5 py-1.5 rounded-lg backdrop-blur-sm z-20 font-medium">
              {currentResult ? `${currentResult.boundingBoxes.length} detections` : "Analyzing..."}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col items-center gap-4">
          {/* Auto-batch toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Auto Batch:</span>
            <Button
              variant={autoBatchEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoBatchEnabled(!autoBatchEnabled)}
              className={`gap-2 ${autoBatchEnabled ? "bg-amber-500 hover:bg-amber-600" : ""}`}
              disabled={isStreaming}
            >
              <RefreshCw className={`h-4 w-4 ${autoBatchEnabled ? "animate-spin" : ""}`} />
              {autoBatchEnabled ? "ON" : "OFF"}
            </Button>
            <span className="text-xs text-slate-400">
              {autoBatchEnabled ? "1 batch per frame (5s)" : "Manual batch control"}
            </span>
          </div>

          {/* Main controls */}
          <div className="flex justify-center gap-3">
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
              <>
                {!autoBatchEnabled && (
                  <>
                    <Button
                      onClick={handleStartBatch}
                      disabled={!isStreaming}
                      size="lg"
                      className="gap-2 px-6 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-5 w-5" />
                      New Batch
                    </Button>
                    {currentBatchId && (
                      <Button
                        onClick={handleEndBatch}
                        variant="outline"
                        size="lg"
                        className="gap-2 px-6"
                      >
                        <Check className="h-5 w-5" />
                        End Batch
                      </Button>
                    )}
                  </>
                )}
                <Button
                  onClick={handleStopDetection}
                  variant="destructive"
                  size="lg"
                  className="gap-2 px-6"
                >
                  <Square className="h-5 w-5" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
