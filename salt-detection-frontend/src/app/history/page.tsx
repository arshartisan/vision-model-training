"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Detection, PaginatedResponse } from "@/types/detection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMs, formatPercentage } from "@/lib/utils";
import { History, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

export default function HistoryPage() {
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
        <div className="flex items-center gap-2">
          <History className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Detection History</h1>
        </div>
        <Badge variant="outline">{meta.total} total detections</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Detections</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : detections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No detections found. Start detecting to see history.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                      <th className="text-left py-3 px-4 font-medium">Pure</th>
                      <th className="text-left py-3 px-4 font-medium">Impure</th>
                      <th className="text-left py-3 px-4 font-medium">Purity</th>
                      <th className="text-left py-3 px-4 font-medium">Processing</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detections.map((detection) => (
                      <tr key={detection.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {formatDate(detection.timestamp)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="success">{detection.pureCount}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="destructive">{detection.impureCount}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              detection.purityPercentage >= 80
                                ? "text-green-600"
                                : detection.purityPercentage >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {formatPercentage(detection.purityPercentage)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {formatMs(detection.processingTimeMs)}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(detection.id)}
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
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
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
