import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Layout,
  FolderOpen,
  Calendar,
  BarChart3,
  ListChecks,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import AdminLayout from "@/components/admin/layout";
import AdminDashboardClient, { Metric } from "@/components/admin/dashboard";

function getMonthRange(date: Date) {
  // Returns [startOfMonth, startOfNextMonth]
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return [start, next];
}

function getLastMonthRange(date: Date) {
  // Returns [startOfLastMonth, startOfThisMonth]
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const end = new Date(date.getFullYear(), date.getMonth(), 1);
  return [start, end];
}

function calcPercentChange(current: number, last: number) {
  if (last === 0 && current === 0) return 0;
  if (last === 0) return 100;
  return Math.round(((current - last) / Math.max(last, 1)) * 100);
}

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const [thisMonthStart, nextMonthStart] = getMonthRange(now);
  const [lastMonthStart, thisMonthStart2] = getLastMonthRange(now);

  // Helper to get counts for a table
  async function getCounts(table: string) {
    // Total
    const { count: total = 0 } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    // This month
    const { count: thisMonth = 0 } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStart.toISOString())
      .lt("created_at", nextMonthStart.toISOString());
    // Last month
    const { count: lastMonth = 0 } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastMonthStart.toISOString())
      .lt("created_at", thisMonthStart2.toISOString());
    return { total, thisMonth, lastMonth };
  }

  // Fetch all counts
  const [users, workspaces, spaces, projects, sprints, tasks] =
    await Promise.all([
      getCounts("users"),
      getCounts("workspaces"),
      getCounts("spaces"),
      getCounts("projects"),
      getCounts("sprints"),
      getCounts("tasks"),
    ]);

  // Calculate percent changes
  const metrics = [
    {
      label: "Total Users",
      icon: Users,
      value: users.total ?? 0,
      percent: calcPercentChange(users.thisMonth ?? 0, users.lastMonth ?? 0),
      sub: "Registered users",
    },
    {
      label: "Total Workspaces",
      icon: Layout,
      value: workspaces.total ?? 0,
      percent: calcPercentChange(
        workspaces.thisMonth ?? 0,
        workspaces.lastMonth ?? 0
      ),
      sub: "All workspaces",
    },
    {
      label: "Total Spaces",
      icon: FolderOpen,
      value: spaces.total ?? 0,
      percent: calcPercentChange(spaces.thisMonth ?? 0, spaces.lastMonth ?? 0),
      sub: "All spaces",
    },
    {
      label: "Total Projects",
      icon: BarChart3,
      value: projects.total ?? 0,
      percent: calcPercentChange(
        projects.thisMonth ?? 0,
        projects.lastMonth ?? 0
      ),
      sub: "All projects",
    },
    {
      label: "Total Sprints",
      icon: Calendar,
      value: sprints.total ?? 0,
      percent: calcPercentChange(
        sprints.thisMonth ?? 0,
        sprints.lastMonth ?? 0
      ),
      sub: "All sprints",
    },
    {
      label: "Total Tasks",
      icon: ListChecks,
      value: tasks.total ?? 0,
      percent: calcPercentChange(tasks.thisMonth ?? 0, tasks.lastMonth ?? 0),
      sub: "All tasks",
    },
  ];

  return (
    <AdminLayout>
      <AdminDashboardClient metrics={metrics} />
    </AdminLayout>
  );
}
