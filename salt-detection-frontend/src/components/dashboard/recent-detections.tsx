"use client";

import { useDetectionStore } from "@/stores/detection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMs } from "@/lib/utils";
import { History, Clock } from "lucide-react";

export function RecentDetections() {
  const { recentResults } = useDetectionStore();

  return (
    <Card>
      <CardHeader className="pb-4 border-b border-slate-100">
        <CardTitle className="flex items-center gap-2.5 text-slate-900">
          <div className="p-2 rounded-lg bg-violet-50">
            <History className="h-5 w-5 text-violet-500" />
          </div>
          Recent Detections
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {recentResults.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">
                No detections yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Start detection to see results here
              </p>
            </div>
          ) : (
            recentResults.map((result, index) => (
              <div
                key={result.frameId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-400">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {result.pureCount} Pure
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {result.impureCount} Impure
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {result.unwantedCount} Unwanted
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatMs(result.processingTimeMs)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xl font-bold tracking-tight ${
                      result.purityPercentage >= 80
                        ? "text-emerald-600"
                        : result.purityPercentage >= 50
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {result.purityPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400 font-medium">purity</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
