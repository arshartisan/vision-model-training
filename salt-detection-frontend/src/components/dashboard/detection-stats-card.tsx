"use client";

import { useDetectionStore } from "@/stores/detection-store";
import { Card } from "@/components/ui/card";
import { formatMs, formatPercentage } from "@/lib/utils";
import { Activity, Zap, TrendingUp, Clock } from "lucide-react";

export function DetectionStatsCard() {
  const { currentResult, totalFrames, fps } = useDetectionStore();

  const stats = [
    {
      title: "Purity",
      value: currentResult
        ? formatPercentage(currentResult.purityPercentage)
        : "--",
      icon: TrendingUp,
      iconBg:
        currentResult && currentResult.purityPercentage >= 80
          ? "bg-emerald-50"
          : currentResult && currentResult.purityPercentage >= 50
            ? "bg-amber-50"
            : "bg-red-50",
      iconColor:
        currentResult && currentResult.purityPercentage >= 80
          ? "text-emerald-500"
          : currentResult && currentResult.purityPercentage >= 50
            ? "text-amber-500"
            : "text-red-500",
      valueColor:
        currentResult && currentResult.purityPercentage >= 80
          ? "text-emerald-600"
          : currentResult && currentResult.purityPercentage >= 50
            ? "text-amber-600"
            : "text-red-600",
    },
    {
      title: "Total Detected",
      value: currentResult ? currentResult.totalCount.toString() : "--",
      icon: Activity,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-500",
      valueColor: "text-cyan-600",
    },
    {
      title: "Processing Time",
      value: currentResult ? formatMs(currentResult.processingTimeMs) : "--",
      icon: Clock,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      valueColor: "text-violet-600",
    },
    {
      title: "Frames Processed",
      value: totalFrames.toString(),
      icon: Zap,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      valueColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">
              {stat.title}
            </span>
            <div className={`p-2 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
          </div>
          <div className={`text-3xl font-bold tracking-tight ${stat.valueColor}`}>
            {stat.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
