import { createClientSupabaseClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

export type EventType = "created" | "updated" | "deleted" | "reordered";

// New detailed activity types for task activities (these won't show in Inbox)
export type ActivityType =
  | "assignee_changed"
  | "start_date_changed"
  | "due_date_changed"
  | "priority_changed"
  | "status_changed"
  | "tag_added"
  | "tag_removed"
  | "time_estimate_changed"
  | "description_changed"
  | "subtask_created"
  | "comment_added";

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

// New interface for task activity events
interface CreateActivityParams {
  type: ActivityType;
  taskId: string;
  taskName: string;
  userId: string;
  workspaceId: string;
  spaceId?: string;
  projectId?: string;
  description: string;
  metadata?: Record<string, any>;
}

// Function to show browser notification
function showBrowserNotification(title: string, body: string) {
  // Check if browser notifications are supported
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  // Check if permission is already granted
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico", // Add your app's icon here
    });
  } else if (Notification.permission !== "denied") {
    // Request permission
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, {
          body,
          icon: "/favicon.ico", // Add your app's icon here
        });
      }
    });
  }
}

// Export function to send browser notifications from anywhere in the app
export function sendBrowserNotification(title: string, body: string) {
  console.log("sendBrowserNotification called with:", { title, body });

  if (typeof window === "undefined") {
    console.log("Server-side, not sending notification");
    return; // Server-side, don't send notifications
  }

  // Check if browser notifications are supported
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  console.log("Notification permission:", Notification.permission);

  // Only send if permission is granted
  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
      console.log("Browser notification sent successfully:", notification);
    } catch (error) {
      console.error("Failed to send browser notification:", error);
    }
  } else {
    console.log(
      "Notification permission not granted:",
      Notification.permission
    );
  }
}

// Export function to check if browser notifications are enabled
export function isBrowserNotificationsEnabled(): boolean {
  if (typeof window === "undefined") {
    return false; // Server-side, return false
  }

  return "Notification" in window && Notification.permission === "granted";
}

