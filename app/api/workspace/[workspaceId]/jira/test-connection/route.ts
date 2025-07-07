import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import JiraAPI from "@/lib/jira-api";

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    console.log(
      "Test connection API called for workspace:",
      params.workspaceId
    );

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("Auth check result:", { user: !!user, authError: !!authError });

    if (authError || !user) {
      console.log("Authentication failed:", { authError, userId: user?.id });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // First, find the workspace by workspace_id
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", params.workspaceId)
      .single();

    console.log("Workspace lookup result:", {
      workspace: !!workspace,
      workspaceError: !!workspaceError,
    });

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

    console.log("Workspace member check:", {
      workspaceMember: !!workspaceMember,
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Access denied to workspace" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jira_domain, jira_email, jira_api_token } = body;

    console.log("Request body received:", {
      hasDomain: !!jira_domain,
      hasEmail: !!jira_email,
      hasToken: !!jira_api_token,
    });

    if (!jira_domain || !jira_email || !jira_api_token) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Test Jira connection
    const jiraAPI = new JiraAPI({
      domain: jira_domain,
      email: jira_email,
      apiToken: jira_api_token,
    });

    console.log("Testing Jira connection...");
    const isConnected = await jiraAPI.testConnection();
    console.log("Jira connection result:", isConnected);

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: "Connection successful",
      });
    } else {
      return NextResponse.json(
        { error: "Failed to connect to Jira" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Jira test connection error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
