import { useCallback } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type {
  Workspace,
  Space,
  Sprint,
  Task,
  Status,
  Profile,
} from "@/lib/database.types";
import type { SprintViewState } from "../types";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { arrayMove } from "@dnd-kit/sortable";
import { createTaskActivity } from "@/lib/events";
import { useAuth } from "@/contexts/auth-context";

interface UseTaskOperationsProps {
  state: SprintViewState;
  updateState: (updates: Partial<SprintViewState>) => void;
  supabase: ReturnType<typeof createClientSupabaseClient>;
  refreshTasks: () => Promise<void>;
  refreshStatuses: () => Promise<void>;
  loadAllSubtasks: () => Promise<void>;
  createEventLog: (eventData: any) => Promise<void>;
  workspace: Workspace;
  space: Space;
  sprint: Sprint;
}

export function useTaskOperations({
  state,
  updateState,
  supabase,
  refreshTasks,
  refreshStatuses,
  loadAllSubtasks,
  createEventLog,
  workspace,
  space,
  sprint,
}: UseTaskOperationsProps) {
  const { toast } = useEnhancedToast();
  const { user } = useAuth();

  const handleTaskCreated = useCallback(
    async (task: Task) => {
      await refreshTasks();
      await loadAllSubtasks();

      await createEventLog({
        type: "created",
        entityType: "task",
        entityId: task.id,
        entityName: task.name,
        description: `Created task "${task.name}" in sprint "${sprint.name}"`,
      });

      // Dispatch custom event for sidebar synchronization
      window.dispatchEvent(
        new CustomEvent("taskCreated", {
          detail: { task, sprintId: sprint.id },
        })
      );

      toast({
        title: "Task created",
        description: `Task "${task.name}" has been created successfully.`,
      });

      updateState({ createTaskModalOpen: false, subtaskParentId: undefined });
    },
    [
      refreshTasks,
      loadAllSubtasks,
      createEventLog,
      sprint.name,
      toast,
      updateState,
      sprint.id,
    ]
  );

  const handleStatusCreated = useCallback(async () => {
    await refreshStatuses();

    await createEventLog({
      type: "created",
      entityType: "status",
      entityId: "new-status", // This will be updated with actual status ID
      entityName: "New Status",
      description: `Created new status in sprint "${sprint.name}"`,
    });

    toast({
      title: "Status created",
      description: "New status has been created successfully.",
    });

    updateState({ createStatusModalOpen: false });
  }, [refreshStatuses, createEventLog, sprint.name, toast, updateState]);

  const handleRenameTask = useCallback(
    async (taskId: string, newName: string) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ name: newName })
          .eq("id", taskId);

        if (error) throw error;

        await refreshTasks();
        await loadAllSubtasks();

        await createEventLog({
          type: "updated",
          entityType: "task",
          entityId: taskId,
          entityName: newName,
          description: `Renamed task to "${newName}" in sprint "${sprint.name}"`,
        });

        toast({
          title: "Task renamed",
          description: "Task has been renamed successfully.",
        });
      } catch (error) {
        console.error("Error renaming task:", error);
        toast({
          title: "Error",
          description: "Failed to rename task.",
          variant: "destructive",
        });
      }
    },
    [
      supabase,
      refreshTasks,
      loadAllSubtasks,
      createEventLog,
      sprint.name,
      toast,
    ]
  );

  const handleUpdatePriority = useCallback(
    async (taskId: string, priority: string | null) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ priority })
          .eq("id", taskId);

        if (error) throw error;

        await refreshTasks();
        await loadAllSubtasks();

        // Create main event
        await createEventLog({
          type: "updated",
          entityType: "task",
          entityId: taskId,
          entityName: "Task", // Will be updated with actual task name
          description: `Updated priority of task in sprint "${sprint.name}"`,
        });

        // Create detailed activity if user is available
        if (user) {
          const task = state.tasks.find((t) => t.id === taskId);
          if (task) {
            await createTaskActivity({
              type: "priority_changed",
              taskId: taskId,
              taskName: task.name,
              userId: user.id,
              workspaceId: workspace.id,
              spaceId: space.id,
              description: `Changed priority to ${
                priority || "none"
              } in sprint "${sprint.name}"`,
              metadata: {
                oldValue: task.priority,
                newValue: priority,
                sprintName: sprint.name,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error updating task priority:", error);
        toast({
          title: "Error",
          description: "Failed to update task priority.",
          variant: "destructive",
        });
      }
    },
    [
      supabase,
      refreshTasks,
      loadAllSubtasks,
      createEventLog,
      sprint.name,
      toast,
      user,
      workspace.id,
      space.id,
      state.tasks,
    ]
  );

  const handleUpdateDates = useCallback(
    async (taskId: string, startDate: Date | null, dueDate: Date | null) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({
            start_date: startDate?.toISOString() || null,
            due_date: dueDate?.toISOString() || null,
          })
          .eq("id", taskId);

        if (error) throw error;

        await refreshTasks();
        await loadAllSubtasks();

        await createEventLog({
          type: "updated",
          entityType: "task",
          entityId: taskId,
          entityName: "Task",
          description: `Updated dates of task in sprint "${sprint.name}"`,
        });

        // Create detailed activity if user is available
        if (user) {
          const task = state.tasks.find((t) => t.id === taskId);
          if (task) {
            await createTaskActivity({
              type: "start_date_changed",
              taskId: taskId,
              taskName: task.name,
              userId: user.id,
              workspaceId: workspace.id,
              spaceId: space.id,
              description: `Updated start date in sprint "${sprint.name}"`,
              metadata: {
                oldValue: task.start_date,
                newValue: startDate?.toISOString() || null,
                sprintName: sprint.name,
              },
            });

            await createTaskActivity({
              type: "due_date_changed",
              taskId: taskId,
              taskName: task.name,
              userId: user.id,
              workspaceId: workspace.id,
              spaceId: space.id,
              description: `Updated due date in sprint "${sprint.name}"`,
              metadata: {
                oldValue: task.due_date,
                newValue: dueDate?.toISOString() || null,
                sprintName: sprint.name,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error updating task dates:", error);
        toast({
          title: "Error",
          description: "Failed to update task dates.",
          variant: "destructive",
        });
      }
    },
    [
      supabase,
      refreshTasks,
      loadAllSubtasks,
      createEventLog,
      sprint.name,
      toast,
      user,
      workspace.id,
      space.id,
      state.tasks,
    ]
  );

  const handleAssignTask = useCallback(
    async (taskId: string, assigneeId: string | null) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ assignee_id: assigneeId })
          .eq("id", taskId);

        if (error) throw error;

        await refreshTasks();
        await loadAllSubtasks();

        await createEventLog({
          type: "updated",
          entityType: "task",
          entityId: taskId,
          entityName: "Task",
          description: `Assigned task in sprint "${sprint.name}"`,
        });

        // Create detailed activity if user is available
        if (user) {
          const task = state.tasks.find((t) => t.id === taskId);
          if (task) {
            await createTaskActivity({
              type: "assignee_changed",
              taskId: taskId,
              taskName: task.name,
              userId: user.id,
              workspaceId: workspace.id,
              spaceId: space.id,
              description: `Changed assignee in sprint "${sprint.name}"`,
              metadata: {
                oldValue: task.assignee_id,
                newValue: assigneeId,
                sprintName: sprint.name,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error assigning task:", error);
        toast({
          title: "Error",
          description: "Failed to assign task.",
          variant: "destructive",
        });
      }
    },
    [
      supabase,
      refreshTasks,
      loadAllSubtasks,
      createEventLog,
      sprint.name,
      toast,
      user,
      workspace.id,
      space.id,
      state.tasks,
    ]
  );

  const handleDeleteTask = useCallback(
    async (task: Task) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", task.id);

        if (error) throw error;

        await refreshTasks();
        await loadAllSubtasks();

        await createEventLog({
          type: "deleted",
          entityType: "task",
          entityId: task.id,
          entityName: task.name,
          description: `Deleted task "${task.name}" from sprint "${sprint.name}"`,
        });

        toast({
          title: "Task deleted",
          description: "Task has been deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting task:", error);
        toast({
          title: "Error",
          description: "Failed to delete task.",
          variant: "destructive",
        });
      }
    },
    [
      supabase,
      refreshTasks,
      loadAllSubtasks,
      createEventLog,
      sprint.name,
      toast,
    ]
  );

  const handleRenameStatus = useCallback(
    async (statusId: string, newName: string) => {
      try {
        const { error } = await supabase
          .from("statuses")
          .update({ name: newName })
          .eq("id", statusId);

        if (error) throw error;

        await refreshStatuses();
        await createEventLog({
          type: "updated",
          entityType: "status",
          entityId: statusId,
          entityName: newName,
          description: `Renamed status to "${newName}" in sprint "${sprint.name}"`,
        });

        toast({
          title: "Status renamed",
          description: "Status has been renamed successfully.",
        });
      } catch (error) {
        console.error("Error renaming status:", error);
        toast({
          title: "Error",
          description: "Failed to rename status.",
          variant: "destructive",
        });
      }
    },
    [supabase, refreshStatuses, createEventLog, sprint.name, toast]
  );

  const handleUpdateStatusSettings = useCallback(
    async (updatedStatus: any) => {
      try {
        const { error } = await supabase
          .from("statuses")
          .update({
            name: updatedStatus.name,
            status_type_id: updatedStatus.status_type_id,
            color: updatedStatus.color,
            type: updatedStatus.type,
          })
          .eq("id", updatedStatus.id);

        if (error) throw error;

        await refreshStatuses();
        await createEventLog({
          type: "updated",
          entityType: "status",
          entityId: updatedStatus.id,
          entityName: updatedStatus.name,
          description: `Updated status "${updatedStatus.name}" settings in sprint "${sprint.name}"`,
        });

        toast({
          title: "Status updated",
          description: `Status "${updatedStatus.name}" has been updated successfully.`,
        });
      } catch (error) {
        console.error("Error updating status settings:", error);
        toast({
          title: "Error",
          description: "Failed to update status settings.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [supabase, refreshStatuses, createEventLog, sprint.name, toast]
  );

  const handleDragEnd = useCallback(
    async (active: any, over: any) => {
      if (!over) return;

      // Handle status reordering
      if (state.activeStatus) {
        const oldIndex = state.statuses.findIndex((s) => s.id === active.id);
        const newIndex = state.statuses.findIndex((s) => s.id === over.id);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const newOrderedStatuses = arrayMove(
          state.statuses,
          oldIndex,
          newIndex
        );

        updateState({ statuses: newOrderedStatuses });

        try {
          const updates = newOrderedStatuses.map((status, index) => ({
            id: status.id,
            status_id: status.status_id,
            name: status.name,
            color: status.color,
            position: index,
            workspace_id: status.workspace_id,
            project_id: status.project_id,
            space_id: status.space_id,
            sprint_id: status.sprint_id,
            status_type_id: status.status_type_id,
            type: status.type,
            integration_type: status.integration_type,
            external_id: status.external_id,
            external_data: status.external_data,
            last_synced_at: status.last_synced_at,
            sync_status: status.sync_status,
            pending_sync: status.pending_sync,
          }));

          const { error } = await supabase
            .from("statuses")
            .upsert(updates, { onConflict: "id" });

          if (error) {
            console.error("Error updating status positions:", error);
            await refreshStatuses();
          } else {
            await createEventLog({
              type: "reordered",
              entityType: "status",
              entityId: state.activeStatus.id,
              entityName: state.activeStatus.name,
              description: `Reordered status "${state.activeStatus.name}" in sprint "${sprint.name}"`,
              metadata: {
                oldIndex,
                newIndex,
                oldStatusName: state.activeStatus.name,
                newStatusName: newOrderedStatuses[newIndex].name,
              },
            });
          }
        } catch (error) {
          console.error("Error updating status positions:", error);
          await refreshStatuses();
        }
        return;
      }

      // Handle task dragging
      if (state.activeTask) {
        const taskId = active.id as string;
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task || task.parent_task_id) return;

        let targetStatusId: string | null = null;

        const targetStatus = state.statuses.find((s) => s.id === over.id);
        if (targetStatus) {
          targetStatusId = targetStatus.id;
        } else if (over.id.toString().startsWith("status-")) {
          targetStatusId = over.id.toString().replace("status-", "");
        } else {
          const targetTask = state.tasks.find((t) => t.id === over.id);
          if (targetTask) {
            targetStatusId = targetTask.status_id;
          }
        }

        if (!targetStatusId || task.status_id === targetStatusId) return;

        const oldStatus = state.statuses.find((s) => s.id === task.status_id);
        const newStatus = state.statuses.find((s) => s.id === targetStatusId);

        updateState({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status_id: targetStatusId } : t
          ),
        });

        try {
          const { error } = await supabase
            .from("tasks")
            .update({ status_id: targetStatusId })
            .eq("id", taskId);

          if (error) {
            console.error("Error updating task status:", error);
            await refreshTasks();
          } else {
            await refreshTasks();
            await loadAllSubtasks();

            await createEventLog({
              type: "updated",
              entityType: "task",
              entityId: task.id,
              entityName: task.name,
              description: `Moved task "${task.name}" from "${
                oldStatus?.name || "Unknown"
              }" to "${newStatus?.name || "Unknown"}" in sprint "${
                sprint.name
              }"`,
              metadata: {
                oldStatusId: task.status_id,
                newStatusId: targetStatusId,
                oldStatusName: oldStatus?.name,
                newStatusName: newStatus?.name,
              },
            });
          }
        } catch (error) {
          console.error("Error updating task status:", error);
          await refreshTasks();
        }
      }
    },
    [
      state,
      updateState,
      supabase,
      refreshStatuses,
      refreshTasks,
      loadAllSubtasks,
      createEventLog,
      sprint.name,
    ]
  );

  return {
    handleTaskCreated,
    handleStatusCreated,
    handleRenameTask,
    handleUpdatePriority,
    handleUpdateDates,
    handleAssignTask,
    handleDeleteTask,
    handleRenameStatus,
    handleUpdateStatusSettings,
    handleDragEnd,
  };
}
