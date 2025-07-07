import { Resend } from "resend";
import { createServerSupabaseClient } from "./supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailNotificationData {
  userId: string;
  eventType: "created" | "updated" | "deleted" | "reordered";
  entityType: "workspace" | "space" | "project" | "task" | "subtask" | "status";
  entityName: string;
  description: string;
  workspaceName?: string;
  workspaceId?: string;
}

export async function sendEmailNotification(
  data: EmailNotificationData
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  try {
    // Get user's email and profile info
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", data.userId)
      .single();

    if (error || !profile?.email) {
      console.error("Failed to get user email:", error);
      return false;
    }

    // Get workspace name if workspaceId is provided
    let workspaceName = data.workspaceName || "your workspace";
    if (data.workspaceId && !data.workspaceName) {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("name")
        .eq("id", data.workspaceId)
        .single();

      if (workspace?.name) {
        workspaceName = workspace.name;
      }
    }

    const actionText =
      data.eventType === "created"
        ? "created"
        : data.eventType === "updated"
        ? "updated"
        : data.eventType === "deleted"
        ? "deleted"
        : "reordered";

    const entityText =
      data.entityType === "subtask" ? "subtask" : data.entityType;
    const subject = `${
      entityText.charAt(0).toUpperCase() + entityText.slice(1)
    } ${actionText} in ${workspaceName}`;

    const emailHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${subject}</title>
  </head>
  <body
    style="
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      color: #374151;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    "
  >
    <div
      style="
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      "
    >
      <!-- Logo Section -->
      <div style="text-align: center; margin-bottom: 32px">
        <img
          src="https://vttwakzntflxuylenszu.supabase.co/storage/v1/object/public/images/SprintiQ/logo1.png"
          alt="SprintiQ Logo"
          style="height: 60px; width: auto"
        />
      </div>

      <h2
        style="
          color: #111827;
          margin-bottom: 24px;
          font-size: 24px;
          font-weight: 600;
        "
      >
        ${
          entityText.charAt(0).toUpperCase() + entityText.slice(1)
        } ${actionText}
      </h2>

      <div
        style="
          margin: 24px 0;
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 6px;
          border-left: 4px solid #10b981;
        "
      >
        <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827">
          ${data.entityName}
        </p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280">
          ${data.description}
        </p>
      </div>

      <p style="margin-bottom: 24px; font-size: 16px">
        This ${entityText} has been ${actionText} in <strong>${workspaceName}</strong>.
      </p>

      <div style="margin: 32px 0; text-align: center">
        <a
          href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #10b981;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 16px;
            transition: background-color 0.2s;
          "
        >
          View in SprintiQ
        </a>
      </div>

      <div
        style="
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        "
      >
        <p style="color: #6b7280; font-size: 14px; margin: 0">
          You're receiving this email because you have email notifications enabled for ${workspaceName}.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0">
          You can manage your notification preferences in your SprintiQ settings.
        </p>
      </div>
    </div>
  </body>
</html>`;

    await resend.emails.send({
      from: "SprintiQ <support@sprintiq.ai>",
      to: profile.email,
      subject: subject,
      html: emailHtml,
    });

    console.log(`Email notification sent successfully to ${profile.email}`);
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
}

export async function sendTestEmailNotification(
  userId: string
): Promise<boolean> {
  const testData: EmailNotificationData = {
    userId,
    eventType: "created",
    entityType: "task",
    entityName: "Test Task",
    description:
      "This is a test email notification to verify your email settings are working correctly.",
    workspaceName: "Test Workspace",
  };

  return await sendEmailNotification(testData);
}
