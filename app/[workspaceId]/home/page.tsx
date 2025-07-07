import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  Calendar,
  BarChart3,
  Clock,
  ArrowRight,
  Folder,
  Layout,
  Globe,
  Hash,
  LayoutDashboard,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WorkspaceCharts from "@/components/workspace/charts/workspace-charts";
import { getStatusTypeColor, STATUS_TYPES } from "@/lib/status-utils";
import SprintSession from "@/components/workspace/sprint-session";
import { ScrollArea } from "@/components/ui/scroll-area";
import JiraSvg from "@/components/svg/apps/JiraSvg";

interface WorkspaceHomeProps {
  params: { workspaceId: string };
}

interface TaskCount {
  space: {
    id: string;
    name: string;
  };
  count: number;
}

interface SprintInfo {
  id: string;
  sprint_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  space: {
    id: string;
    name: string;
    space_id: string;
  };
  sprint_folder: {
    id: string;
    name: string;
    sprint_folder_id: string;
  };
  taskCount: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export default async function WorkspaceHomePage(props: WorkspaceHomeProps) {
  const params = await props.params;
  const workspaceId = params.workspaceId;
  const supabase = await createServerSupabaseClient();

  // Get workspace data using short workspace_id
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  // Get spaces with projects and task counts
  const { data: spaces } = await supabase
    .from("spaces")
    .select(
      `
      id,
      name,
      space_id,
      projects (*)
    `
    )
    .eq("workspace_id", workspace?.id)
    .order("created_at", { ascending: true });

  // Get workspace members with their profiles
  const { data: members } = await supabase
    .from("workspace_members")
    .select(
      `
      *,
      profiles (*)
    `
    )
    .eq("workspace_id", workspace?.id)
    .eq("status", "active");

  // Get task counts by status
  const { count: totalTasks = 0 } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("space.workspace_id", workspace?.id)
    .not("status", "eq", "deleted");

  const { count: completedTasks = 0 } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("space.workspace_id", workspace?.id)
    .eq("status", "completed");

  const { count: inProgressTasks = 0 } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("space.workspace_id", workspace?.id)
    .eq("status", "in_progress");

  // Get all spaces first
  const { data: workspaceSpaces = [] } = await supabase
    .from("spaces")
    .select("id, name")
    .eq("workspace_id", workspace?.id);

  // Get task counts for each space (directly by space_id)
  const tasksPerSpace: TaskCount[] = await Promise.all(
    (spaces || []).map(async (space) => {
      const { count = 0 } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("space_id", space.id);
      return {
        space: {
          id: space.id,
          name: space.name,
        },
        count: count || 0,
      };
    })
  );

  // Get project counts for each space
  const projectsPerSpace = (spaces || []).map((space) => ({
    space: {
      id: space.id,
      name: space.name,
    },
    count: space.projects?.length || 0,
  }));

  // Get recent events
  const { data: recentEvents } = await supabase
    .from("events")
    .select(
      `
      *,
      user:profiles(*)
    `
    )
    .eq("workspace_id", workspace?.id)
    .order("created_at", { ascending: false })
    .limit(7);

  const events = recentEvents || [];

  // Get all statuses for the workspace with their status_types
  const { data: statuses = [] } = await supabase
    .from("statuses")
    .select("id, name, color, status_type:status_types(name)")
    .eq("workspace_id", workspace?.id);

  const statusTypeCounts = await Promise.all(
    Object.entries(STATUS_TYPES).map(async ([key, statusTypeName]) => {
      const statusesOfType = (statuses || []).filter((status) => {
        if (status.status_type) {
          if (Array.isArray(status.status_type)) {
            const firstStatusType = status.status_type[0] as any;
            return firstStatusType?.name === statusTypeName;
          } else if (
            typeof status.status_type === "object" &&
            status.status_type !== null
          ) {
            const statusTypeObj = status.status_type as any;
            return statusTypeObj.name === statusTypeName;
          }
        }
        return false;
      });

      let count = 0;
      if (statusesOfType.length > 0) {
        const statusIds = statusesOfType.map((s) => s.id);
        const { count: typeCount = 0 } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .in("status_id", statusIds);
        count = typeCount || 0;
      }

      // Map status type names to display names
      const displayName =
        key === "NOT_STARTED"
          ? "Not Started"
          : key === "ACTIVE"
          ? "Active"
          : key === "DONE"
          ? "Done"
          : key === "CLOSED"
          ? "Closed"
          : key;

      return {
        name: displayName,
        color: getStatusTypeColor(statusTypeName),
        count: count,
      };
    })
  );

  const totalTasksForStatus = statusTypeCounts.reduce(
    (sum, status) => sum + status.count,
    0
  );

  let statusCounts = statusTypeCounts.map((status) => ({
    ...status,
    percentage:
      totalTasksForStatus > 0
        ? Math.round((status.count / totalTasksForStatus) * 100)
        : 0,
  }));

  // Fallback: If no status data found, show a default structure
  if (totalTasksForStatus === 0) {
    statusCounts = [
      { name: "Not Started", color: "#6B7280", count: 0, percentage: 0 },
      { name: "Active", color: "#3B82F6", count: 0, percentage: 0 },
      { name: "Done", color: "#10B981", count: 0, percentage: 0 },
      { name: "Closed", color: "#8B5CF6", count: 0, percentage: 0 },
    ];
  }

  // Get sprint information for the workspace
  const { data: sprints } = await supabase
    .from("sprints")
    .select(
      `
      id,
      sprint_id,
      name,
      goal,
      start_date,
      end_date,
      space:spaces(id, name, space_id),
      sprint_folder:sprint_folders(id, name, sprint_folder_id)
    `
    )
    .eq("space.workspace_id", workspace?.id)
    .order("start_date", { ascending: true });

  // Get task counts for each sprint
  const sprintsWithTaskCounts = await Promise.all(
    (sprints || []).map(async (sprint) => {
      const { count: taskCount = 0 } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("sprint_id", sprint.id);

      const { count: completedCount = 0 } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("sprint_id", sprint.id)
        .eq("status", "completed");

      const { count: inProgressCount = 0 } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("sprint_id", sprint.id)
        .eq("status", "in_progress");

      // Get overdue tasks (tasks with due_date in the past and not completed)
      const { count: overdueCount = 0 } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("sprint_id", sprint.id)
        .not("status", "eq", "completed")
        .lt("due_date", new Date().toISOString().split("T")[0]);

      // Handle space and sprint_folder data that might come as arrays
      const space = Array.isArray(sprint.space)
        ? sprint.space[0]
        : sprint.space;
      const sprint_folder = Array.isArray(sprint.sprint_folder)
        ? sprint.sprint_folder[0]
        : sprint.sprint_folder;

      return {
        id: sprint.id,
        sprint_id: sprint.sprint_id,
        name: sprint.name,
        goal: sprint.goal,
        start_date: sprint.start_date,
        end_date: sprint.end_date,
        space: {
          id: space?.id || "",
          name: space?.name || "",
          space_id: space?.space_id || "",
        },
        sprint_folder: {
          id: sprint_folder?.id || "",
          name: sprint_folder?.name || "",
          sprint_folder_id: sprint_folder?.sprint_folder_id || "",
        },
        taskCount: taskCount || 0,
        completedTasks: completedCount || 0,
        inProgressTasks: inProgressCount || 0,
        overdueTasks: overdueCount || 0,
      };
    })
  );

  return (
    <div>
      {/* Top section */}
      <div className="p-3 border-b workspace-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 workspace-component-bg rounded-md items-center flex justify-center">
              <LayoutDashboard className="w-4 w-4 workspace-component-active-color" />
            </div>
            <div>
              <span className="text-sm font-bold">
                {workspace?.name}'s Workspace!
              </span>
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-[10px] workspace-header-text">
                  Here's what's happening in your workspace.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 px-3 mt-3 mb-3">
        <Card className="workspace-header-bg border workspace-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Spaces & Projects
            </CardTitle>
            <Layout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {spaces?.length || 0} /{" "}
              {spaces?.reduce(
                (acc, space) => acc + (space.projects?.length || 0),
                0
              ) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Spaces / Projects
            </p>
          </CardContent>
        </Card>

        <Card className="workspace-header-bg border workspace-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members?.length || 1}</div>
            <p className="text-xs text-muted-foreground mt-2">Active members</p>
          </CardContent>
        </Card>

        <Card className="workspace-header-bg border workspace-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                ((statusCounts.find((status) => status.name === "Done")
                  ?.count || 0) /
                  (totalTasksForStatus || 1)) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {statusCounts.find((status) => status.name === "Done")?.count ||
                0}{" "}
              of {totalTasksForStatus || 0} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card className="workspace-header-bg border workspace-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusCounts.find((status) => status.name === "Active")?.count ||
                0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tasks in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="px-3 mb-3">
        <WorkspaceCharts
          statusCounts={statusCounts}
          tasksPerSpace={tasksPerSpace}
          projectsPerSpace={projectsPerSpace}
        />

        {/* Sprint Session */}
        <SprintSession
          sprints={sprintsWithTaskCounts}
          workspaceId={workspaceId}
        />
      </div>

      {/* Team Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 px-3 mb-3 h-full">
        {/* Spaces and Projects */}
        <div className="flex flex-col gap-3 h-full">
          <Card className="workspace-header-bg border workspace-border">
            <CardHeader>
              <CardTitle className="text-lg">Spaces & Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px]">
                {spaces?.map((space) => (
                  <div key={space.id} className="space-y-2 pb-2">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">{space.name}</h3>
                      {space.projects?.length > 0 && (
                        <div className="flex items-center">
                          {space.projects.map((project) => (
                            <div key={project.id}>
                              {project.type == "jira" && (
                                <div className="w-3 h-3">
                                  <JiraSvg />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="pl-6 space-y-1">
                      {space.projects?.map(
                        (project: {
                          id: string;
                          name: string;
                          project_id: string;
                          type: string;
                        }) => (
                          <Link
                            key={project.id}
                            href={`/${workspaceId}/space/${space.space_id}/project/${project.project_id}`}
                            className="block text-xs workspace-text-muted hover:text-gray-900 group flex gap-2 items-center"
                          >
                            <Hash className="h-3 w-3 group-hover:scale-110 transition-all" />
                            {project.name}
                            <div className="w-3 h-3">
                              {project.type == "jira" && <JiraSvg />}
                            </div>
                          </Link>
                        )
                      )}
                      {space.projects?.length === 0 && (
                        <p className="text-sm text-gray-500">No projects yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
          <Card className="workspace-header-bg border workspace-border">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link
                href={`/${workspaceId}/settings/members`}
                className="flex items-center justify-between p-4 border workspace-border rounded-lg hover:workspace-hover transition-colors"
              >
                <div>
                  <h3 className="font-medium">Invite Team Members</h3>
                  <p className="text-sm text-gray-500">
                    Grow your workspace team
                  </p>
                </div>
                <Users className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href={`/${workspaceId}/settings/spaces`}
                className="flex items-center justify-between p-4 border workspace-border rounded-lg hover:workspace-hover transition-colors"
              >
                <div>
                  <h3 className="font-medium">Create New Space</h3>
                  <p className="text-sm text-gray-500">
                    Organize your projects
                  </p>
                </div>
                <Plus className="h-5 w-5 text-gray-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
        <Card className="workspace-header-bg border workspace-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Link href={`/${workspaceId}/inbox`}>
              <Button variant="ghost" size="sm" className="h-8">
                View More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">
                No recent activity to show.
              </p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={event.user?.avatar_url} />
                      <AvatarFallback>
                        {event.user?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {event.user?.full_name || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {event.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Activity */}
      </div>
    </div>
  );
}
