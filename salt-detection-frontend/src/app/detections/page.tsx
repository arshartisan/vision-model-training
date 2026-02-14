"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Detection, PaginatedResponse } from "@/types/detection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMs, formatPercentage } from "@/lib/utils";
import { Eye, ChevronLeft, ChevronRight, Trash2, Package, Clock } from "lucide-react";

function getPurityColor(purity: number | null | undefined): string {
  if (purity === null || purity === undefined) return "text-slate-400";
  if (purity >= 80) return "text-emerald-600";
  if (purity >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getPurityBgColor(purity: number | null | undefined): string {
  if (purity === null || purity === undefined) return "bg-slate-100";
  if (purity >= 80) return "bg-emerald-50";
  if (purity >= 60) return "bg-yellow-50";
  return "bg-red-50";
}

export default function DetectionsPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDetections = async (page: number) => {
    setLoading(true);
    try {
      const response = (await api.getDetections({ page, limit: 10 })) as PaginatedResponse<Detection>;
      setDetections(response.data);
      setMeta({
        page: response.meta.page,
        totalPages: response.meta.totalPages,
        total: response.meta.total,
      });
    } catch (error) {
      console.error("Failed to fetch detections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetections(1);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDetection(id);
      fetchDetections(meta.page);
    } catch (error) {
      console.error("Failed to delete detection:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-50">
            <Eye className="h-6 w-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Detections</h1>
            <p className="text-sm text-slate-500">All detection frames (captured every 5 seconds)</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {meta.total} total detections
        </Badge>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Package className="h-5 w-5 text-slate-500" />
            All Detection Frames
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading detections...
            </div>
          ) : detections.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No detections found</p>
              <p className="text-xs mt-1">Start detecting to see records here</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Timestamp
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-emerald-600">Pure</th>
                      <th className="text-center py-3 px-4 font-semibold text-red-600">Impure</th>
                      <th className="text-center py-3 px-4 font-semibold text-orange-600">Unwanted</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Total</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Purity</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Processing</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Batch</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detections.map((detection) => {
                      const pureCount = detection.roiPureCount ?? detection.pureCount;
                      const impureCount = detection.roiImpureCount ?? detection.impureCount;
                      const unwantedCount = detection.roiUnwantedCount ?? detection.unwantedCount;
                      const totalCount = detection.roiTotalCount ?? detection.totalCount;
                      const purity = detection.roiPurityPercentage ?? detection.purityPercentage;

                      return (
                        <tr key={detection.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-slate-600">
                            {formatDate(detection.timestamp)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-emerald-600">{pureCount}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-red-600">{impureCount}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-orange-600">{unwantedCount}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-medium text-slate-700">{totalCount}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getPurityColor(purity)} ${getPurityBgColor(purity)}`}
                            >
                              {purity !== null && purity !== undefined
                                ? `${purity.toFixed(0)}%`
                                : "--"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 text-xs">
                            {formatMs(detection.processingTimeMs)}
                          </td>
                          <td className="py-3 px-4">
                            {detection.batchId ? (
                              <Badge variant="secondary" className="text-xs">
                                {detection.batchId.slice(0, 8)}...
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs">No batch</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(detection.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDetections(meta.page - 1)}
                    disabled={meta.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDetections(meta.page + 1)}
                    disabled={meta.page === meta.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
