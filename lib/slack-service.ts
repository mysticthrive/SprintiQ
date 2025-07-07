import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  SlackIntegration,
  SlackChannelMapping,
} from "@/lib/database.types";

interface SlackOAuthResponse {
  ok: boolean;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  authed_user?: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
  team?: {
    name: string;
    id: string;
    domain: string;
  };
  enterprise?: {
    name: string;
    id: string;
  };
  is_enterprise_install?: boolean;
  app_id?: string;
  error?: string;
}

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_mpim: boolean;
  is_im: boolean;
  is_channel: boolean;
  is_group: boolean;
  is_general: boolean;
  is_member: boolean;
  num_members: number;
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
}

interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

export class SlackService {
  private supabase: any;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID || "";
    this.clientSecret = process.env.NEXT_PUBLIC_SLACK_CLIENT_SECRET || "";
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth/callback`;
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerSupabaseClient();
    }
    return this.supabase;
  }

  /**
   * Generate OAuth URL for Slack integration
   */
  generateOAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope:
        "chat:write,channels:read,groups:read,im:read,mpim:read,users:read",
      redirect_uri: this.redirectUri,
      state: state,
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<SlackOAuthResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    return await response.json();
  }

  /**
   * Get channels from Slack workspace
   */
  async getChannels(accessToken: string): Promise<SlackChannel[]> {
    const response = await fetch("https://slack.com/api/conversations.list", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data.channels || [];
  }

  /**
   * Send message to Slack channel
   */
  async sendMessage(
    accessToken: string,
    message: SlackMessage
  ): Promise<boolean> {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack message error:", data.error);
      return false;
    }

    return true;
  }

  /**
   * Save Slack integration to database
   */
  async saveIntegration(
    workspaceId: string,
    oauthResponse: SlackOAuthResponse
  ): Promise<SlackIntegration> {
    const supabase = await this.getSupabase();

    if (!oauthResponse.ok || !oauthResponse.access_token) {
      throw new Error("Invalid OAuth response");
    }

    const integrationData = {
      workspace_id: workspaceId,
      slack_workspace_id: oauthResponse.team?.id || "",
      slack_workspace_name: oauthResponse.team?.name || "",
      slack_workspace_domain: oauthResponse.team?.domain || null,
      access_token: oauthResponse.access_token,
      bot_user_id: oauthResponse.bot_user_id || null,
      bot_username: null, // Will be fetched separately if needed
      is_active: true,
    };

    const { data, error } = await supabase
      .from("slack_integrations")
      .upsert(integrationData, {
        onConflict: "workspace_id,slack_workspace_id",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save Slack integration: ${error.message}`);
    }

    // Create default notification settings for this integration
    const defaultEventTypes = [
      "task_created",
      "task_updated",
      "task_completed",
      "task_assigned",
      "task_commented",
      "sprint_started",
      "sprint_completed",
      "project_created",
      "project_updated",
    ];

    const notificationSettings = defaultEventTypes.map((eventType) => ({
      slack_integration_id: data.id,
      event_type: eventType,
      is_enabled: true,
    }));

    const { error: settingsError } = await supabase
      .from("slack_notification_settings")
      .upsert(notificationSettings, {
        onConflict: "slack_integration_id,event_type",
      });

    if (settingsError) {
      console.error(
        "Failed to create default notification settings:",
        settingsError
      );
      // Don't throw error here as the integration was created successfully
    }

    return data;
  }

  /**
   * Get Slack integration for workspace
   */
  async getIntegration(workspaceId: string): Promise<SlackIntegration | null> {
    const supabase = await this.getSupabase();

    const { data, error } = await supabase
      .from("slack_integrations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get Slack integration: ${error.message}`);
    }

    return data;
  }

  /**
   * Save channel mapping
   */
  async saveChannelMapping(
    slackIntegrationId: string,
    channelId: string,
    channelName: string,
    channelType: string,
    entityType: string,
    entityId: string
  ): Promise<SlackChannelMapping> {
    const supabase = await this.getSupabase();

    const mappingData = {
      slack_integration_id: slackIntegrationId,
      channel_id: channelId,
      channel_name: channelName,
      channel_type: channelType,
      entity_type: entityType,
      entity_id: entityId,
      is_active: true,
    };

    const { data, error } = await supabase
      .from("slack_channel_mappings")
      .upsert(mappingData, {
        onConflict: "slack_integration_id,channel_id,entity_type,entity_id",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save channel mapping: ${error.message}`);
    }

    return data;
  }

  /**
   * Get channel mappings for an entity
   */
  async getChannelMappings(
    entityType: string,
    entityId: string
  ): Promise<
    (SlackChannelMapping & { slack_integrations: SlackIntegration })[]
  > {
    const supabase = await this.getSupabase();

    const { data, error } = await supabase
      .from("slack_channel_mappings")
      .select(
        `
        *,
        slack_integrations!inner(*)
      `
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("is_active", true);

    if (error) {
      throw new Error(`Failed to get channel mappings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Send notification to Slack channels
   */
  async sendNotification(
    entityType: string,
    entityId: string,
    message: string,
    blocks?: any[]
  ): Promise<boolean> {
    try {
      const mappings = await this.getChannelMappings(entityType, entityId);

      if (mappings.length === 0) {
        return false;
      }

      const results = await Promise.allSettled(
        mappings.map(async (mapping) => {
          const integration = mapping.slack_integrations as SlackIntegration;

          const slackMessage: SlackMessage = {
            channel: mapping.channel_id,
            text: message,
            ...(blocks && { blocks }),
          };

          return this.sendMessage(integration.access_token, slackMessage);
        })
      );

      // Return true if at least one message was sent successfully
      return results.some(
        (result) => result.status === "fulfilled" && result.value === true
      );
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
      return false;
    }
  }

  /**
   * Delete Slack integration
   */
  async deleteIntegration(workspaceId: string): Promise<void> {
    const supabase = await this.getSupabase();

    const { error } = await supabase
      .from("slack_integrations")
      .update({ is_active: false })
      .eq("workspace_id", workspaceId);

    if (error) {
      throw new Error(`Failed to delete Slack integration: ${error.message}`);
    }
  }

  /**
   * Test Slack connection
   */
  async testConnection(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch("https://slack.com/api/auth.test", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      console.error("Slack connection test failed:", error);
      return false;
    }
  }
}
