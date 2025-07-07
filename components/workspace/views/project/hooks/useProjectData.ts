import { useState, useEffect, useCallback } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { createEvent } from "@/lib/events";
import type {
  Workspace,
  Space,
  Project,
  Task,
  Status,
  StatusType,
  Tag,
  Profile,
} from "@/lib/database.types";
import type { ViewMode, ProjectViewState } from "../types";

interface UseProjectDataProps {
  workspace: Workspace;
  space: Space;
  project: Project;
  initialTasks: Task[];
  initialStatuses: Status[];
  initialTags: Tag[];
}

export const useProjectData = ({
  workspace,
  space,
  project,
  initialTasks,
  initialStatuses,
  initialTags,
}: UseProjectDataProps) => {
  const { user } = useAuth();
  const [supabase] = useState(() => {
    if (typeof window === "undefined") {
      throw new Error("ProjectView should only be used on the client side");
    }
    return createClientSupabaseClient();
  });

  const [state, setState] = useState<ProjectViewState>({
    view: "board" as ViewMode,
    activeViews: ["list", "board"] as ViewMode[],
    tasks: initialTasks,
    statuses: initialStatuses,
    tags: initialTags,
    statusTypes: [],
    activeTask: null,
    activeStatus: null,
    expandedTasks: new Set<string>(),
    collapsedStatuses: new Set<string>(),
    visibleColumns: new Set(["assignee", "dueDate", "priority", "subtasks"]),
    allSubtasks: [],
    workspaceMembers: [],
    isLoading: true,
    taskToDelete: null,
    createTaskModalOpen: false,
    createStatusModalOpen: false,
    customizeListModalOpen: false,
    subtaskParentId: undefined,
    statusSettingsModalOpen: false,
    statusToEdit: null,
    filters: {
      status: [],
      tags: [],
      priority: [],
      assigned: [],
      sprintPoints: { min: 0, max: 100 },
      showUnassignedOnly: false,
    },
    filterModalOpen: false,
  });

  const updateState = useCallback((updates: Partial<ProjectViewState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const loadAllSubtasks = useCallback(async () => {
    try {
      const { data: subtasksData, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, avatar_url),
          status:statuses(*),
          task_tags(
            tag:tags(*)
          )
        `
        )
        .eq("project_id", project.id)
        .not("parent_task_id", "is", null)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading subtasks:", error);
        return;
      }

      updateState({ allSubtasks: subtasksData || [] });
    } catch (error) {
      console.error("Error loading subtasks:", error);
    }
  }, [supabase, project.id, updateState]);

  const fetchWorkspaceMembers = useCallback(async () => {
    if (!workspace?.id) return;
    try {
      // First get the workspace member user IDs
      const { data: memberRecords, error: memberError } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspace.id)
        .eq("status", "active");

      if (memberError) {
        console.error("Error fetching workspace member IDs:", memberError);
        return;
      }

      if (!memberRecords || memberRecords.length === 0) {
        console.log("No workspace members found, setting empty array");
        updateState({ workspaceMembers: [] });
        return;
      }

      const userIds = memberRecords.map((m) => m.user_id);
      console.log("Fetching profiles for user IDs:", userIds);

      // Then get the profiles for those user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        console.error("Error details:", {
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint,
          code: profilesError.code,
        });
        return;
      }

      console.log(
        "Successfully fetched workspace members:",
        profilesData?.length || 0
      );
      updateState({ workspaceMembers: (profilesData || []) as Profile[] });
    } catch (error) {
      console.error("Error fetching workspace members:", error);
    }
  }, [workspace?.id, supabase, updateState]);

  const refreshTasks = useCallback(async () => {
    try {
      updateState({ isLoading: true });
      const { data: updatedTasks } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:profiles(*),
          status:statuses(*),
          task_tags(
            tag:tags(*)
          )
        `
        )
        .eq("project_id", project.id)
        .order("created_at", { ascending: true });

      if (updatedTasks) {
        updateState({ tasks: updatedTasks });
      }
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      updateState({ isLoading: false });
    }
  }, [supabase, project.id, updateState]);

  const refreshStatuses = useCallback(async () => {
    try {
      const { data: updatedStatuses } = await supabase
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

      if (updatedStatuses) {
        updateState({ statuses: updatedStatuses });
      }
    } catch (error) {
      console.error("Error refreshing statuses:", error);
    }
  }, [supabase, workspace.id, space.id, project.id, updateState]);

  const createEventLog = useCallback(
    async (eventData: any) => {
      if (user) {
        await createEvent({
          ...eventData,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          metadata: {
            ...eventData.metadata,
            projectName: project.name,
            spaceName: space.name,
          },
        });
      }
    },
    [user, workspace.id, space.id, project.id, project.name, space.name]
  );

  const fetchStatusTypes = useCallback(async () => {
    try {
      const { data: statusTypes } = await supabase
        .from("status_types")
        .select("*")
        .order("name", { ascending: true });

      if (statusTypes) {
        updateState({ statusTypes });
      }
    } catch (error) {
      console.error("Error fetching status types:", error);
    }
  }, [supabase, updateState]);

  // Initialize data
  useEffect(() => {
    updateState({
      isLoading: true,
      tasks: initialTasks,
      statuses: initialStatuses,
      tags: initialTags,
      expandedTasks: new Set(),
    });
    setTimeout(() => updateState({ isLoading: false }), 300);
  }, [project.id, initialTasks, initialStatuses, initialTags, updateState]);

  useEffect(() => {
    loadAllSubtasks();
  }, [loadAllSubtasks]);

  useEffect(() => {
    fetchWorkspaceMembers();
  }, [fetchWorkspaceMembers]);

  useEffect(() => {
    fetchStatusTypes();
  }, [fetchStatusTypes]);

  return {
    state,
    updateState,
    supabase,
    refreshTasks,
    refreshStatuses,
    loadAllSubtasks,
    fetchWorkspaceMembers,
    createEventLog,
    fetchStatusTypes,
  };
};
