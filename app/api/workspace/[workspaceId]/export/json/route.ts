import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    console.log("JSON Export API called for workspace:", params.workspaceId);

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, find the workspace by workspace_id (short ID)
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("workspace_id", params.workspaceId)
      .single();

    if (workspaceError || !workspace) {
      console.error("Workspace not found:", workspaceError);
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        space:spaces(*)
      `
      )
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get tasks for this project
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(
        `
        *,
        status:statuses(*)
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    // Get assignee information for tasks that have assignees
    const assigneeIds =
      tasks
        ?.filter((task) => task.assignee_id)
        .map((task) => task.assignee_id)
        .filter((id, index, arr) => arr.indexOf(id) === index) || [];

    let assignees: any[] = [];
    if (assigneeIds.length > 0) {
      const { data: assigneesData, error: assigneesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", assigneeIds);

      if (!assigneesError && assigneesData) {
        assignees = assigneesData;
      }
    }

    // Merge assignee data with tasks
    const tasksWithAssignees =
      tasks?.map((task) => {
        const assignee = assignees.find((a) => a.id === task.assignee_id);
        return {
          ...task,
          assignee: assignee || null,
        };
      }) || [];

    // Get statuses for this project
    const { data: statuses, error: statusesError } = await supabase
      .from("statuses")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (statusesError) {
      console.error("Error fetching statuses:", statusesError);
      return NextResponse.json(
        { error: "Failed to fetch statuses" },
        { status: 500 }
      );
    }

    // Prepare export data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        workspace: {
          id: workspace.id,
          workspace_id: params.workspaceId,
          name: workspace.name,
        },
        project: {
          id: project.id,
          project_id: project.project_id,
          name: project.name,
          type: project.type,
          external_id: project.external_id,
          external_data: project.external_data,
          created_at: project.created_at,
          updated_at: project.updated_at,
        },
        space: project.space,
      },
      statuses: statuses || [],
      tasks: tasksWithAssignees,
      summary: {
        totalTasks: tasks?.length || 0,
        totalStatuses: statuses?.length || 0,
        tasksByStatus:
          tasks?.reduce((acc, task) => {
            const statusName = task.status?.name || "Unknown";
            acc[statusName] = (acc[statusName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
      },
    };

    // Return JSON data
    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_export_${
        new Date().toISOString().split("T")[0]
      }.json`,
    });
  } catch (error: any) {
    console.error("JSON export error:", error);
    return NextResponse.json(
      { error: "Failed to export data to JSON" },
      { status: 500 }
    );
  }
}