// Function to send email notification (client-side)
async function sendEmailNotification(
  userId: string,
  eventType: EventType,
  entityType: EntityType,
  entityName: string,
  description: string,
  workspaceId?: string
) {
  try {
    // Call the API endpoint to send email notification
    const response = await fetch("/api/send-email-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        eventType,
        entityType,
        entityName,
        description,
        workspaceId,
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
}

// Function to check if an event should be created based on notification settings
async function shouldCreateEvent(
  userId: string,
  workspaceId: string,
  eventType: EventType,
  entityType: EntityType
): Promise<boolean> {
  const supabase = createClientSupabaseClient();

  try {
    // Get user's notification settings
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "inbox_notifications, email_notifications, browser_notifications_enabled"
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to get user profile:", error);
      return true; // Default to creating event if we can't get settings
    }

    // Check inbox notifications
    if (profile.inbox_notifications === "None") {
      return false;
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
        (event) => event.type === eventType && event.entityType === entityType
      );

      if (!isImportantEvent) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking notification settings:", error);
    return true; // Default to creating event if there's an error
  }
}

export async function createEvent(params: CreateEventParams) {
  const supabase = createClientSupabaseClient();

  try {
    // Check if we should create the event based on notification settings
    const shouldCreate = await shouldCreateEvent(
      params.userId,
      params.workspaceId,
      params.type,
      params.entityType
    );

    if (!shouldCreate) {
      return true; // Return true to indicate success, but don't create the event
    }

    // Get user's notification settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("browser_notifications_enabled, email_notifications")
      .eq("id", params.userId)
      .single();

    const { error } = await supabase.from("events").insert({
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
    });

    if (error) {
      console.error("Failed to create event:", error);
      return false;
    }

    // Show browser notification if browser permission is granted
    if (
      typeof window !== "undefined" &&
      Notification.permission === "granted"
    ) {
      const actionText =
        params.type === "created"
          ? "created"
          : params.type === "updated"
          ? "updated"
          : "deleted";
      const entityText =
        params.entityType === "subtask" ? "subtask" : params.entityType;
      const title = `${
        entityText.charAt(0).toUpperCase() + entityText.slice(1)
      } ${actionText}`;
      const body = `${params.entityName} has been ${actionText} successfully.`;
      showBrowserNotification(title, body);
    }

    // Send email notification if enabled
    if (
      profile?.email_notifications === "All" ||
      (profile?.email_notifications === "Default" &&
        ["task", "subtask"].includes(params.entityType) &&
        ["created", "updated", "deleted"].includes(params.type))
    ) {
      await sendEmailNotification(
        params.userId,
        params.type,
        params.entityType,
        params.entityName,
        params.description,
        params.workspaceId
      );
    }

    return true;
  } catch (error) {
    console.error("Error creating event:", error);
    return false;
  }
}

// New function for creating task activity events (won't appear in Inbox)
export async function createTaskActivity(params: CreateActivityParams) {
  const supabase = createClientSupabaseClient();

  try {
    const { error } = await supabase.from("events").insert({
      type: params.type as string, // Store activity type in the type field
      entity_type: "task",
      entity_id: params.taskId, // Use entity_id instead of parent_task_id
      entity_name: params.taskName,
      user_id: params.userId,
      workspace_id: params.workspaceId,
      space_id: params.spaceId || null,
      project_id: params.projectId || null,
      parent_task_id: null, // Not needed for activities
      description: params.description,
      metadata: {
        ...params.metadata,
        is_activity: true, // Keep this for additional filtering if needed
      },
      is_read: true, // Activities are always read since they don't need inbox notifications
    });

    if (error) {
      console.error("Failed to create task activity:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error creating task activity:", error);
    return false;
  }
}

// New function to get task activities only
export async function getTaskActivities(
  taskId: string,
  workspaceId: string,
  limit = 50
) {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        user:profiles(*)
      `
      )
      .eq("workspace_id", workspaceId)
      .eq("entity_id", taskId)
      .eq("entity_type", "task")
      .in("type", [
        "assignee_changed",
        "start_date_changed",
        "due_date_changed",
        "priority_changed",
        "status_changed",
        "tag_added",
        "tag_removed",
        "time_estimate_changed",
        "description_changed",
        "subtask_created",
        "comment_added",
        "comment",
        "created",
        "updated",
        "deleted",
        "reordered",
      ])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to get task activities:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting task activities:", error);
    return [];
  }
}

export function showNotification(
  type: EventType,
  entityType: EntityType,
  entityName: string
) {
  const actionText =
    type === "created" ? "created" : type === "updated" ? "updated" : "deleted";
  const entityText = entityType === "subtask" ? "subtask" : entityType;

  toast({
    title: `${
      entityText.charAt(0).toUpperCase() + entityText.slice(1)
    } ${actionText}`,
    description: `${entityName} has been ${actionText} successfully.`,
    duration: 3000,
  });
}

export async function getUnreadEventsCount(
  userId: string,
  workspaceId: string
): Promise<number> {
  const supabase = createClientSupabaseClient();

  try {
    // Check if user is authenticated
    if (!userId || !workspaceId) {
      console.warn("Missing userId or workspaceId for events count");
      return 0;
    }

    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Failed to get unread events count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error getting unread events count:", error);
    return 0;
  }
}

export async function markEventAsRead(eventId: string) {
  const supabase = createClientSupabaseClient();

  try {
    const { error } = await supabase
      .from("events")
      .update({
        is_read: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (error) {
      console.error("Failed to mark event as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking event as read:", error);
    return false;
  }
}

export async function markAllEventsAsRead(userId: string, workspaceId: string) {
  const supabase = createClientSupabaseClient();

  try {
    // Check if user is authenticated
    if (!userId || !workspaceId) {
      console.warn("Missing userId or workspaceId for marking events as read");
      return false;
    }

    const { error } = await supabase
      .from("events")
      .update({
        is_read: true,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Failed to mark all events as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking all events as read:", error);
    return false;
  }
}

export async function getRecentEvents(
  userId: string,
  workspaceId: string,
  limit = 50
) {
  const supabase = createClientSupabaseClient();

  try {
    // Check if user is authenticated
    if (!userId || !workspaceId) {
      console.warn("Missing userId or workspaceId for getting recent events");
      return [];
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to get recent events:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting recent events:", error);
    return [];
  }
}
