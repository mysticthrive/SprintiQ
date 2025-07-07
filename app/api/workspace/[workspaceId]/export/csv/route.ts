import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    console.log("CSV Export API called for workspace:", params.workspaceId);

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

    // Convert tasks to CSV format
    const csvHeaders = [
      "Task ID",
      "Name",
      "Description",
      "Status",
      "Priority",
      "Assignee",
      "Start Date",
      "Due Date",
      "Created At",
      "Updated At",
      "Type",
      "External ID",
    ];

    const csvRows = (tasksWithAssignees || []).map((task) => [
      task.task_id || task.id,
      task.name,
      task.description || "",
      task.status?.name || "",
      task.priority || "",
      task.assignee?.full_name || task.assignee?.email || "",
      task.start_date || "",
      task.due_date || "",
      task.created_at,
      task.updated_at,
      task.type || "",
      task.external_id || "",
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row
          .map((cell) => {
            // Escape commas and quotes in CSV
            const cellStr = String(cell || "");
            if (
              cellStr.includes(",") ||
              cellStr.includes('"') ||
              cellStr.includes("\n")
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    // Return CSV data
    return NextResponse.json({
      success: true,
      data: csvContent,
      filename: `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_tasks_${
        new Date().toISOString().split("T")[0]
      }.csv`,
    });
  } catch (error: any) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Failed to export data to CSV" },
      { status: 500 }
    );
  }
}
