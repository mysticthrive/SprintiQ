import { useState, useCallback, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type {
  Workspace,
  Space,
  Sprint,
  SprintFolder,
  Task,
  Status,
  StatusType,
  Tag,
  Profile,
} from "@/lib/database.types";
import type { SprintViewState } from "../types";
import { createEvent } from "@/lib/events";
import { useAuth } from "@/contexts/auth-context";

interface UseSprintDataProps {
  workspace: Workspace;
  space: Space;
  sprintFolder: SprintFolder;
  sprint: Sprint;
  initialTasks: Task[];
  initialStatuses: Status[];
  initialTags: Tag[];
}

export function useSprintData({
  workspace,
  space,
  sprintFolder,
  sprint,
  initialTasks,
  initialStatuses,
  initialTags,
}: UseSprintDataProps) {
  const { user } = useAuth();
  const [supabase] = useState(() => createClientSupabaseClient());
  const [state, setState] = useState<SprintViewState>({
    view: "board",
    activeViews: ["board", "list"],
    tasks: initialTasks,
    statuses: initialStatuses,
    tags: initialTags,
    statusTypes: [],
    activeTask: null,
    activeStatus: null,
    expandedTasks: new Set(),
    collapsedStatuses: new Set(),
    visibleColumns: new Set(["assignee", "dueDate", "priority", "subtasks"]),
    allSubtasks: [],
    workspaceMembers: [],
    isLoading: false,
    taskToDelete: null,
    sprintToDelete: null,
    createTaskModalOpen: false,
    createStatusModalOpen: false,
    customizeListModalOpen: false,
    subtaskParentId: undefined,
    // Sprint action modals
    renameSprintModalOpen: false,
    moveSprintModalOpen: false,
    sprintInfoModalOpen: false,
    statusSettingsModalOpen: false,
    statusToEdit: null,
  });

  const updateState = useCallback((updates: Partial<SprintViewState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const { data: tasksData } = await supabase
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

      if (tasksData) {
        updateState({ tasks: tasksData as Task[] });
      }
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    }
  }, [supabase, sprint.id, updateState]);

  const refreshStatuses = useCallback(async () => {
    try {
      const { data: statusesData } = await supabase
        .from("statuses")
        .select(
          `
          *,
          status_type:status_types!statuses_status_type_id_fkey(*)
        `
        )
        .eq("workspace_id", workspace.id)
        .or(
          `and(type.eq.space,space_id.eq.${space.id}),and(type.eq.sprint,sprint_id.eq.${sprint.id})`
        )
        .order("position", { ascending: true });

      if (statusesData) {
        console.log("[refreshStatuses] statusesData:", statusesData);
        updateState({ statuses: statusesData });
      }
    } catch (error) {
      console.error("Error refreshing statuses:", error);
    }
  }, [supabase, workspace.id, space.id, sprint.id, updateState]);

  const loadAllSubtasks = useCallback(async () => {
    try {
      const { data: subtasksData } = await supabase
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
        .not("parent_task_id", "is", null);

      if (subtasksData) {
        updateState({ allSubtasks: subtasksData as Task[] });
      }
    } catch (error) {
      console.error("Error loading subtasks:", error);
    }
  }, [supabase, sprint.id, updateState]);

  const createEventLog = useCallback(
    async (eventData: any) => {
      try {
        if (!user?.id) {
          console.warn("No user found, skipping event creation");
          return;
        }

        await createEvent({
          ...eventData,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          sprintId: sprint.id,
        });
      } catch (error) {
        console.error("Error creating event:", error);
      }
    },
    [user?.id, workspace.id, space.id, sprint.id]
  );

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

  // Load workspace members
  useEffect(() => {
    fetchWorkspaceMembers();
  }, [fetchWorkspaceMembers]);

  // Load status types
  useEffect(() => {
    fetchStatusTypes();
  }, [fetchStatusTypes]);

  // Load all subtasks on mount
  useEffect(() => {
    loadAllSubtasks();
  }, [loadAllSubtasks]);

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
}
