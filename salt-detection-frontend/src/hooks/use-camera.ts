"use client";

import { useRef, useCallback, useState, useEffect } from "react";

interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
}

export function useCamera(options: UseCameraOptions = {}) {
  const { width = 640, height = 480, facingMode = "environment" } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isReadyRef = useRef(false); // Ref to avoid stale closure

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    isReadyRef.current = isReady;
    console.log("isReadyRef synced:", isReady);
  }, [isReady]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log("startCamera: requesting camera access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode,
        },
      });

      console.log("startCamera: got stream", stream.getVideoTracks()[0]?.getSettings());
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready to play
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;

          const onLoadedMetadata = () => {
            console.log("startCamera: video metadata loaded");
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            resolve();
          };

          const onError = (e: Event) => {
            video.removeEventListener("error", onError);
            reject(new Error("Video failed to load"));
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("error", onError);

          // If already loaded, resolve immediately
          if (video.readyState >= 1) {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            resolve();
          }
        });

        await videoRef.current.play();
        console.log("startCamera: video playing, setting isReady=true");
        setIsReady(true);
      } else {
        console.error("startCamera: videoRef.current is null");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to access camera";
      setError(message);
      console.error("Camera error:", err);
    }
  }, [width, height, facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    // Use ref instead of state to avoid stale closure
    if (!videoRef.current || !canvasRef.current || !isReadyRef.current) {
      console.log("captureFrame: not ready", {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        isReady: isReadyRef.current
      });
      return null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return null;

    // Draw video frame to canvas
    ctx.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Get base64 data (without the data URL prefix)
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.8);
    console.log("captureFrame: captured frame, size:", dataUrl.length);
    return dataUrl.split(",")[1];
  }, []); // No dependencies - uses refs

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isReady,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  };
}
