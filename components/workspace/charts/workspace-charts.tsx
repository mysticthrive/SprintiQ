"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useState } from "react";
import { getStatusTypeChartColor, getStatusTypeColor } from "@/lib/utils";

interface WorkspaceChartsProps {
  statusCounts: {
    name: string;
    color: string;
    count: number;
    percentage?: number;
  }[];
  tasksPerSpace: {
    space: {
      id: string;
      name: string;
    };
    count: number;
  }[];
  projectsPerSpace: {
    space: {
      id: string;
      name: string;
    };
    count: number;
  }[];
}

export default function WorkspaceCharts({
  statusCounts,
  tasksPerSpace,
  projectsPerSpace,
}: WorkspaceChartsProps) {
  const [view, setView] = useState<"tasks" | "projects">("tasks");

  const pieData =
    view === "tasks"
      ? tasksPerSpace.map((space, index) => ({
          name: space.space.name,
          value: space.count,
          color: `hsl(${index * 50}, 70%, 50%)`,
        }))
      : projectsPerSpace.map((space, index) => ({
          name: space.space.name,
          value: space.count,
          color: `hsl(${index * 50}, 70%, 50%)`,
        }));
  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  const statusPieData = statusCounts
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.name,
      value: s.count,
      color: getStatusTypeChartColor(s.name),
      percentage: s.percentage || 0,
    }));
  const statusTotal = statusPieData.reduce((sum, d) => sum + d.value, 0);

  if (statusTotal === 0 && pieData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card className="workspace-header-bg border workspace-border">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">No task data available</p>
            </div>
          </CardContent>
        </Card>
        <Card className="workspace-header-bg border workspace-border">
          <CardHeader>
            <CardTitle>By Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">No space data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (statusTotal === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card className="workspace-header-bg border workspace-border">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">No tasks found</p>
            </div>
          </CardContent>
        </Card>
        <Card className="workspace-header-bg border workspace-border">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-4">
                <span className="text-lg">By Space</span>
                <div className="flex gap-2">
                  <button
                    className={`px-2 py-1 rounded text-xs border ${
                      view === "tasks"
                        ? "workspace-component-bg workspace-component-active-color border-workspace-primary"
                        : "workspace-border"
                    }`}
                    onClick={() => setView("tasks")}
                  >
                    Tasks
                  </button>
                  <button
                    className={`px-2 py-1 rounded text-xs border ${
                      view === "projects"
                        ? "workspace-component-bg workspace-component-active-color border-workspace-primary"
                        : "workspace-border"
                    }`}
                    onClick={() => setView("projects")}
                  >
                    Projects
                  </button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    className="text-sm"
                    label={({ name, value }) =>
                      `${name}: ${value} (${
                        total > 0 ? Math.round((value / total) * 100) : 0
                      }%)`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${value} (${
                        total > 0 ? Math.round((value / total) * 100) : 0
                      }%)`
                    }
                    wrapperClassName="text-sm p-1"
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
      <Card className="workspace-header-bg border workspace-border">
        <CardHeader>
          <CardTitle className="text-lg">Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  className="text-sm"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} (${props.payload.percentage}%)`,
                    name,
                  ]}
                  wrapperClassName="text-sm p-1"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Status summary */}
          <div className="grid grid-cols-2 gap-2">
            {statusCounts.map((status) => (
              <div
                key={status.name}
                className="flex items-center justify-between p-2 bg-gray-50 rounded workspace-secondary-sidebar-bg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusTypeColor(status.name) }}
                  />
                  <span className="text-sm font-medium">{status.name}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {status.percentage}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="workspace-header-bg border workspace-border">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-lg">By Space</span>
              <div className="flex gap-2">
                <button
                  className={`px-2 py-1 rounded text-xs border ${
                    view === "tasks"
                      ? "workspace-component-bg workspace-component-active-color border-workspace-primary"
                      : "workspace-border"
                  }`}
                  onClick={() => setView("tasks")}
                >
                  Tasks
                </button>
                <button
                  className={`px-2 py-1 rounded text-xs border ${
                    view === "projects"
                      ? "workspace-component-bg workspace-component-active-color border-workspace-primary"
                      : "workspace-border"
                  }`}
                  onClick={() => setView("projects")}
                >
                  Projects
                </button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  className="text-sm"
                  label={({ name, value }) =>
                    `${name}: ${value} (${
                      total > 0 ? Math.round((value / total) * 100) : 0
                    }%)`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `${value} (${
                      total > 0 ? Math.round((value / total) * 100) : 0
                    }%)`
                  }
                  wrapperClassName="text-sm p-1"
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
