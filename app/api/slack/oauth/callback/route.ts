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
      return NextResponse.redirect(
        new URL(
          "/settings/notifications?error=missing_env_vars&message=Slack configuration is incomplete",
          request.url
        )
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(
        new URL("/signin?error=unauthorized", request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Slack OAuth error:", error);

      // Provide more specific error messages
      let errorMessage = error;
      if (error === "invalid_team_for_non_distributed_app") {
        errorMessage =
          "This Slack app is not configured for multiple workspaces. Please contact your administrator to make the app distributable.";
      } else if (error === "access_denied") {
        errorMessage =
          "Access was denied. Please try again and make sure to authorize the app.";
      } else if (error === "invalid_client") {
        errorMessage =
          "Invalid Slack app configuration. Please check your app settings.";
      }

      return NextResponse.redirect(
        new URL(
          `/settings/notifications?error=slack_oauth_failed&message=${encodeURIComponent(
            errorMessage
          )}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/settings/notifications?error=missing_oauth_params",
          request.url
        )
      );
    }

    // Parse state to get workspace ID and user ID
    const [workspaceId, userId] = state.split(":");

    if (!workspaceId || userId !== user.id) {
      return NextResponse.redirect(
        new URL("/settings/notifications?error=invalid_state", request.url)
      );
    }

    // Verify workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.redirect(
        new URL(
          "/settings/notifications?error=workspace_not_found",
          request.url
        )
      );
    }

    const { data: workspaceMember } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .single();

    if (!workspaceMember) {
      return NextResponse.redirect(
        new URL("/settings/notifications?error=access_denied", request.url)
      );
    }

    // Exchange code for token
    const slackService = new SlackService();
    const oauthResponse = await slackService.exchangeCodeForToken(code);

    if (!oauthResponse.ok) {
      console.error("Slack OAuth exchange failed:", oauthResponse.error);
      return NextResponse.redirect(
        new URL(
          `/settings/notifications?error=oauth_exchange_failed&message=${oauthResponse.error}`,
          request.url
        )
      );
    }

    // Save integration to database
    await slackService.saveIntegration(workspace.id, oauthResponse);

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL(
        `/${workspaceId}/settings/notifications?success=slack_connected&workspace=${workspaceId}`,
        request.url
      )
    );
  } catch (error: any) {
    console.error("Slack OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings/notifications?error=callback_failed&message=${error.message}`,
        request.url
      )
    );
  }
}
