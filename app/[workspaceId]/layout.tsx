import type React from "react";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import WorkspaceSidebar from "@/components/workspace/layout/sidebar";
import WorkspaceHeader from "@/components/workspace/layout/header";
import SecondarySidebar from "@/components/workspace/layout/secondary-sidebar";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: { workspaceId: string };
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const supabase = await createServerSupabaseClient();
  const resolvedParams = await params;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get workspace data using short workspace_id
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("workspace_id", resolvedParams.workspaceId)
    .single();

  if (error || !workspace) {
    notFound();
  }

  // Get user profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get spaces with their projects and sprint folders
  const { data: spacesData, error: spacesError } = await supabase
    .from("spaces")
    .select(
      `
    *,
    projects (*),
    sprint_folders (
      *,
      sprints (*)
    )
  `
    )
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  const spaces = spacesData || [];

  return (
    <div className="h-screen flex workspace-bg p-2 gap-2">
      <WorkspaceSidebar workspace={workspace} profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden gap-2">
        <WorkspaceHeader workspace={workspace} user={user} />
        <div className="flex-1 flex overflow-hidden rounded-xl">
          <SecondarySidebar workspace={workspace} spaces={spaces} />
          <main className="flex-1 overflow-auto workspace-header-bg">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
