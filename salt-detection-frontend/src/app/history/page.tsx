"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { BatchSummary, PaginatedResponse } from "@/types/detection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, ChevronLeft, ChevronRight, Trash2, Package, Clock, CheckCircle, Timer } from "lucide-react";

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

function getWhitenessColor(whiteness: number | null | undefined): string {
  if (whiteness === null || whiteness === undefined) return "text-slate-400";
  if (whiteness >= 80) return "text-blue-600";
  if (whiteness >= 60) return "text-cyan-600";
  return "text-slate-500";
}

function getWhitenessBgColor(whiteness: number | null | undefined): string {
  if (whiteness === null || whiteness === undefined) return "bg-slate-100";
  if (whiteness >= 80) return "bg-blue-50";
  if (whiteness >= 60) return "bg-cyan-50";
  return "bg-slate-100";
}

function getQualityColor(quality: number | null | undefined): string {
  if (quality === null || quality === undefined) return "text-slate-400";
  if (quality >= 70) return "text-amber-600";
  if (quality >= 50) return "text-orange-500";
  return "text-slate-500";
}

function getQualityBgColor(quality: number | null | undefined): string {
  if (quality === null || quality === undefined) return "bg-slate-100";
  if (quality >= 70) return "bg-amber-50";
  if (quality >= 50) return "bg-orange-50";
  return "bg-slate-100";
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
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
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function HistoryPage() {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBatches = async (page: number) => {
    setLoading(true);
    try {
      const response = (await api.getBatches({ page, limit: 10 })) as PaginatedResponse<BatchSummary>;
      setBatches(response.data);
      setMeta({
        page: response.meta.page,
        totalPages: response.meta.totalPages,
        total: response.meta.total,
      });
    } catch (error) {
      console.error("Failed to fetch batches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches(1);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteBatch(id);
      fetchBatches(meta.page);
    } catch (error) {
      console.error("Failed to delete batch:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50">
            <History className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Batch History</h1>
            <p className="text-sm text-slate-500">All completed detection batches</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {meta.total} total batches
        </Badge>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Package className="h-5 w-5 text-slate-500" />
            All Batches
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading batches...
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No batches found</p>
              <p className="text-xs mt-1">Start a batch to see history here</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Batch #</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Start Time
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">End Time</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">
                        <div className="flex items-center justify-center gap-1">
                          <Timer className="h-3.5 w-3.5" />
                          Duration
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-emerald-600">Pure</th>
                      <th className="text-center py-3 px-4 font-semibold text-red-600">Impure</th>
                      <th className="text-center py-3 px-4 font-semibold text-orange-600">Unwanted</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Total</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Purity</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-600">Whiteness</th>
                      <th className="text-center py-3 px-4 font-semibold text-amber-600">Quality</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Frames</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">#{batch.batchNumber}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatDateTime(batch.startTime)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {batch.endTime ? formatDateTime(batch.endTime) : "--"}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {formatDuration(batch.startTime, batch.endTime)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-emerald-600">{batch.pureCount}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-red-600">{batch.impureCount}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-orange-600">{batch.unwantedCount}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-medium text-slate-700">{batch.totalCount}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getPurityColor(batch.purityPercentage)} ${getPurityBgColor(batch.purityPercentage)}`}
                          >
                            {batch.purityPercentage !== null && batch.purityPercentage !== undefined
                              ? `${batch.purityPercentage.toFixed(0)}%`
                              : "--"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getWhitenessColor(batch.avgWhiteness)} ${getWhitenessBgColor(batch.avgWhiteness)}`}
                          >
                            {batch.avgWhiteness !== null && batch.avgWhiteness !== undefined
                              ? `${batch.avgWhiteness.toFixed(1)}%`
                              : "--"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getQualityColor(batch.avgQualityScore)} ${getQualityBgColor(batch.avgQualityScore)}`}
                          >
                            {batch.avgQualityScore !== null && batch.avgQualityScore !== undefined
                              ? `${batch.avgQualityScore.toFixed(1)}`
                              : "--"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {batch.frameCount}
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
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(batch.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
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
                    onClick={() => fetchBatches(meta.page - 1)}
                    disabled={meta.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBatches(meta.page + 1)}
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
