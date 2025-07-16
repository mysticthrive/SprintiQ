"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LayoutGrid,
  FolderOpen,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CirclePlay,
  SquareCheckBig,
  Hand,
  Snail,
} from "lucide-react";
import dynamic from "next/dynamic";

// Export prop types for use in page.tsx
export type AnalyticsDashboardProps = {
  totalStories: number;
  totalSpaces: number;
  totalProjects: number;
  totalSprints: number;
  avgStoriesPerMinute: number | null;
  avgSpacesPerMinute: number | null;
  avgProjectsPerMinute: number | null;
  avgSprintsPerMinute: number | null;
  timeSavingPercent: number | null;
  avgAIDurationMs: number | null;
  avgManualDurationMs: number | null;
  error?: string | null;
  storyCounts?: { minute: string; count: number }[];
  spaceCounts?: { minute: string; count: number }[];
  projectCounts?: { minute: string; count: number }[];
  sprintCounts?: { minute: string; count: number }[];
};

// Helper to determine percent color and icon
function PercentIndicator({ percent }: { percent: number }) {
  const isPositive = percent >= 0;
  return (
    <div
      className={
        "flex items-center text-xs font-semibold " +
        (isPositive ? "text-emerald-600" : "text-rose-600")
      }
    >
      {isPositive ? (
        <ArrowUpRight className="h-4 w-4" />
      ) : (
        <ArrowDownRight className="h-4 w-4" />
      )}
      {isPositive ? "+" : ""}
      {percent.toFixed(1)} / h
    </div>
  );
}

// Progress bar for percent value
function PercentBar({ percent }: { percent: number | null }) {
  let color = "bg-gray-300";
  if (percent !== null) {
    if (percent > 0) color = "bg-emerald-500";
    else if (percent < 0) color = "bg-rose-500";
  }
  const width = percent !== null ? Math.min(Math.abs(percent), 100) : 0;
  return (
    <div
      className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2"
      aria-label="progress bar"
      aria-valuenow={percent ?? 0}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-2 rounded-full transition-all duration-700 ease-in-out ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

const LineChartView = dynamic(() => import("./line-chart-view"), {
  ssr: false,
});

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  totalStories,
  totalSpaces,
  totalProjects,
  totalSprints,
  avgStoriesPerMinute,
  avgSpacesPerMinute,
  avgProjectsPerMinute,
  avgSprintsPerMinute,
  timeSavingPercent,
  avgAIDurationMs,
  avgManualDurationMs,
  error,
  storyCounts = [],
  spaceCounts = [],
  projectCounts = [],
  sprintCounts = [],
}) => {
  const metrics = [
    {
      label: "Avg Manual Duration",
      icon: Hand,
      value:
        avgManualDurationMs != null
          ? (avgManualDurationMs / 1000).toFixed(1)
          : "-",
      percent: 0,
      sub: "Avg manual story creation (sec)",
      showPercent: false,
    },
    {
      label: "Avg AI Duration",
      icon: Snail,
      value:
        avgAIDurationMs != null ? (avgAIDurationMs / 1000).toFixed(1) : "-",
      percent: 0,
      sub: "Avg AI story creation (sec)",
      showPercent: false,
    },
    {
      label: "Stories",
      icon: SquareCheckBig,
      value: totalStories,
      percent: avgStoriesPerMinute ?? 0,
      sub: "Avg per minute (all time)",
      showPercent: false,
    },
    {
      label: "Spaces",
      icon: LayoutGrid,
      value: totalSpaces,
      percent: avgSpacesPerMinute ?? 0,
      sub: "Avg per minute (all time)",
      showPercent: false,
    },
    {
      label: "Projects",
      icon: FolderOpen,
      value: totalProjects,
      percent: avgProjectsPerMinute ?? 0,
      sub: "Avg per minute (all time)",
      showPercent: false,
    },
    {
      label: "Sprints",
      icon: CirclePlay,
      value: totalSprints,
      percent: avgSprintsPerMinute ?? 0,
      sub: "Avg per minute (all time)",
      showPercent: false,
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Analytics</h1>
      <p className="text-muted-foreground text-sm">
        Platform-wide analytics overview
      </p>
      <div className="h-px bg-muted-foreground/20 my-4" />
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6 border border-red-200 text-center font-semibold">
          {error}
        </div>
      )}
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="group relative overflow-hidden border col-span-2 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Time Saving (%)
            </CardTitle>
            <Zap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`text-2xl font-bold ${
                  timeSavingPercent == null
                    ? "text-gray-500"
                    : timeSavingPercent > 0
                    ? "text-emerald-600"
                    : timeSavingPercent < 0
                    ? "text-rose-600"
                    : "text-gray-500"
                }`}
              >
                {timeSavingPercent != null
                  ? timeSavingPercent.toFixed(1) + "%"
                  : "Not enough data"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground mt-1">
                Calculated as percent reduction in avg. story creation time
                (manual vs AI)
              </p>
            </div>
            {/* Animated progress bar for time saving percent */}
            <PercentBar percent={timeSavingPercent} />
          </CardContent>
        </Card>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="group relative overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.label}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{metric.value}</div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.sub}
                  </p>
                  {metric.showPercent && (
                    <PercentIndicator percent={metric.percent} />
                  )}
                </div>
                {/* Animated progress bar for percent metrics only */}
                {metric.showPercent && <PercentBar percent={metric.percent} />}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Line Chart Section */}
      <div className="mb-6">
        <LineChartView
          storyCounts={storyCounts}
          spaceCounts={spaceCounts}
          projectCounts={projectCounts}
          sprintCounts={sprintCounts}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
