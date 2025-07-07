import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SlackService } from "@/lib/slack-service";

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (
      !process.env.NEXT_PUBLIC_SLACK_CLIENT_ID ||
      !process.env.NEXT_PUBLIC_SLACK_CLIENT_SECRET
    ) {
      console.error("Missing Slack environment variables");
      return NextResponse.json(
        { error: "Slack configuration is incomplete" },
        { status: 500 }
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

    // Generate OAuth URL
    const slackService = new SlackService();
    const state = `${workspaceId}:${user.id}`; // Include workspace and user info in state
    const oauthUrl = slackService.generateOAuthUrl(state);

    return NextResponse.json({
      success: true,
      oauthUrl,
    });
  } catch (error: any) {
    console.error("Slack OAuth error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate OAuth URL" },
      { status: 500 }
    );
  }
}
