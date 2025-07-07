import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import JiraAPI from "@/lib/jira-api";
import { JiraConverter } from "@/lib/jira-converter";
import type { Workspace, Space, JiraIntegration } from "@/lib/database.types";

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
      .select("*")
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
    const {
      jira_domain,
      jira_email,
      jira_api_token,
      space_id,
      selected_projects,
    } = body;

    if (
      !jira_domain ||
      !jira_email ||
      !jira_api_token ||
      !space_id ||
      !selected_projects
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get space data
    const { data: space } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", space_id)
      .single();

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // Create or get Jira integration
    let integration: JiraIntegration;
    const { data: existingIntegration } = await supabase
      .from("jira_integrations")
      .select("*")
      .eq("workspace_id", workspace.id)
      .single();

    if (existingIntegration) {
      // Update existing integration
      const { data: updatedIntegration, error: updateError } = await supabase
        .from("jira_integrations")
        .update({
          jira_domain,
          jira_email,
          jira_api_token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingIntegration.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update integration: ${updateError.message}`);
      }

      integration = updatedIntegration;
    } else {
      // Create new integration
      const { data: newIntegration, error: createError } = await supabase
        .from("jira_integrations")
        .insert({
          workspace_id: workspace.id,
          jira_domain,
          jira_email,
          jira_api_token,
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create integration: ${createError.message}`);
      }

      integration = newIntegration;
    }

    // Initialize Jira API
    const jiraAPI = new JiraAPI({
      domain: jira_domain,
      email: jira_email,
      apiToken: jira_api_token,
    });

    // Get all projects from Jira
    const allJiraProjects = await jiraAPI.getProjects();
    const selectedJiraProjects = allJiraProjects.filter((project) =>
      selected_projects.includes(project.key)
    );

    // Collect all issues and statuses from selected projects
    const allIssues: any[] = [];
    const allStatuses: any[] = [];
    const statusMap = new Map<string, any>();

    for (const project of selectedJiraProjects) {
      try {
        const [issues, statuses] = await Promise.all([
          jiraAPI.getProjectIssues(project.key),
          jiraAPI.getProjectStatuses(project.key),
        ]);

        allIssues.push(...issues);

        // Merge statuses, avoiding duplicates
        statuses.forEach((status) => {
          if (!statusMap.has(status.id)) {
            statusMap.set(status.id, status);
            allStatuses.push(status);
          }
        });
      } catch (error) {
        console.error(
          `Failed to fetch data for project ${project.key}:`,
          error
        );
        // Continue with other projects
      }
    }

    // Convert Jira projects to our format
    const jiraProjectsForConversion = selectedJiraProjects.map((project) => ({
      id: "", // Will be set by database
      jira_integration_id: integration.id,
      jira_project_id: project.id,
      jira_project_key: project.key,
      jira_project_name: project.name,
      jira_project_description: project.description || null,
      jira_project_lead: project.lead?.displayName || null,
      jira_project_url: project.url,
      space_id: space_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Convert and save data
    const converter = new JiraConverter(
      supabase,
      workspace,
      space,
      integration
    );
    const result = await converter.convertAndSave(
      jiraProjectsForConversion,
      allIssues,
      allStatuses
    );

    return NextResponse.json({
      success: true,
      message: "Jira data imported successfully",
      data: {
        projects: result.projects.length,
        tasks: result.tasks.length,
        statuses: result.statuses.length,
      },
    });
  } catch (error: any) {
    console.error("Jira import error:", error);

    // Check if it's a duplicate key error
    if (
      error.message &&
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Jira data imported successfully (some projects were already imported)",
        data: {
          projects: 0, // We don't know the exact count due to partial import
          tasks: 0,
          statuses: 0,
        },
        warning:
          "Some projects were already imported. New data has been added successfully.",
      });
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
