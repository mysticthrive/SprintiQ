"use client";
import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export type ChartCounts = { minute: string; count: number }[];

function formatLabel(dateStr: string, mode: string) {
  const d = new Date(dateStr);
  if (mode === "date") return d.toLocaleDateString();
  if (mode === "week") {
    // ISO week string: YYYY-Www
    const y = d.getFullYear();
    const w = getWeek(d);
    return `${y}-W${w}`;
  }
  if (mode === "month")
    return d.toLocaleString(undefined, { year: "numeric", month: "short" });
  return dateStr;
}

function getWeek(date: Date) {
  // ISO week number
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function aggregate(counts: ChartCounts, mode: string) {
  const map = new Map<string, number>();
  for (const { minute, count } of counts) {
    let key = minute;
    if (mode === "date") key = minute.slice(0, 10);
    else if (mode === "week") {
      const d = new Date(minute);
      key = `${d.getFullYear()}-W${getWeek(d)}`;
    } else if (mode === "month") key = minute.slice(0, 7);
    map.set(key, (map.get(key) || 0) + count);
  }
  return Array.from(map.entries()).map(([k, v]) => ({ label: k, count: v }));
}

const LineChartView = ({
  storyCounts = [],
  spaceCounts = [],
  projectCounts = [],
  sprintCounts = [],
}: {
  storyCounts?: ChartCounts;
  spaceCounts?: ChartCounts;
  projectCounts?: ChartCounts;
  sprintCounts?: ChartCounts;
}) => {
  const [mode, setMode] = useState<"date" | "week" | "month">("date");

  // Aggregate data by selected mode
  const data = useMemo(() => {
    const aggStories = aggregate(storyCounts, mode);
    const aggSpaces = aggregate(spaceCounts, mode);
    const aggProjects = aggregate(projectCounts, mode);
    const aggSprints = aggregate(sprintCounts, mode);
    // Merge all unique labels
    const allLabels = Array.from(
      new Set([
        ...aggStories.map((d) => d.label),
        ...aggSpaces.map((d) => d.label),
        ...aggProjects.map((d) => d.label),
        ...aggSprints.map((d) => d.label),
      ])
    ).sort();
    return allLabels.map((label) => ({
      label,
      Stories: aggStories.find((d) => d.label === label)?.count ?? 0,
      Spaces: aggSpaces.find((d) => d.label === label)?.count ?? 0,
      Projects: aggProjects.find((d) => d.label === label)?.count ?? 0,
      Sprints: aggSprints.find((d) => d.label === label)?.count ?? 0,
    }));
  }, [storyCounts, spaceCounts, projectCounts, sprintCounts, mode]);

  // Custom tick for axis and legend with text-xs
  const renderTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="middle"
        className="text-xs fill-gray-500"
      >
        {payload.value}
      </text>
    );
  };
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex gap-4 items-center text-xs mt-1">
        {payload.map((entry: any) => (
          <span key={entry.value} className="flex items-center gap-1">
            <span
              style={{ background: entry.color }}
              className="inline-block w-3 h-1 rounded"
            />
            {entry.value}
          </span>
        ))}
      </div>
    );
  };
  return (
    <div className="w-full h-[400px] bg-white rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">Creation Trends</h3>
        <Select value={mode} onValueChange={(v) => setMode(v as any)}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">By Date</SelectItem>
            <SelectItem value="week">By Week</SelectItem>
            <SelectItem value="month">By Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={renderTick}
            minTickGap={24}
            height={28}
          />
          <YAxis allowDecimals={false} tick={renderTick} width={32} />
          <Tooltip
            wrapperClassName="!text-xs"
            contentStyle={{ fontSize: "0.75rem" }}
          />
          <Legend content={renderLegend} />
          <Line
            type="monotone"
            dataKey="Stories"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="Spaces"
            stroke="#6366f1"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="Projects"
            stroke="#f59e42"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="Sprints"
            stroke="#ef4444"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartView;
