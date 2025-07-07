import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InboxView from "@/components/workspace/views/inbox-view";

interface InboxPageProps {
  params: {
    workspaceId: string;
  };
}

export default async function InboxPage({ params }: InboxPageProps) {
  const { workspaceId } = await params;
  const supabase = await createServerSupabaseClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/signin");
  }

  // Get the workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    redirect("/dashboard");
  }

  // Check if user is a member of this workspace
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership) {
    redirect("/dashboard");
  }

  return <InboxView workspace={workspace} />;
}
