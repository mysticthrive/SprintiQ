import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import SprintView from "@/components/workspace/views/sprint-view";

interface SprintPageProps {
  params: {
    workspaceId: string;
    spaceId: string;
    sprintFolderId: string;
    sprintId: string;
  };
}

export default async function SprintPage({ params }: SprintPageProps) {
  const supabase = await createServerSupabaseClient();
  const resolvedParams = await params;

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/signin");
  }

  // Fetch the workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("workspace_id", resolvedParams.workspaceId)
    .single();

  if (!workspace) {
    notFound();
  }

  // Check if user is a member of the workspace (use workspace.id, not workspace_id)
  const { data: workspaceMember } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!workspaceMember) {
    redirect("/auth/signin");
  }

  // Fetch the space
  const { data: space } = await supabase
    .from("spaces")
    .select("*")
    .eq("space_id", resolvedParams.spaceId)
    .eq("workspace_id", workspace.id)
    .single();

  if (!space) {
    notFound();
  }

  // Fetch the sprint folder
  const { data: sprintFolder } = await supabase
    .from("sprint_folders")
    .select("*")
    .eq("sprint_folder_id", resolvedParams.sprintFolderId)
    .eq("space_id", space.id)
    .single();

  if (!sprintFolder) {
    notFound();
  }

  // Fetch the sprint
  const { data: sprint } = await supabase
    .from("sprints")
    .select("*")
    .eq("sprint_id", resolvedParams.sprintId)
    .eq("sprint_folder_id", sprintFolder.id)
    .eq("space_id", space.id)
    .single();

  if (!sprint) {
    notFound();
  }

  // Fetch tasks for this sprint
  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      `
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
      created_by_profile:profiles!tasks_created_by_fkey(id, full_name, avatar_url),
      status:statuses(*),
      task_tags(tag:tags(*))
    `
    )
    .eq("sprint_id", sprint.id)
    .order("created_at", { ascending: false });

  // Fetch statuses for this sprint
  const { data: statuses } = await supabase
    .from("statuses")
    .select("*")
    .eq("workspace_id", workspace.id)
    .or(
      `and(type.eq.space,space_id.eq.${space.id}),and(type.eq.sprint,sprint_id.eq.${sprint.id})`
    )
    .order("position", { ascending: true });

  // Fetch tags for this workspace
  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("name", { ascending: true });

  // Fetch all spaces for the workspace (needed for sidebar)
  const { data: spaces } = await supabase
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

  if (!spaces) {
    notFound();
  }

  return (
    <SprintView
      workspace={workspace}
      space={space}
      sprintFolder={sprintFolder}
      sprint={sprint}
      tasks={tasks || []}
      statuses={statuses || []}
      tags={tags || []}
    />
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
