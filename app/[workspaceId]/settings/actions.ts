"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid"; // For generating unique file names

export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "User not authenticated." };
  }

  try {
    // Get all form data
    const username = formData.get("username") as string;
    const fullName = formData.get("fullName") as string;
    const company = formData.get("company") as string;
    const avatarFile = formData.get("avatar") as File;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Profile settings
    const language = formData.get("language") as string;
    const timezone = formData.get("timezone") as string;
    const notifyTimezoneChanges =
      formData.get("notifyTimezoneChanges") === "on";
    const startOfWeek = formData.get("startOfWeek") as string;
    const timeFormat = formData.get("timeFormat") as string;
    const dateFormat = formData.get("dateFormat") as string;

    // Notification settings
    const inboxNotifications = formData.get("inboxNotifications") as string;
    const emailNotifications = formData.get("emailNotifications") as string;
    // Browser notifications are now handled by browser permission, not stored in DB
    const mobileNotifications = formData.get("mobileNotifications") as string;
    const autoWatchTasks = formData.get("autoWatchTasks") === "on";
    const autoWatchCreateTask = formData.get("autoWatchCreateTask") === "on";
    const autoWatchNewSubtask = formData.get("autoWatchNewSubtask") === "on";
    const autoWatchEditTask = formData.get("autoWatchEditTask") === "on";
    const autoWatchCommentTask = formData.get("autoWatchCommentTask") === "on";
    const smartNotificationsEnabled =
      formData.get("smartNotificationsEnabled") === "on";
    const smartNotificationsDelay = formData.get(
      "smartNotificationsDelay"
    ) as string;

    // Update profile in database
    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        full_name: fullName,
        company,
        language,
        timezone,
        notify_timezone_changes: notifyTimezoneChanges,
        start_of_week: startOfWeek,
        time_format: timeFormat,
        date_format: dateFormat,
        inbox_notifications: inboxNotifications,
        email_notifications: emailNotifications,
        // browser_notifications_enabled removed - now handled by browser permission
        mobile_notifications: mobileNotifications,
        auto_watch_tasks: autoWatchTasks,
        auto_watch_create_task: autoWatchCreateTask,
        auto_watch_new_subtask: autoWatchNewSubtask,
        auto_watch_edit_task: autoWatchEditTask,
        auto_watch_comment_task: autoWatchCommentTask,
        smart_notifications_enabled: smartNotificationsEnabled,
        smart_notifications_delay: smartNotificationsDelay,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      return { success: false, message: "Failed to update profile settings." };
    }

    // Handle password update if provided
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        return { success: false, message: "Passwords do not match." };
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) {
        console.error("Error updating password:", passwordError);
        return { success: false, message: "Failed to update password." };
      }
    }

    // Handle avatar upload if provided
    if (avatarFile && avatarFile.size > 0) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile);

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        return { success: false, message: "Failed to upload avatar." };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: avatarError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (avatarError) {
        console.error("Error updating avatar URL:", avatarError);
        return { success: false, message: "Failed to update avatar URL." };
      }
    }

    revalidatePath("/[workspaceId]/settings");
    return { success: true, message: "Profile settings updated successfully." };
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
