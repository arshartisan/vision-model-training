"use client";

import { LiveCameraView } from "@/components/dashboard/live-camera-view";
import { BatchStatsCard } from "@/components/dashboard/batch-stats-card";
import { PurityGauge } from "@/components/dashboard/purity-gauge";
import { BatchHistoryPanel } from "@/components/dashboard/batch-history-panel";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Detection Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor real-time salt crystal purity analysis
        </p>
      </div>

      {/* Batch Stats Cards */}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera View - Takes 2 columns */}
        <div className="lg:col-span-2">
          <LiveCameraView />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <PurityGauge />
          <BatchHistoryPanel />
          <BatchStatsCard />
        </div>
      </div>
    </div>
  );
}
