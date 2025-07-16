import AdminLayout from "@/components/admin/layout";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AnalyticsDashboard from "@/components/admin/analytics";
import React from "react";

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  let error = null;
  let storyCounts: any[] = [];
  let spaceCounts: any[] = [];
  let projectCounts: any[] = [];
  let sprintCounts: any[] = [];
  let totalStories = 0;
  let totalSpaces = 0;
  let totalProjects = 0;
  let totalSprints = 0;
  let avgStoriesPerMinute: number | null = null;
  let avgSpacesPerMinute: number | null = null;
  let avgProjectsPerMinute: number | null = null;
  let avgSprintsPerMinute: number | null = null;
  let timeSavingPercent: number | null = null;
  let avgAIDurationMs: number | null = null;
  let avgManualDurationMs: number | null = null;

  // --- Fetch per-minute counts for stories, spaces, projects, sprints ---
  try {
    const { data: storyData, error: storyErr } = await supabase.rpc(
      "per_minute_counts",
      { table_name: "tasks" }
    );
    if (storyErr) throw storyErr;
    storyCounts = storyData || [];
    totalStories = storyCounts.reduce((sum, row) => sum + row.count, 0);
    if (storyCounts.length > 0) {
      avgStoriesPerMinute = totalStories / storyCounts.length;
    }
  } catch (e: any) {
    error = error || e.message || "Failed to fetch story counts";
  }
  try {
    const { data: spaceData, error: spaceErr } = await supabase.rpc(
      "per_minute_counts",
      { table_name: "spaces" }
    );
    if (spaceErr) throw spaceErr;
    spaceCounts = spaceData || [];
    totalSpaces = spaceCounts.reduce((sum, row) => sum + row.count, 0);
    if (spaceCounts.length > 0) {
      avgSpacesPerMinute = totalSpaces / spaceCounts.length;
    }
  } catch (e: any) {
    error = error || e.message || "Failed to fetch space counts";
  }
  try {
    const { data: projectData, error: projectErr } = await supabase.rpc(
      "per_minute_counts",
      { table_name: "projects" }
    );
    if (projectErr) throw projectErr;
    projectCounts = projectData || [];
    totalProjects = projectCounts.reduce((sum, row) => sum + row.count, 0);
    if (projectCounts.length > 0) {
      avgProjectsPerMinute = totalProjects / projectCounts.length;
    }
  } catch (e: any) {
    error = error || e.message || "Failed to fetch project counts";
  }
  try {
    const { data: sprintData, error: sprintErr } = await supabase.rpc(
      "per_minute_counts",
      { table_name: "sprints" }
    );
    if (sprintErr) throw sprintErr;
    sprintCounts = sprintData || [];
    totalSprints = sprintCounts.reduce((sum, row) => sum + row.count, 0);
    if (sprintCounts.length > 0) {
      avgSprintsPerMinute = totalSprints / sprintCounts.length;
    }
  } catch (e: any) {
    error = error || e.message || "Failed to fetch sprint counts";
  }

  // --- Time saving percent for story creation ---
  try {
    const { data: aiSessions, error: aiErr } = await supabase
      .from("time_tracking_sessions")
      .select("timestamp, story_count")
      .eq("event_type", "story_creation")
      .eq("method", "ai_generated");
    if (aiErr) throw aiErr;
    const { data: baselines, error: baseErr } = await supabase
      .from("user_baselines")
      .select(
        "baseline_story_time_ms, baseline_grooming_time_ms, baseline_stories_per_session"
      )
      .eq("baseline_method", "manual");
    if (baseErr) throw baseErr;
    // Manual avg duration (ms)
    const a_num = (baselines || []).reduce(
      (sum, b) =>
        sum +
        (b.baseline_story_time_ms || 0) +
        (b.baseline_grooming_time_ms || 0),
      0
    );
    const a_den = (baselines || []).reduce(
      (sum, b) => sum + (b.baseline_stories_per_session || 0),
      0
    );
    const a = a_den > 0 ? a_num / a_den : null;
    avgManualDurationMs = a;
    // AI avg duration (ms)
    const b_num = (aiSessions || []).reduce(
      (sum, s) => sum + (s.timestamp || 0),
      0
    );
    const b_den = (aiSessions || []).reduce(
      (sum, s) => sum + (s.story_count || 0),
      0
    );
    const b = b_den > 0 ? b_num / b_den : null;
    avgAIDurationMs = b;
    if (a && b && a > 0) {
      timeSavingPercent = ((a - b) / a) * 100;
    }
  } catch (e: any) {
    error = error || e.message || "Failed to calculate time saving percent";
  }

  return (
    <AdminLayout>
      <AnalyticsDashboard
        totalStories={totalStories}
        totalSpaces={totalSpaces}
        totalProjects={totalProjects}
        totalSprints={totalSprints}
        avgStoriesPerMinute={avgStoriesPerMinute}
        avgSpacesPerMinute={avgSpacesPerMinute}
        avgProjectsPerMinute={avgProjectsPerMinute}
        avgSprintsPerMinute={avgSprintsPerMinute}
        timeSavingPercent={timeSavingPercent}
        avgAIDurationMs={avgAIDurationMs}
        avgManualDurationMs={avgManualDurationMs}
        error={error}
        storyCounts={storyCounts}
        spaceCounts={spaceCounts}
        projectCounts={projectCounts}
        sprintCounts={sprintCounts}
      />
    </AdminLayout>
  );
}
