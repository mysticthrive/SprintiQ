import { useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task, Status } from "@/lib/database.types";
import type { ProjectViewState } from "../types";

interface UseTaskOperationsProps {
  state: ProjectViewState;
  updateState: (updates: Partial<ProjectViewState>) => void;
  supabase: any;
  refreshTasks: () => Promise<void>;
  refreshStatuses: () => Promise<void>;
  loadAllSubtasks: () => Promise<void>;
  createEventLog: (eventData: any) => Promise<void>;
  workspace: any;
  project: any;
}

export const useTaskOperations = ({
  state,
  updateState,
  supabase,
  refreshTasks,
  refreshStatuses,
  loadAllSubtasks,
  createEventLog,
  workspace,
  project,
}: UseTaskOperationsProps) => {
  const handleTaskCreated = useCallback(
    async (task: Task) => {
      console.log("Task created in project view:", task);
      await refreshTasks();
      await loadAllSubtasks();

      // Dispatch custom event for sidebar synchronization
      window.dispatchEvent(
        new CustomEvent("taskCreated", {
          detail: { task, projectId: project.id },
        })
      );
    },
    [refreshTasks, loadAllSubtasks, project.id]
  );

  const handleStatusCreated = useCallback(async () => {
    await refreshStatuses();
    await refreshTasks();
  }, [refreshStatuses, refreshTasks]);

  const handleRenameTask = useCallback(
    async (taskId: string, newName: string) => {
      if (!newName.trim()) return;
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ name: newName })
          .eq("id", taskId);
        if (error) {
          console.error("Error renaming task:", error);
        } else {
          await refreshTasks();
          const task = state.tasks.find((t) => t.id === taskId);

          // Mark for sync if this is a Jira project (both jira and default type tasks)
          if (
            project.type === "jira" &&
            (task?.type === "jira" || task?.type === "default")
          ) {
            await supabase
              .from("tasks")
              .update({
                pending_sync: true,
                sync_status: "pending",
              })
              .eq("id", taskId);
          }

          await createEventLog({
            type: "updated",
            entityType: "task",
            entityId: taskId,
            entityName: newName,
            description: `Renamed task from "${
              task?.name || "Unknown"
            }" to "${newName}"`,
            metadata: {
              oldName: task?.name,
              newName: newName,
            },
          });
        }
      } catch (error) {
        console.error("Error renaming task:", error);
      }
    },
    [supabase, refreshTasks, state.tasks, createEventLog, project.type]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", taskId);
        if (error) {
          console.error("Error deleting task:", error);
        } else {
          await refreshTasks();
          await loadAllSubtasks();
          await createEventLog({
            type: "deleted",
            entityType: "task",
            entityId: taskId,
            entityName: task.name,
            description: `Deleted task "${task.name}"`,
            metadata: {
              taskName: task.name,
            },
          });
        }
      } catch (error) {
        console.error("Error deleting task:", error);
      } finally {
        updateState({ taskToDelete: null });
      }
    },
    [
      supabase,
      refreshTasks,
      loadAllSubtasks,
      state.tasks,
      createEventLog,
      updateState,
    ]
  );

  const handleAssignTask = useCallback(
    async (taskId: string, assigneeId: string | null) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ assignee_id: assigneeId })
          .eq("id", taskId);
        if (error) {
          console.error("Error assigning task:", error);
        } else {
          await refreshTasks();
          const task = state.tasks.find((t) => t.id === taskId);
          const assignedUser = state.workspaceMembers.find(
            (member) => member.id === assigneeId
          );
          const description = assigneeId
            ? `Assigned task "${task?.name || "Unknown"}" to "${
                assignedUser?.full_name || "Unknown"
              }"`
            : `Unassigned task "${task?.name || "Unknown"}"`;
          await createEventLog({
            type: "updated",
            entityType: "task",
            entityId: taskId,
            entityName: task?.name || "Unknown",
            description: description,
            metadata: {
              field: "assignee",
              oldAssigneeId: task?.assignee_id,
              newAssigneeId: assigneeId,
              oldAssigneeName: task?.assignee?.full_name,
              newAssigneeName: assignedUser?.full_name,
            },
          });
        }
      } catch (error) {
        console.error("Error assigning task:", error);
      }
    },
    [
      supabase,
      refreshTasks,
      state.tasks,
      state.workspaceMembers,
      createEventLog,
    ]
  );

  const handleUpdatePriority = useCallback(
    async (taskId: string, priority: string | null) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ priority })
          .eq("id", taskId);

        if (error) {
          console.error("Error updating task priority:", error);
        } else {
          await refreshTasks();
          const task = state.tasks.find((t) => t.id === taskId);

          // Mark for sync if this is a Jira project (both jira and default type tasks)
          if (
            project.type === "jira" &&
            (task?.type === "jira" || task?.type === "default")
          ) {
            await supabase
              .from("tasks")
              .update({
                pending_sync: true,
                sync_status: "pending",
              })
              .eq("id", taskId);
          }

          await createEventLog({
            type: "updated",
            entityType: "task",
            entityId: taskId,
            entityName: task?.name || "Unknown",
            description: `Updated task "${task?.name}" priority to ${
              priority || "none"
            }`,
            metadata: {
              field: "priority",
              oldPriority: task?.priority,
              newPriority: priority,
            },
          });
        }
      } catch (error) {
        console.error("Error updating task priority:", error);
      }
    },
    [supabase, refreshTasks, state.tasks, createEventLog, project.type]
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

        if (error) {
          console.error("Error updating task dates:", error);
        } else {
          await refreshTasks();
          const task = state.tasks.find((t) => t.id === taskId);

          // Mark for sync if this is a Jira project (both jira and default type tasks)
          if (
            project.type === "jira" &&
            (task?.type === "jira" || task?.type === "default")
          ) {
            await supabase
              .from("tasks")
              .update({
                pending_sync: true,
                sync_status: "pending",
              })
              .eq("id", taskId);
          }

          await createEventLog({
            type: "updated",
            entityType: "task",
            entityId: taskId,
            entityName: task?.name || "Unknown",
            description: `Updated task "${task?.name}" dates`,
            metadata: {
              field: "dates",
              oldStartDate: task?.start_date,
              newStartDate: startDate?.toISOString(),
              oldDueDate: task?.due_date,
              newDueDate: dueDate?.toISOString(),
            },
          });
        }
      } catch (error) {
        console.error("Error updating task dates:", error);
      }
    },
    [supabase, refreshTasks, state.tasks, createEventLog, project.type]
  );

  const handleRenameStatus = useCallback(
    async (statusId: string, newName: string) => {
      try {
        // Use direct Supabase call instead of API endpoint
        const { data, error } = await supabase
          .from("statuses")
          .update({ name: newName })
          .eq("id", statusId)
          .select()
          .single();

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(`Failed to rename status: ${error.message}`);
        }

        updateState({
          statuses: state.statuses.map((status) =>
            status.id === statusId ? { ...status, name: newName } : status
          ),
        });
      } catch (error) {
        console.error("Error renaming status:", error);
      }
    },
    [supabase, state.statuses, updateState]
  );

  const handleUpdateStatusSettings = useCallback(
    async (updatedStatus: any) => {
      try {
        console.log("Updating status settings:", updatedStatus);

        // Use direct Supabase call instead of API endpoint
        const { data, error } = await supabase
          .from("statuses")
          .update({
            name: updatedStatus.name,
            status_type_id: updatedStatus.status_type_id,
            color: updatedStatus.color,
            type: updatedStatus.type,
          })
          .eq("id", updatedStatus.id)
          .select()
          .single();

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(`Failed to update status settings: ${error.message}`);
        }

        console.log("Updated status data:", data);

        // Update local state
        updateState({
          statuses: state.statuses.map((status) =>
            status.id === updatedStatus.id
              ? { ...status, ...updatedStatus }
              : status
          ),
        });

        // Create event log
        await createEventLog({
          type: "updated",
          entityType: "status",
          entityId: updatedStatus.id,
          entityName: updatedStatus.name,
          description: `Updated status "${updatedStatus.name}" settings`,
          metadata: {
            oldName: state.statuses.find((s) => s.id === updatedStatus.id)
              ?.name,
            newName: updatedStatus.name,
            oldColor: state.statuses.find((s) => s.id === updatedStatus.id)
              ?.color,
            newColor: updatedStatus.color,
            oldType: state.statuses.find((s) => s.id === updatedStatus.id)
              ?.type,
            newType: updatedStatus.type,
          },
        });
      } catch (error) {
        console.error("Error updating status settings:", error);
        throw error;
      }
    },
    [supabase, state.statuses, updateState, createEventLog]
  );

  const handleDragEnd = useCallback(
    async (active: any, over: any) => {
      console.log("Project taskOperations.handleDragEnd - active:", active);
      console.log("Project taskOperations.handleDragEnd - over:", over);
      console.log(
        "Project taskOperations.handleDragEnd - state.activeStatus:",
        state.activeStatus
      );
      console.log(
        "Project taskOperations.handleDragEnd - state.activeTask:",
        state.activeTask
      );

      if (!over) return;

      // Handle status reordering
      if (state.activeStatus) {
        console.log(
          "Project taskOperations.handleDragEnd - handling status reordering"
        );
        console.log(
          "Project taskOperations.handleDragEnd - over.data:",
          over.data
        );

        const oldIndex = state.statuses.findIndex((s) => s.id === active.id);

        // Handle the case where over.id has a "status-" prefix for droppable areas
        let targetStatusId = over.id;
        if (over.id.toString().startsWith("status-")) {
          targetStatusId = over.id.toString().replace("status-", "");
        }

        const newIndex = state.statuses.findIndex(
          (s) => s.id === targetStatusId
        );

        console.log(
          "Project taskOperations.handleDragEnd - oldIndex:",
          oldIndex
        );
        console.log(
          "Project taskOperations.handleDragEnd - newIndex:",
          newIndex
        );
        console.log(
          "Project taskOperations.handleDragEnd - targetStatusId:",
          targetStatusId
        );

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          console.log(
            "Project taskOperations.handleDragEnd - invalid indices, returning"
          );
          return;
        }

        const newOrderedStatuses = arrayMove(
          state.statuses,
          oldIndex,
          newIndex
        );

        console.log(
          "Project taskOperations.handleDragEnd - newOrderedStatuses:",
          newOrderedStatuses
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
              description: `Reordered status "${state.activeStatus.name}"`,
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
        console.log(
          "Project taskOperations.handleDragEnd - handling task dragging"
        );
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
            // Mark for sync if this is a Jira task
            if (task.type === "jira" && task.external_id) {
              await supabase
                .from("tasks")
                .update({
                  pending_sync: true,
                  sync_status: "pending",
                })
                .eq("id", taskId);
            }

            await createEventLog({
              type: "updated",
              entityType: "task",
              entityId: task.id,
              entityName: task.name,
              description: `Updated task "${task.name}" status from "${
                oldStatus?.name || "Unknown"
              }" to "${newStatus?.name || "Unknown"}"`,
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
      createEventLog,
    ]
  );

  return {
    handleTaskCreated,
    handleStatusCreated,
    handleRenameTask,
    handleDeleteTask,
    handleAssignTask,
    handleUpdatePriority,
    handleUpdateDates,
    handleRenameStatus,
    handleUpdateStatusSettings,
    handleDragEnd,
  };
};
