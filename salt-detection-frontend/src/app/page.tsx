"use client";

import { LiveCameraView } from "@/components/dashboard/live-camera-view";
import { DetectionStatsCard } from "@/components/dashboard/detection-stats-card";
import { PurityGauge } from "@/components/dashboard/purity-gauge";
import { RecentDetections } from "@/components/dashboard/recent-detections";

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

      {/* Stats Cards */}
      <DetectionStatsCard />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera View - Takes 2 columns */}
        <div className="lg:col-span-2">
          <LiveCameraView />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <PurityGauge />
          <RecentDetections />
        </div>
      </div>
    </div>
  );
}
