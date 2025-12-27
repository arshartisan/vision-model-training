"use client";

import { useDetectionStore } from "@/stores/detection-store";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Cpu } from "lucide-react";

export function Header() {
  const { isConnected, isModelLoaded } = useDetectionStore();

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Salt Crystal Detection System
        </h1>
        <p className="text-sm text-slate-500">Real-time purity analysis powered by AI</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-emerald-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className={cn(
            "text-sm font-medium",
            isConnected ? "text-emerald-600" : "text-red-600"
          )}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Model Status */}
        {isModelLoaded && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <Cpu className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600">Model Ready</span>
          </div>
        )}
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
