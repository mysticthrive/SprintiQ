import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  SlackNotificationService,
  SlackNotificationData,
} from "@/lib/slack-notification-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const notificationData: SlackNotificationData = body;

    // Validate required fields
    if (
      !notificationData.workspaceId ||
      !notificationData.entityType ||
      !notificationData.entityId ||
      !notificationData.entityName ||
      !notificationData.eventType ||
      !notificationData.description ||
      !notificationData.userId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First get the workspace UUID from the short ID
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", notificationData.workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
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

    // Check if Slack integration exists and is active
    const { data: slackIntegration } = await supabase
      .from("slack_integrations")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("is_active", true)
      .single();

    if (!slackIntegration) {
      return NextResponse.json(
        { error: "Slack integration not found or inactive" },
        { status: 404 }
      );
    }

    // Send the notification
    const notificationService = new SlackNotificationService();
    await notificationService.sendNotification(notificationData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
