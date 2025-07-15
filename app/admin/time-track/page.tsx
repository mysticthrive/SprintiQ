import { createServerSupabaseClient } from "@/lib/supabase/server";
import TimeTrackTable from "@/components/admin/time-track";
import AdminLayout from "@/components/admin/layout";

export default async function TimeTrackAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: sessions, error } = await supabase
    .from("time_tracking_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch user profiles for all unique user_ids
  const userIds = Array.from(
    new Set((sessions || []).map((s) => s.user_id))
  ).filter(Boolean);
  let userMap: Record<
    string,
    { full_name: string | null; avatar_url: string | null }
  > = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);
    if (profiles) {
      userMap = Object.fromEntries(
        profiles.map((p) => [
          p.id,
          { full_name: p.full_name, avatar_url: p.avatar_url },
        ])
      );
    }
  }

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error loading time tracks: {error.message}
      </div>
    );
  }

  return (
    <AdminLayout>
      <TimeTrackTable sessions={sessions || []} userMap={userMap} />
    </AdminLayout>
  );
}
