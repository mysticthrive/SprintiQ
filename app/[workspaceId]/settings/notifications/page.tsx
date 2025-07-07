import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import type { Profile } from "@/lib/database.types";

export default async function NotificationSettingsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      profile = data;
    }
  }

  return (
    <div className="flex-1 container mx-auto p-6 space-y-6">
      <NotificationSettingsForm profile={profile} />
    </div>
  );
}
