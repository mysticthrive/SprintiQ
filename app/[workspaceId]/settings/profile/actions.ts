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

  const username = formData.get("username") as string;
  const fullName = formData.get("fullName") as string;
  const company = formData.get("company") as string;
  const avatarFile = formData.get("avatar") as File;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const removeAvatar = formData.get("removeAvatar") === "true";

  // New fields for language, timezone, and date/time format
  const language = formData.get("language") as string;
  const timezone = formData.get("timezone") as string;
  const notifyTimezoneChanges = formData.get("notifyTimezoneChanges") === "on"; // Checkbox value
  const startOfWeek = formData.get("startOfWeek") as string;
  const timeFormat = formData.get("timeFormat") as string;
  const dateFormat = formData.get("dateFormat") as string;

  let avatarUrl: string | null =
    (formData.get("currentAvatarUrl") as string) || null;

  // Handle avatar removal
  if (removeAvatar) {
    avatarUrl = null;
  }
  // Handle avatar upload if a new file is provided
  else if (avatarFile && avatarFile.size > 0) {
    const fileExtension = avatarFile.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `avatars/${user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);

      // Provide helpful error message for missing bucket
      if (uploadError.message?.includes("Bucket not found")) {
        return {
          success: false,
          message:
            "Storage bucket not configured. Please contact your administrator to set up the 'avatars' storage bucket in Supabase.",
        };
      }

      return {
        success: false,
        message: `Error uploading avatar: ${uploadError.message}`,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    avatarUrl = publicUrlData.publicUrl;
  }

  // Update user profile data
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: fullName,
      company,
      avatar_url: avatarUrl,
      language,
      timezone,
      notify_timezone_changes: notifyTimezoneChanges,
      start_of_week: startOfWeek,
      time_format: timeFormat,
      date_format: dateFormat,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Error updating profile:", profileError);
    return {
      success: false,
      message: `Error updating profile: ${profileError.message}`,
    };
  }

  // Handle password update if newPassword is provided
  if (newPassword) {
    if (newPassword.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters long.",
      };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, message: "Passwords do not match." };
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      console.error("Error updating password:", passwordError);
      return {
        success: false,
        message: `Error updating password: ${passwordError.message}`,
      };
    }
  }

  revalidatePath(`/${user.id}/settings/profile`, "page");
  return {
    success: true,
    message: "Profile and/or password updated successfully!",
  };
}
