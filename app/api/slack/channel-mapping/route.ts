import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
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

    // Get workspace by workspace_id (short ID)
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ mappings: [] });
    }

    // Get Slack integration for the workspace
    const { data: slackIntegration, error: integrationError } = await supabase
      .from("slack_integrations")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("is_active", true)
      .single();

    if (integrationError || !slackIntegration) {
      return NextResponse.json({ mappings: [] });
    }

    // Get channel mappings for the workspace
    const { data: mappings, error } = await supabase
      .from("slack_channel_mappings")
      .select("*")
      .eq("slack_integration_id", slackIntegration.id);

    if (error) {
      console.error("Error fetching channel mappings:", error);
      return NextResponse.json(
        { error: "Failed to fetch channel mappings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ mappings: mappings || [] });
  } catch (error) {
    console.error("Error in channel mappings GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId,
      channelId,
      channelName,
      channelType,
      entityType,
      entityId,
    } = body;

    if (
      !workspaceId ||
      !channelId ||
      !channelName ||
      !entityType ||
      !entityId
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

    // Get workspace by workspace_id (short ID)
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      console.error("Failed to get workspace:", workspaceError);
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Get the Slack integration for this workspace
    const { data: slackIntegration, error: integrationError } = await supabase
      .from("slack_integrations")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("is_active", true)
      .single();

    if (integrationError || !slackIntegration) {
      console.error("Failed to get Slack integration:", integrationError);
      return NextResponse.json(
        { error: "Slack integration not found" },
        { status: 404 }
      );
    }

    // Check if mapping already exists
    const { data: existingMapping } = await supabase
      .from("slack_channel_mappings")
      .select("id")
      .eq("slack_integration_id", slackIntegration.id)
      .eq("entity_type", entityType)
      .eq("entity_id", entityType === "workspace" ? workspace.id : entityId)
      .single();

    if (existingMapping) {
      // Update existing mapping
      const { error: updateError } = await supabase
        .from("slack_channel_mappings")
        .update({
          channel_id: channelId,
          channel_name: channelName,
          channel_type: channelType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMapping.id);

      if (updateError) {
        console.error("Error updating channel mapping:", updateError);
        return NextResponse.json(
          { error: "Failed to update channel mapping" },
          { status: 500 }
        );
      }
    } else {
      // Create new mapping
      const { error: insertError } = await supabase
        .from("slack_channel_mappings")
        .insert({
          slack_integration_id: slackIntegration.id,
          channel_id: channelId,
          channel_name: channelName,
          channel_type: channelType,
          entity_type: entityType,
          entity_id: entityType === "workspace" ? workspace.id : entityId,
        });

      if (insertError) {
        console.error("Error creating channel mapping:", insertError);
        return NextResponse.json(
          { error: "Failed to create channel mapping" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in channel mappings POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const mappingId = searchParams.get("mappingId");

    if (!mappingId) {
      return NextResponse.json(
        { error: "Mapping ID is required" },
        { status: 400 }
      );
    }

    // Delete channel mapping
    const { error } = await supabase
      .from("slack_channel_mappings")
      .update({ is_active: false })
      .eq("id", mappingId);

    if (error) {
      throw new Error(`Failed to delete channel mapping: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Channel mapping deleted successfully",
    });
  } catch (error: any) {
    console.error("Slack channel mapping delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete channel mapping" },
      { status: 500 }
    );
  }
}
