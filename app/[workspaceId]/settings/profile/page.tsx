import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/database.types";

import { SettingsProfileView } from "@/components/settings/profile";

export default async function ProfileSettingsPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const supabase = await createServerSupabaseClient();
  const workspaceId = params.workspaceId;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin"); // Redirect to sign-in if not authenticated
  }

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

  return <SettingsProfileView profile={profile} email={user.email} />;
}
