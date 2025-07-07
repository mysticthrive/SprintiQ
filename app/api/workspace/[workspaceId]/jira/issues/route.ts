import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import JiraAPI from "@/lib/jira-api";

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, find the workspace by workspace_id
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", params.workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check workspace access using the actual workspace id
    const { data: workspaceMember } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .single();

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Access denied to workspace" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jira_domain, jira_email, jira_api_token, project_key } = body;

    if (!jira_domain || !jira_email || !jira_api_token || !project_key) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get Jira issues and statuses
    const jiraAPI = new JiraAPI({
      domain: jira_domain,
      email: jira_email,
      apiToken: jira_api_token,
    });

    const [issues, statuses] = await Promise.all([
      jiraAPI.getProjectIssues(project_key),
      jiraAPI.getProjectStatuses(project_key),
    ]);

    return NextResponse.json({
      success: true,
      issues: issues.map((issue) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: issue.fields.status,
        priority: issue.fields.priority,
        assignee: issue.fields.assignee,
        created: issue.fields.created,
        updated: issue.fields.updated,
        duedate: issue.fields.duedate,
        parent: issue.fields.parent,
        subtasks: issue.fields.subtasks,
      })),
      statuses: statuses.map((status) => ({
        id: status.id,
        name: status.name,
        statusCategory: status.statusCategory,
      })),
    });
  } catch (error: any) {
    console.error("Jira issues fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
