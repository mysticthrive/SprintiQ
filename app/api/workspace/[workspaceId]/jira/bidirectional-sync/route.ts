import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { JiraSyncService } from "@/lib/jira-sync-service";

export async function POST(
  request: NextRequest,
  context: { params: { workspaceId: string } }
) {
  const { params } = context;
  const { workspaceId } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { projectId, options, resetFailed } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Get project and check if it's a Jira project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.type !== "jira" || !project.external_id) {
      return NextResponse.json(
        { error: "Project is not a Jira project" },
        { status: 400 }
      );
    }

    // Get Jira integration
    const { data: integration, error: integrationError } = await supabase
      .from("jira_integrations")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: "Jira integration not found" },
        { status: 404 }
      );
    }

    // Initialize sync service
    const syncService = new JiraSyncService(supabase, integration, project);

    // Reset failed syncs if requested
    if (resetFailed) {
      await syncService.resetFailedSyncs();
    }

    // Perform bidirectional sync
    const syncOptions = {
      pushToJira: options?.pushToJira ?? true,
      pullFromJira: options?.pullFromJira ?? true,
      resolveConflicts: options?.resolveConflicts ?? "manual",
      syncTasks: options?.syncTasks ?? true,
      syncStatuses: options?.syncStatuses ?? true,
    };

    const result = await syncService.performBidirectionalSync(syncOptions);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          tasksPushedToJira: result.data.tasksPushedToJira,
          tasksPulledFromJira: result.data.tasksPulledFromJira,
          statusesPushedToJira: result.data.statusesPushedToJira,
          statusesPulledFromJira: result.data.statusesPulledFromJira,
          conflicts: result.data.conflicts,
        },
      });
    } else {
      console.error("Bidirectional sync failed:", result.message);
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Bidirectional Jira sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform bidirectional sync" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { workspaceId: string } }
) {
  const { params } = context;
  const { workspaceId } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.type !== "jira") {
      return NextResponse.json(
        { error: "Project is not a Jira project" },
        { status: 400 }
      );
    }

    // Get Jira integration
    const { data: integration, error: integrationError } = await supabase
      .from("jira_integrations")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: "Jira integration not found" },
        { status: 404 }
      );
    }

    // Initialize sync service and get sync status
    const syncService = new JiraSyncService(supabase, integration, project);
    const syncStatus = await syncService.getSyncStatus();

    return NextResponse.json({
      success: true,
      data: syncStatus,
    });
  } catch (error: any) {
    console.error("Get sync status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get sync status" },
      { status: 500 }
    );
  }
}
