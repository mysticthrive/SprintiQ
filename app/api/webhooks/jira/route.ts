import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { JiraSyncService } from "@/lib/jira-sync-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    console.log("Received Jira webhook:", body);

    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get("x-hub-signature");
    if (!signature) {
      console.warn("No webhook signature provided");
    }

    // Extract project information from webhook
    const { issue, project, user, timestamp, webhookEvent } = body;

    if (!issue || !project) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Find the project by Jira project key
    const { data: projects, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("type", "jira")
      .not("external_data", "is", null);

    if (projectError) {
      console.error("Error fetching projects:", projectError);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    // Find the project that matches this Jira project
    const matchingProject = projects?.find(
      (p) => (p.external_data as any)?.jira_project_key === project.key
    );

    if (!matchingProject) {
      console.log(
        `No matching project found for Jira project key: ${project.key}`
      );
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get the workspace for this project
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", matchingProject.workspace_id)
      .single();

    if (workspaceError || !workspace) {
      console.error("Error fetching workspace:", workspaceError);
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
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
      console.error("Error fetching Jira integration:", integrationError);
      return NextResponse.json(
        { error: "Jira integration not found" },
        { status: 404 }
      );
    }

    // Initialize sync service
    const syncService = new JiraSyncService(
      supabase,
      integration,
      matchingProject
    );

    // Handle different webhook events
    switch (webhookEvent) {
      case "jira:issue_created":
      case "jira:issue_updated":
      case "jira:issue_deleted":
        // Pull changes from Jira for this specific issue
        await syncService.performBidirectionalSync({
          pushToJira: false, // Don't push back to avoid loops
          pullFromJira: true,
          syncTasks: true,
          syncStatuses: false, // Status changes are handled separately
        });
        break;

      case "jira:worklog_updated":
      case "jira:worklog_deleted":
        // Handle worklog changes if needed
        break;

      case "jira:version_released":
      case "jira:version_unreleased":
        // Handle version changes if needed
        break;

      default:
        console.log(`Unhandled webhook event: ${webhookEvent}`);
    }

    // Log the webhook event
    await supabase.from("events").insert({
      type: "webhook",
      entity_type: "jira",
      entity_id: issue.id,
      entity_name: issue.fields?.summary || "Unknown",
      user_id: user?.accountId || "system",
      workspace_id: workspace.id,
      space_id: matchingProject.space_id,
      project_id: matchingProject.id,
      description: `Received Jira webhook: ${webhookEvent}`,
      metadata: {
        webhookEvent,
        issueKey: issue.key,
        projectKey: project.key,
        timestamp,
        user: user?.displayName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Jira webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification endpoint
  return NextResponse.json({
    message: "Jira webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
