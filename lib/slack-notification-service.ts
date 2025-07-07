import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SlackService } from "./slack-service";

export interface SlackNotificationData {
  workspaceId: string;
  entityType: "task" | "subtask" | "project" | "sprint" | "space" | "workspace";
  entityId: string;
  entityName: string;
  eventType: "created" | "updated" | "deleted" | "commented";
  storyPoints: number;
  businessValue: number;
  estimatedTime: number;
  description: string;
  metadata?: Record<string, any>;
  userId: string;
}

export class SlackNotificationService {
  private slackService: SlackService;

  constructor() {
    this.slackService = new SlackService();
  }

  async sendNotification(data: SlackNotificationData): Promise<void> {
    try {
      console.log("SlackNotificationService: Starting notification for:", {
        workspaceId: data.workspaceId,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        eventType: data.eventType,
      });

      const supabase = await createServerSupabaseClient();

      // Get workspace by workspace_id (short ID)
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", data.workspaceId)
        .single();

      if (workspaceError || !workspace) {
        console.error("Failed to get workspace:", workspaceError);
        return;
      }

      console.log("SlackNotificationService: Found workspace:", workspace.id);

      // Get Slack integration for this workspace
      const { data: slackIntegration, error: integrationError } = await supabase
        .from("slack_integrations")
        .select("id")
        .eq("workspace_id", workspace.id)
        .eq("is_active", true)
        .single();

      if (integrationError || !slackIntegration) {
        console.error("Failed to get Slack integration:", integrationError);
        return;
      }

      console.log(
        "SlackNotificationService: Found Slack integration:",
        slackIntegration.id
      );

      // Get channel mappings for this workspace and entity
      const { data: mappings, error: mappingError } = await supabase
        .from("slack_channel_mappings")
        .select("*")
        .eq("slack_integration_id", slackIntegration.id)
        .eq("entity_type", data.entityType)
        .eq(
          "entity_id",
          data.entityType === "workspace" ? workspace.id : data.entityId
        )
        .eq("is_active", true);

      if (mappingError) {
        console.error("Error fetching channel mappings:", mappingError);
        return;
      }

      console.log(
        "SlackNotificationService: Found entity-specific mappings:",
        mappings?.length || 0
      );

      if (!mappings || mappings.length === 0) {
        // No mappings found, try workspace-level mapping
        const { data: workspaceMappings, error: workspaceMappingError } =
          await supabase
            .from("slack_channel_mappings")
            .select("*")
            .eq("slack_integration_id", slackIntegration.id)
            .eq("entity_type", "workspace")
            .eq("entity_id", workspace.id)
            .eq("is_active", true);

        if (workspaceMappingError) {
          console.error(
            "Error fetching workspace channel mappings:",
            workspaceMappingError
          );
          return;
        }

        console.log(
          "SlackNotificationService: Found workspace mappings:",
          workspaceMappings?.length || 0
        );

        if (!workspaceMappings || workspaceMappings.length === 0) {
          // No mappings at all, skip notification
          console.log(
            "SlackNotificationService: No mappings found, skipping notification"
          );
          return;
        }

        // Send to workspace-level channels
        for (const mapping of workspaceMappings) {
          await this.sendToChannel(mapping, data);
        }
      } else {
        // Send to entity-specific channels
        for (const mapping of mappings) {
          await this.sendToChannel(mapping, data);
        }
      }
    } catch (error) {
      console.error("Error sending Slack notification:", error);
    }
  }

  private async sendToChannel(
    mapping: any,
    data: SlackNotificationData
  ): Promise<void> {
    try {
      console.log(
        "SlackNotificationService: Sending to channel:",
        mapping.channel_name
      );
      const messageBlocks = this.formatMessage(data);

      // Get the Slack integration to get the access token
      const supabase = await createServerSupabaseClient();

      // First get the workspace UUID from the short ID
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", data.workspaceId)
        .single();

      if (workspaceError || !workspace) {
        console.error("Failed to get workspace:", workspaceError);
        return;
      }

      const { data: integration, error: integrationError } = await supabase
        .from("slack_integrations")
        .select("access_token")
        .eq("workspace_id", workspace.id)
        .eq("is_active", true)
        .single();

      if (integrationError || !integration) {
        console.error("Failed to get Slack integration:", integrationError);
        return;
      }

      const slackMessage = {
        channel: mapping.channel_id,
        ...messageBlocks, // This includes the blocks array
        text: `${this.getEventEmoji(data.eventType)} ${this.getEventText(
          data.eventType
        )}: ${data.entityName}`, // Fallback text
      };

      await this.slackService.sendMessage(
        integration.access_token,
        slackMessage
      );

      console.log(
        `Slack notification sent to channel #${mapping.channel_name}`
      );
    } catch (error) {
      console.error(
        `Failed to send notification to channel #${mapping.channel_name}:`,
        error
      );
    }
  }

