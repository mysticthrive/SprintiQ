"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type {
  Team,
  TeamMember,
  Role,
  Level,
  Profile,
  Task,
} from "@/lib/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, FolderOpen, CheckCircle, Clock } from "lucide-react";

interface TeamsDashboardProps {
  teams: Team[];
  roles: Role[];
  levels: Level[];
  profiles: Profile[];
  workspaceId: string;
  onRefresh: () => void;
}

interface DashboardStats {
  totalTeams: number;
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  assignedTasks: number;
  completedTasks: number;
}

export default function TeamsDashboard({
  teams,
  roles,
  levels,
  profiles,
  workspaceId,
  onRefresh,
}: TeamsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    totalUsers: 0,
    totalProjects: 0,
    totalTasks: 0,
    assignedTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClientSupabaseClient();

  useEffect(() => {
    fetchDashboardStats();
  }, [teams, workspaceId]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // First, get the workspace UUID from the short ID
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", workspaceId)
        .single();

      if (workspaceError) {
        console.error("Error fetching workspace:", workspaceError);
        throw new Error(`Workspace not found: ${workspaceError.message}`);
      }

      const workspaceUuid = workspaceData.id;

      // Calculate basic stats from teams data
      const totalTeams = teams.length;
      const totalUsers = teams.reduce(
        (acc, team) => acc + ((team as any).team_members?.length || 0),
        0
      );

      // Fetch projects count using workspace UUID
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id")
        .eq("workspace_id", workspaceUuid);

      // Fetch tasks count and status using workspace UUID
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, assignee_id, status_id")
        .eq("workspace_id", workspaceUuid);

      // Fetch statuses to determine completed tasks using workspace UUID
      const { data: statusesData } = await supabase
        .from("statuses")
        .select("id, name")
        .eq("workspace_id", workspaceUuid);

      const completedStatusNames = ["Done", "Completed", "Finished", "Closed"];
      const completedStatusIds =
        statusesData
          ?.filter((status) =>
            completedStatusNames.some((name) =>
              status.name.toLowerCase().includes(name.toLowerCase())
            )
          )
          .map((status) => status.id) || [];

      const totalProjects = projectsData?.length || 0;
      const totalTasks = tasksData?.length || 0;
      const assignedTasks =
        tasksData?.filter((task) => task.assignee_id).length || 0;
      const completedTasks =
        tasksData?.filter((task) => completedStatusIds.includes(task.status_id))
          .length || 0;

      setStats({
        totalTeams,
        totalUsers,
        totalProjects,
        totalTasks,
        assignedTasks,
        completedTasks,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamProgress = (team: Team) => {
    if (!(team as any).team_members || (team as any).team_members.length === 0)
      return 0;

    // This is a simplified calculation - in a real app you'd want to
    // calculate based on actual task assignments to team members
    return Math.floor(Math.random() * 100); // Placeholder
  };

  return (
    <div className="h-full overflow-y-auto workspace-header-bg">
      <div className="p-3 border-b workspace-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 workspace-component-bg rounded-md items-center flex justify-center">
              <Users className="w-4 w-4 workspace-component-active-color" />
            </div>
            <div>
              <span className="text-sm font-bold">Teams Dashboard</span>
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-[10px] workspace-header-text">
                  Overview of your teams, projects, and task progress
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3">
        <Card className="group relative overflow-hidden workspace-surface border workspace-border shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium workspace-text-secondary">
              Total Teams
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold workspace-text">
              {stats.totalTeams}
            </div>
            <p className="text-xs workspace-text-muted mt-1">
              Active teams in workspace
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden workspace-surface border workspace-border shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium workspace-text-secondary">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold workspace-text">
              {stats.totalUsers}
            </div>
            <p className="text-xs workspace-text-muted mt-1">
              Team members across all teams
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden workspace-surface border workspace-border shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium workspace-text-secondary">
              Total Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold workspace-text">
              {stats.totalProjects}
            </div>
            <p className="text-xs workspace-text-muted mt-1">
              Active projects in workspace
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden workspace-surface border workspace-border shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium workspace-text-secondary">
              Total Tasks
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold workspace-text">
              {stats.totalTasks}
            </div>
            <p className="text-xs workspace-text-muted mt-1">
              Tasks across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Assignment Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 px-3">
        <Card className="workspace-surface border workspace-border shadow-sm">
          <CardHeader>
            <CardTitle className="workspace-text">Task Assignment</CardTitle>
            <CardDescription className="workspace-text-muted">
              Distribution of tasks across team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm workspace-text-secondary">
                  Assigned Tasks
                </span>
                <span className="text-sm font-medium workspace-text">
                  {stats.assignedTasks}
                </span>
              </div>
              <Progress
                value={
                  (stats.assignedTasks / Math.max(stats.totalTasks, 1)) * 100
                }
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm workspace-text-secondary">
                  Unassigned Tasks
                </span>
                <span className="text-sm font-medium workspace-text">
                  {stats.totalTasks - stats.assignedTasks}
                </span>
              </div>
              <Progress
                value={
                  ((stats.totalTasks - stats.assignedTasks) /
                    Math.max(stats.totalTasks, 1)) *
                  100
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="workspace-surface border workspace-border shadow-sm">
          <CardHeader>
            <CardTitle className="workspace-text">Task Completion</CardTitle>
            <CardDescription className="workspace-text-muted">
              Progress on task completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm workspace-text-secondary">
                  Completed Tasks
                </span>
                <span className="text-sm font-medium workspace-text">
                  {stats.completedTasks}
                </span>
              </div>
              <Progress
                value={
                  (stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100
                }
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm workspace-text-secondary">
                  In Progress
                </span>
                <span className="text-sm font-medium workspace-text">
                  {stats.totalTasks - stats.completedTasks}
                </span>
              </div>
              <Progress
                value={
                  ((stats.totalTasks - stats.completedTasks) /
                    Math.max(stats.totalTasks, 1)) *
                  100
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams Overview */}
      <div className="p-3">
        <Card className="workspace-surface border workspace-border shadow-sm">
          <CardHeader>
            <CardTitle className="workspace-text">Teams Overview</CardTitle>
            <CardDescription className="workspace-text-muted">
              Progress and member count for each team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 workspace-surface-secondary rounded-lg border workspace-border"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 workspace-primary rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium workspace-text">
                        {team.name}
                      </h3>
                      <p className="text-sm workspace-text-muted">
                        {(team as any).team_members?.length || 0} members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium workspace-text">
                        {getTeamProgress(team)}%
                      </div>
                      <div className="text-xs workspace-text-muted">
                        Progress
                      </div>
                    </div>
                    <Progress
                      value={getTeamProgress(team)}
                      className="w-24 h-2"
                    />
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 workspace-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium workspace-text mb-2">
                    No teams yet
                  </h3>
                  <p className="workspace-text-muted">
                    Create your first team to get started
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
