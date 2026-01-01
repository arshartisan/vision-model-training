"use client";

import { useDetectionStore } from "@/stores/detection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Package, Clock, CheckCircle } from "lucide-react";

function getPurityColor(purity: number | null): string {
  if (purity === null) return "text-slate-400";
  if (purity >= 80) return "text-emerald-600";
  if (purity >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getPurityBgColor(purity: number | null): string {
  if (purity === null) return "bg-slate-100";
  if (purity >= 80) return "bg-emerald-50";
  if (purity >= 60) return "bg-yellow-50";
  return "bg-red-50";
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDuration(startTime: string, endTime: string | null): string {
  if (!endTime) return "--";
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMs = end - start;
  const seconds = Math.round(durationMs / 1000);
  return `${seconds}s`;
}

export function BatchHistoryPanel() {
  const { batchHistory } = useDetectionStore();

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="flex items-center gap-2.5 text-slate-900 text-base">
          <div className="p-1.5 rounded-lg bg-purple-50">
            <History className="h-4 w-4 text-purple-500" />
          </div>
          Batch History
          {batchHistory.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {batchHistory.length} batches
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {batchHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No batches completed yet</p>
            <p className="text-xs mt-1">Start a batch to see history</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Time
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Duration</th>
                  <th className="text-center py-3 px-4 font-semibold text-emerald-600">Pure</th>
                  <th className="text-center py-3 px-4 font-semibold text-red-600">Impure</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Purity</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchHistory.map((batch) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">
                        {batch.batchNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatTime(batch.startTime)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {formatDuration(batch.startTime, batch.endTime)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-emerald-600">
                        {batch.pureCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-red-600">
                        {batch.impureCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium text-slate-700">
                        {batch.totalCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getPurityColor(batch.purityPercentage)} ${getPurityBgColor(batch.purityPercentage)}`}
                      >
                        {batch.purityPercentage !== null
                          ? `${batch.purityPercentage.toFixed(0)}%`
                          : "--"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {batch.endTime ? (
                        <Badge variant="success" className="text-xs gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Done
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          In Progress
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
