"use client";

import { useDetectionStore } from "@/stores/detection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PurityGauge() {
  const { currentResult } = useDetectionStore();
  const purity = currentResult?.purityPercentage ?? 100;

  const getColor = (value: number) => {
    if (value >= 80) return { stroke: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" };
    if (value >= 50) return { stroke: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" };
    return { stroke: "#ef4444", text: "text-red-600", bg: "bg-red-50", ring: "ring-red-100" };
  };

  const colors = getColor(purity);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (purity / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-slate-900">Crystal Purity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90 drop-shadow-sm">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="14"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              className="transition-all duration-500 ease-out"
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold tracking-tight ${colors.text}`}>
              {purity.toFixed(1)}%
            </span>
            <span className="text-sm text-slate-400 font-medium mt-1">Purity Level</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-6 text-sm">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="font-medium text-emerald-700">Pure: {currentResult?.pureCount ?? 0}</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="font-medium text-red-700">Impure: {currentResult?.impureCount ?? 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
