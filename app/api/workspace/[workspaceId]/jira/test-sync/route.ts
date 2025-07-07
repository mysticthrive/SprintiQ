import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { JiraSyncService } from "@/lib/jira-sync-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    console.log(`Testing sync for project: ${projectId}`);

    // Get workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("workspace_id", params.workspaceId)
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

    // Initialize sync service
    const syncService = new JiraSyncService(supabase, integration, project);

    // Test connection
    const jiraAPI = syncService["jiraAPI"];
    const connectionTest = await jiraAPI.testConnection();

    if (!connectionTest) {
      return NextResponse.json(
        { error: "Failed to connect to Jira API" },
        { status: 500 }
      );
    }

    // Get sync status
    const syncStatus = await syncService.getSyncStatus();

    // Test project key access
    const projectKey = (project.external_data as any)?.jira_project_key;
    let projectAccessTest = false;
    let issuesCount = 0;
    let statusesCount = 0;

    if (projectKey) {
      try {
        const issues = await jiraAPI.getProjectIssues(projectKey, 10);
        const statuses = await jiraAPI.getProjectStatuses(projectKey);
        projectAccessTest = true;
        issuesCount = issues.length;
        statusesCount = statuses.length;
      } catch (error: any) {
        console.error("Project access test failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        connectionTest: true,
        projectAccessTest,
        projectKey,
        issuesCount,
        statusesCount,
        syncStatus,
        projectInfo: {
          id: project.id,
          name: project.name,
          type: project.type,
          externalId: project.external_id,
          externalData: project.external_data,
        },
        integrationInfo: {
          domain: integration.jira_domain,
          email: integration.jira_email,
          isActive: integration.is_active,
        },
      },
    });
  } catch (error: any) {
    console.error("Test sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to test sync" },
      { status: 500 }
    );
  }
}
