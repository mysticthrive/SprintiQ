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
    const { jira_domain, jira_email, jira_api_token } = body;

    if (!jira_domain || !jira_email || !jira_api_token) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get Jira projects
    const jiraAPI = new JiraAPI({
      domain: jira_domain,
      email: jira_email,
      apiToken: jira_api_token,
    });

    const projects = await jiraAPI.getProjects();

    // Add debugging and validation
    console.log("Jira projects response:", projects);
    console.log("Projects type:", typeof projects);
    console.log("Is array:", Array.isArray(projects));

    if (!Array.isArray(projects)) {
      console.error("Projects is not an array:", projects);
      return NextResponse.json(
        { error: "Invalid response from Jira API - projects is not an array" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: projects.map((project) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description,
        lead: project.lead,
        url: project.url,
      })),
    });
  } catch (error: any) {
    console.error("Jira projects fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
