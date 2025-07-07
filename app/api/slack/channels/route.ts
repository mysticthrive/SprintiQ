import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SlackService } from "@/lib/slack-service";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

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

    // Get Slack integration
    const slackService = new SlackService();
    const integration = await slackService.getIntegration(workspace.id);

    if (!integration) {
      return NextResponse.json(
        { error: "Slack integration not found" },
        { status: 404 }
      );
    }

    // Get channels from Slack
    const channels = await slackService.getChannels(integration.access_token);

    return NextResponse.json({
      success: true,
      channels,
    });
  } catch (error: any) {
    console.error("Slack channels error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch channels" },
      { status: 500 }
    );
  }
}
