import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import TaskDetailView from "@/components/workspace/views/task-detail-view/index";

interface TaskPageProps {
  params: {
    workspaceId: string;
    taskId: string;
  };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const supabase = await createServerSupabaseClient();
  const resolvedParams = await params;

  // Validate params
  if (!resolvedParams.taskId || !resolvedParams.workspaceId) {
    console.error("Invalid params:", resolvedParams);
    notFound();
  }

  try {
    // Get the task by task_id
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select(
        `
        *,
        assignee:profiles!tasks_assignee_id_fkey(*),
        status:statuses(*),
        task_tags(
          tag:tags(*)
        )
      `
      )
      .eq("task_id", resolvedParams.taskId)
      .single();

    if (taskError) {
      console.error("Task query error:", taskError);
      notFound();
    }

    if (!task) {
      console.error(
        "Task not found in database for task_id:",
        resolvedParams.taskId
      );
      notFound();
    }

    // Get workspace by workspace_id
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("workspace_id", resolvedParams.workspaceId)
      .single();

    if (workspaceError || !workspace) {
      console.error("Workspace not found:", workspaceError);
      notFound();
    }

    // Get space
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", task.space_id)
      .single();

    if (spaceError || !space) {
      console.error("Space not found:", spaceError);
      notFound();
    }

    // Get project (optional - task might belong to a sprint instead)
    let project = null;
    if (task.project_id) {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", task.project_id)
        .single();

      if (!projectError && projectData) {
        project = projectData;
      }
    }

    // Get sprint if task belongs to one
    let sprint = null;
    if (task.sprint_id) {
      const { data: sprintData, error: sprintError } = await supabase
        .from("sprints")
        .select("*")
        .eq("id", task.sprint_id)
        .single();

      if (!sprintError && sprintData) {
        sprint = sprintData;
      }
    }

    // Get statuses for this workspace, including sprint-specific statuses if applicable
    let statusesQuery = supabase
      .from("statuses")
      .select("*")
      .eq("workspace_id", workspace.id);

    if (sprint) {
      // If task belongs to a sprint, include both space and sprint statuses
      statusesQuery = statusesQuery.or(
        `and(type.eq.space,space_id.eq.${space.id}),and(type.eq.sprint,sprint_id.eq.${sprint.id})`
      );
    } else if (project) {
      // If task belongs to a project, include both space and project statuses
      statusesQuery = statusesQuery.or(
        `and(type.eq.space,space_id.eq.${space.id}),and(type.eq.project,project_id.eq.${project.id})`
      );
    } else {
      // If task doesn't belong to a project or sprint, only include space statuses
      statusesQuery = statusesQuery.eq("space_id", space.id);
    }

    const { data: statuses, error: statusesError } = await statusesQuery.order(
      "position",
      { ascending: true }
    );

    if (statusesError) {
      console.error("Error fetching statuses:", statusesError);
      notFound();
    }

    // Get tags for this workspace
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("name", { ascending: true });

    if (tagsError) {
      console.error("Error fetching tags:", tagsError);
      notFound();
    }

    return (
      <TaskDetailView
        task={task}
        workspace={workspace}
        space={space}
        project={project}
        sprint={sprint}
        statuses={statuses || []}
        tags={tags || []}
      />
    );
  } catch (error) {
    console.error("Error loading task page:", error);
    notFound();
  }
}
