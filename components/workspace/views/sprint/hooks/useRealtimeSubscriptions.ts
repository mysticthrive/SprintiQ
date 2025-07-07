import { useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { Workspace, Sprint } from "@/lib/database.types";

interface UseRealtimeSubscriptionsProps {
  supabase: ReturnType<typeof createClientSupabaseClient>;
  workspace: Workspace;
  sprint: Sprint;
  refreshTasks: () => Promise<void>;
  refreshStatuses: () => Promise<void>;
  loadAllSubtasks: () => Promise<void>;
}

export function useRealtimeSubscriptions({
  supabase,
  workspace,
  sprint,
  refreshTasks,
  refreshStatuses,
  loadAllSubtasks,
}: UseRealtimeSubscriptionsProps) {
  useEffect(() => {
    // Subscribe to task changes for this sprint
    const tasksSubscription = supabase
      .channel("sprint_tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `sprint_id=eq.${sprint.id}`,
        },
        () => {
          refreshTasks();
          loadAllSubtasks();
        }
      )
      .subscribe();

    // Subscribe to status changes for this workspace
    const statusesSubscription = supabase
      .channel("sprint_statuses_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "statuses",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          refreshStatuses();
        }
      )
      .subscribe();

    return () => {
      tasksSubscription.unsubscribe();
      statusesSubscription.unsubscribe();
    };
  }, [
    supabase,
    workspace.id,
    sprint.id,
    refreshTasks,
    refreshStatuses,
    loadAllSubtasks,
  ]);
}
