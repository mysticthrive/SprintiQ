import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProjectView from "@/components/workspace/views/project-view";
import type { Task } from "@/lib/database.types";

interface ProjectPageProps {
  params: {
    workspaceId: string;
    spaceId: string;
    projectId: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = await createServerSupabaseClient();
  const resolvedParams = await params;

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/signin");
  }

  // Get workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("workspace_id", resolvedParams.workspaceId)
    .single();

  if (workspaceError || !workspace) {
    notFound();
  }

  // Check if user is a member of the workspace
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

  // Get space
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("*")
    .eq("space_id", resolvedParams.spaceId)
    .eq("workspace_id", workspace.id)
    .single();

  if (spaceError || !space) {
    notFound();
  }

  // Get project with fresh data
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("project_id", resolvedParams.projectId)
    .eq("space_id", space.id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Get all relevant statuses for this project:
  const { data: statuses, error: statusesError } = await supabase
    .from("statuses")
    .select(
      `
      *,
      status_type:status_types!statuses_status_type_id_fkey(*)
    `
    )
    .eq("workspace_id", workspace.id)
    .or(
      `and(type.eq.space,space_id.eq.${space.id}),and(type.eq.project,project_id.eq.${project.id})`
    )
    .order("position", { ascending: true });

  if (statusesError || !statuses) {
    notFound();
  }

  // Get tasks for this project with proper joins
  const { data: tasks, error: tasksError } = await supabase
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
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (tasksError || !tasks) {
    notFound();
  }

  // Cast tasksData to the extended Task type
  const tasksData: Task[] = tasks as Task[];

  // Get tags for this workspace
  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("name", { ascending: true });

  if (tagsError || !tags) {
    notFound();
  }

  return (
    <ProjectView
      key={`${resolvedParams.workspaceId}-${resolvedParams.spaceId}-${resolvedParams.projectId}`}
      workspace={workspace}
      space={space}
      project={project}
      tasks={tasksData}
      statuses={statuses}
      tags={tags}
    />
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