  private formatMessage(data: SlackNotificationData): any {
    const eventEmoji = this.getEventEmoji(data.eventType);
    const eventText = this.getEventText(data.eventType);
    const entityEmoji = this.getEntityEmoji(data.entityType);

    // Build the blocks array for Slack Block Kit
    const blocks: any[] = [];

    // Header section with event and entity name
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${eventEmoji} ${eventText}*\n*<app.sprintiq.ai|${entityEmoji} ${data.entityName}>*`,
      },
    });

    // Context section for space, project, sprint, and assignee
    const contextElements: any[] = [];

    if (data.metadata?.spaceName) {
      contextElements.push({
        type: "mrkdwn",
        text: `*🌐 Space:* ${data.metadata.spaceName}`,
      });
    }

    if (data.metadata?.projectName) {
      contextElements.push({
        type: "mrkdwn",
        text: `*#️⃣ Project:* ${data.metadata.projectName}`,
      });
    }

    if (data.metadata?.sprintName) {
      contextElements.push({
        type: "mrkdwn",
        text: `*🏃 Sprint:* ${data.metadata.sprintName}`,
      });
    }

    if (data.metadata?.assigneeName) {
      contextElements.push({
        type: "mrkdwn",
        text: `*👥 Assigned:* ${data.metadata.assigneeName}`,
      });
    } else {
      contextElements.push({
        type: "mrkdwn",
        text: "*👥 Assigned:* Unassigned",
      });
    }

    if (contextElements.length > 0) {
      blocks.push({
        type: "context",
        elements: contextElements,
      });
    }

    // Divider
    blocks.push({
      type: "divider",
    });

    // Fields section for priority, story points, business value, and estimated time
    const fields: any[] = [];

    if (data.metadata?.priority) {
      const priorityEmoji = this.getPriorityEmoji(data.metadata.priority);
      fields.push({
        type: "mrkdwn",
        text: `*${priorityEmoji} Priority:* ${
          data.metadata.priority.charAt(0).toUpperCase() +
          data.metadata.priority.slice(1)
        }`,
      });
    }

    if (data.metadata?.storyPoints) {
      fields.push({
        type: "mrkdwn",
        text: `*🎯 Story Point:* ${data.metadata.storyPoints} (pts)`,
      });
    }

    if (data.metadata?.businessValue) {
      fields.push({
        type: "mrkdwn",
        text: `*💼 Business Value:* ${data.metadata.businessValue} / 5`,
      });
    }

    if (data.metadata?.estimatedTime) {
      fields.push({
        type: "mrkdwn",
        text: `*🕒 Estimated Time:* ${data.metadata.estimatedTime} (h)`,
      });
    }

    if (fields.length > 0) {
      blocks.push({
        type: "section",
        fields: fields,
      });
    }

    // Description section (if available)
    if (data.metadata?.description) {
      const description = data.metadata.description;
      const truncatedDescription =
        description.length > 300
          ? description.substring(0, 300) + "..."
          : description;

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📝 Description*\n${truncatedDescription}`,
        },
      });
    }

    // Status section (for updates)
    if (data.metadata?.statusName) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📊 Status*\n• ${data.metadata.statusName}`,
        },
      });
    }

    // Comment section (for comment events)
    if (data.metadata?.comment) {
      const comment = data.metadata.comment;
      const truncatedComment =
        comment.length > 200 ? comment.substring(0, 200) + "..." : comment;

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*💬 Comment*\n${truncatedComment}`,
        },
      });
    }

    // Change details section (for updates)
    if (
      data.metadata?.changeType &&
      data.metadata?.oldValue &&
      data.metadata?.newValue
    ) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🔄 Change*\n• ${data.metadata.changeType}: \`${data.metadata.oldValue}\` → \`${data.metadata.newValue}\``,
        },
      });
    }

    // Footer with user info and timestamp
    if (data.metadata?.userName) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*By ${
              data.metadata.userName
            } • ${new Date().toLocaleString()}*`,
          },
        ],
      });
    }

    return { blocks };
  }

  private getEventText(eventType: string): string {
    switch (eventType) {
      case "created":
        return "New Task Created";
      case "updated":
        return "Task Updated";
      case "deleted":
        return "Task Deleted";
      case "commented":
        return "New Comment";
      default:
        return "Task Event";
    }
  }

  private getEventEmoji(eventType: string): string {
    switch (eventType) {
      case "created":
        return "🆕";
      case "updated":
        return "✏️";
      case "deleted":
        return "🗑️";
      case "commented":
        return "💬";
      default:
        return "📢";
    }
  }

  private getEntityEmoji(entityType: string): string {
    switch (entityType) {
      case "task":
        return "📋";
      case "subtask":
        return "📝";
      case "project":
        return "📁";
      case "sprint":
        return "🏃";
      case "space":
        return "📂";
      default:
        return "📄";
    }
  }

  private getPriorityEmoji(priority: string): string {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "🔴";
      case "high":
        return "🟡";
      case "medium":
        return "🔵";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  }
}
