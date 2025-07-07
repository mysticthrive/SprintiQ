"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmailNotification } from "@/lib/email-service-server";

export type EventType = "created" | "updated" | "deleted" | "reordered";
export type EntityType =
  | "workspace"
  | "space"
  | "project"
  | "task"
  | "subtask"
  | "status";

interface CreateEventParams {
  type: EventType;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  userId: string;
  workspaceId: string;
  spaceId?: string;
  projectId?: string;
  parentTaskId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export async function createEventServer(params: CreateEventParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Get user's notification settings
    let profile = null;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "inbox_notifications, email_notifications, browser_notifications_enabled"
        )
        .eq("id", params.userId)
        .single();

      if (!profileError && profileData) {
        profile = profileData;
      }
    } catch (profileError) {
      console.warn(
        "Could not fetch user profile for notifications:",
        profileError
      );
    }

    // Check if we should create the event based on notification settings
    let shouldCreate = true;
    if (profile) {
      // Check inbox notifications
      if (profile.inbox_notifications === "None") {
        shouldCreate = false;
      }

      // For Default setting, only create events for important actions
      if (profile.inbox_notifications === "Default") {
        const importantEvents = [
          { type: "created", entityType: "task" },
          { type: "created", entityType: "subtask" },
          { type: "updated", entityType: "task" },
          { type: "deleted", entityType: "task" },
          { type: "deleted", entityType: "subtask" },
        ];

        const isImportantEvent = importantEvents.some(
          (event) =>
            event.type === params.type && event.entityType === params.entityType
        );

        if (!isImportantEvent) {
          shouldCreate = false;
        }
      }
    }

    if (!shouldCreate) {
      return { success: true };
    }

    // Generate event_id
    const eventId = `evt_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create the event
    const eventData = {
      event_id: eventId,
      type: params.type,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_name: params.entityName,
      user_id: params.userId,
      workspace_id: params.workspaceId,
      space_id: params.spaceId || null,
      project_id: params.projectId || null,
      parent_task_id: params.parentTaskId || null,
      description: params.description,
      metadata: params.metadata || {},
      is_read: false,
    };

    const { error } = await supabase.from("events").insert(eventData);

    if (error) {
      console.error("Failed to create event:", error);
      return { success: false, error: error.message };
    }

    // Send email notification if enabled
    if (
      profile?.email_notifications === "All" ||
      (profile?.email_notifications === "Default" &&
        ["task", "subtask"].includes(params.entityType) &&
        ["created", "updated", "deleted"].includes(params.type))
    ) {
      try {
        await sendEmailNotification({
          userId: params.userId,
          eventType: params.type,
          entityType: params.entityType,
          entityName: params.entityName,
          description: params.description,
          workspaceId: params.workspaceId,
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the entire operation if email fails
      }
    }

    // Revalidate relevant paths
    revalidatePath(`/${params.workspaceId}`);
    if (params.spaceId) {
      revalidatePath(`/${params.workspaceId}/space/${params.spaceId}`);
    }
    if (params.projectId) {
      revalidatePath(
        `/${params.workspaceId}/space/${params.spaceId}/project/${params.projectId}`
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error creating event:", error);
    return { success: false, error: error.message };
  }
}
