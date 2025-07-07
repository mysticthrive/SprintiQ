import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { useAuth } from "@/contexts/auth-context";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { createTaskActivity } from "@/lib/events";
import { format, parseISO } from "date-fns";
import { priorityConfig } from "../../project/types";
import type {
  Task,
  Status,
  Workspace,
  Space,
  Project,
  Tag as TagType,
} from "@/lib/database.types";
import {
  generateTaskId,
  generateTagId,
  getRandomTagColor,
  copyToClipboard,
  getTaskUrl,
} from "../utils";

export const useTaskActions = (
  initialTask: Task,
  workspace: Workspace,
  space: Space,
  project: Project | null,
  statuses: Status[],
  tags: TagType[],
  onTaskUpdate: (updatedTask: Task) => void,
  onReloadActivities: () => void
) => {
  const [loading, setLoading] = useState(false);
  const supabase = createClientSupabaseClient();
  const router = useRouter();
  const { toast } = useEnhancedToast();
  const { user } = useAuth();

  const handleUpdateStatus = async (statusId: string) => {
    setLoading(true);
    try {
      const oldStatus = initialTask.status;

      const { error } = await supabase
        .from("tasks")
        .update({ status_id: statusId })
        .eq("id", initialTask.id);

      if (error) {
        console.error("Error updating status:", error);
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
        return;
      }

      const updatedStatus = statuses.find((s) => s.id === statusId);
      const updatedTask = {
        ...initialTask,
        status_id: statusId,
        status: updatedStatus || initialTask.status,
      };
      onTaskUpdate(updatedTask);

      if (user) {
        const oldStatusName = oldStatus?.name || "None";
        const newStatusName = updatedStatus?.name || "Unknown";

        await createTaskActivity({
          type: "status_changed",
          taskId: initialTask.id,
          taskName: initialTask.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `changed status from ${oldStatusName} to ${newStatusName}`,
          metadata: {
            oldValue: oldStatus?.name,
            newValue: newStatusName,
            oldStatusId: initialTask.status_id,
            newStatusId: statusId,
          },
        });

        // Send Slack notification
        try {
          const slackCheckResponse = await fetch(
            `/api/slack/channels?workspaceId=${workspace.workspace_id}`
          );
          if (slackCheckResponse.ok) {
            const response = await fetch("/api/slack/send-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                workspaceId: workspace.workspace_id,
                entityType: "task",
                entityId: initialTask.id,
                entityName: initialTask.name,
                eventType: "updated",
                description: `Updated task "${initialTask.name}" status from ${oldStatusName} to ${newStatusName}`,
                metadata: {
                  projectName: project?.name,
                  spaceName: space.name,
                  changeType: "status",
                  oldValue: oldStatusName,
                  newValue: newStatusName,
                  oldStatusId: initialTask.status_id,
                  newStatusId: statusId,
                  userName: user.user_metadata?.full_name || user.email,
                  priority: initialTask.priority,
                  assigneeName: initialTask.assignee?.full_name,
                },
                userId: user.id,
              }),
            });

            if (!response.ok) {
              console.warn("Failed to send Slack notification");
            }
          } else {
            console.log("Slack not connected, skipping notification");
          }
        } catch (slackError) {
          console.warn("Failed to send Slack notification:", slackError);
        }

        onReloadActivities();
      }

      toast({
        title: "Success",
        description: `Status updated to "${updatedStatus?.name || "Unknown"}"`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    setLoading(true);
    try {
      const oldPriority = initialTask.priority;

      const { error } = await supabase
        .from("tasks")
        .update({ priority: priority || null })
        .eq("id", initialTask.id);

      if (error) {
        console.error("Error updating priority:", error);
        toast({
          title: "Error",
          description: "Failed to update priority",
          variant: "destructive",
        });
        return;
      }

      const updatedTask = {
        ...initialTask,
        priority: priority || "medium",
      } as Task;
      onTaskUpdate(updatedTask);

      const priorityLabel = priority
        ? priorityConfig[priority as keyof typeof priorityConfig]?.label
        : "No priority";

      if (user) {
        const oldPriorityLabel = oldPriority
          ? priorityConfig[oldPriority as keyof typeof priorityConfig]?.label
          : "No priority";

        await createTaskActivity({
          type: "priority_changed",
          taskId: initialTask.id,
          taskName: initialTask.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `changed priority from ${oldPriorityLabel} to ${priorityLabel}`,
          metadata: {
            oldValue: oldPriority,
            newValue: priority || null,
          },
        });

        // Send Slack notification
        try {
          const slackCheckResponse = await fetch(
            `/api/slack/channels?workspaceId=${workspace.workspace_id}`
          );
          if (slackCheckResponse.ok) {
            const response = await fetch("/api/slack/send-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                workspaceId: workspace.workspace_id,
                entityType: "task",
                entityId: initialTask.id,
                entityName: initialTask.name,
                eventType: "updated",
                description: `Updated task "${initialTask.name}" priority from ${oldPriorityLabel} to ${priorityLabel}`,
                metadata: {
                  projectName: project?.name,
                  spaceName: space.name,
                  changeType: "priority",
                  oldValue: oldPriorityLabel,
                  newValue: priorityLabel,
                  oldPriority: oldPriority,
                  newPriority: priority || null,
                  userName: user.user_metadata?.full_name || user.email,
                  statusName: statuses.find(
                    (s) => s.id === initialTask.status_id
                  )?.name,
                  assigneeName: initialTask.assignee?.full_name,
                },
                userId: user.id,
              }),
            });

            if (!response.ok) {
              console.warn("Failed to send Slack notification");
            }
          } else {
            console.log("Slack not connected, skipping notification");
          }
        } catch (slackError) {
          console.warn("Failed to send Slack notification:", slackError);
        }

        onReloadActivities();
      }

      toast({
        title: "Success",
        description: `Priority updated to "${priorityLabel}"`,
      });
    } catch (error) {
      console.error("Error updating priority:", error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStartDate = async (date: Date | undefined) => {
    setLoading(true);
    try {
      const oldStartDate = initialTask.start_date;

      const { error } = await supabase
        .from("tasks")
        .update({ start_date: date ? date.toISOString() : null })
        .eq("id", initialTask.id);

      if (error) {
        console.error("Error updating start date:", error);
        toast({
          title: "Error",
          description: "Failed to update start date",
          variant: "destructive",
        });
        return;
      }

      const updatedTask = {
        ...initialTask,
        start_date: date ? date.toISOString() : null,
      };
      onTaskUpdate(updatedTask);

      if (user) {
        const oldDate = oldStartDate
          ? format(parseISO(oldStartDate), "MMM d, yyyy")
          : "None";
        const newDate = date ? format(date, "MMM d, yyyy") : "None";

        await createTaskActivity({
          type: "start_date_changed",
          taskId: initialTask.id,
          taskName: initialTask.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `changed start date from ${oldDate} to ${newDate}`,
          metadata: {
            oldValue: oldStartDate,
            newValue: date ? date.toISOString() : null,
          },
        });

        onReloadActivities();
      }

      toast({
        title: "Success",
        description: "Start date updated successfully",
      });
    } catch (error) {
      console.error("Error updating start date:", error);
      toast({
        title: "Error",
        description: "Failed to update start date",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDueDate = async (date: Date | undefined) => {
    setLoading(true);
    try {
      const oldDueDate = initialTask.due_date;

      const { error } = await supabase
        .from("tasks")
        .update({ due_date: date ? date.toISOString() : null })
        .eq("id", initialTask.id);

      if (error) {
        console.error("Error updating due date:", error);
        toast({
          title: "Error",
          description: "Failed to update due date",
          variant: "destructive",
        });
        return;
      }

      const updatedTask = {
        ...initialTask,
        due_date: date ? date.toISOString() : null,
      };
      onTaskUpdate(updatedTask);

      if (user) {
        const oldDate = oldDueDate
          ? format(parseISO(oldDueDate), "MMM d, yyyy")
          : "None";
        const newDate = date ? format(date, "MMM d, yyyy") : "None";

        await createTaskActivity({
          type: "due_date_changed",
          taskId: initialTask.id,
          taskName: initialTask.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `changed due date from ${oldDate} to ${newDate}`,
          metadata: {
            oldValue: oldDueDate,
            newValue: date ? date.toISOString() : null,
          },
        });

        onReloadActivities();
      }

      toast({
        title: "Success",
        description: "Due date updated successfully",
      });
    } catch (error) {
      console.error("Error updating due date:", error);
      toast({
        title: "Error",
        description: "Failed to update due date",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTimeEstimate = async (timeEstimate: string) => {
    setLoading(true);
    try {
      const oldTimeEstimate = (initialTask as any).time_estimate;

      const { error } = await supabase
        .from("tasks")
        .update({ time_estimate: timeEstimate || null })
        .eq("id", initialTask.id);

      if (error) {
        console.error("Error updating time estimate:", error);
        toast({
          title: "Error",
          description: "Failed to update time estimate",
          variant: "destructive",
        });
        return;
      }

      const updatedTask = {
        ...initialTask,
        time_estimate: timeEstimate || null,
      } as Task;
      onTaskUpdate(updatedTask);

      if (user) {
        const oldValue = oldTimeEstimate || "None";
        const newValue = timeEstimate || "None";

        await createTaskActivity({
          type: "time_estimate_changed",
          taskId: initialTask.id,
          taskName: initialTask.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `changed time estimate from ${oldValue} to ${newValue}`,
          metadata: {
            oldValue: oldTimeEstimate,
            newValue: timeEstimate || null,
          },
        });

        onReloadActivities();
      }

      toast({
        title: "Success",
        description: timeEstimate
          ? `Time estimate set to ${timeEstimate}`
          : "Time estimate cleared",
      });
    } catch (error) {
      console.error("Error updating time estimate:", error);
      toast({
        title: "Error",
        description: "Failed to update time estimate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const taskUrl = getTaskUrl(workspace.workspace_id, initialTask.task_id);
      const success = await copyToClipboard(taskUrl);
      if (success) {
        toast({
          title: "Success",
          description: "Task link copied to clipboard",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleCopyId = async () => {
    try {
      const success = await copyToClipboard(initialTask.task_id);
      if (success) {
        toast({
          title: "Success",
          description: "Task ID copied to clipboard",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to copy ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error copying ID:", error);
      toast({
        title: "Error",
        description: "Failed to copy ID",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async () => {
    try {
      // Delete task tags
      const { error: tagError } = await supabase
        .from("task_tags")
        .delete()
        .eq("task_id", initialTask.id);

      if (tagError) {
        console.error("Error deleting task tags:", tagError);
      }

      // Delete the task
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", initialTask.id);

      if (error) {
        console.error("Error deleting task:", error);
        toast({
          title: "Error",
          description: "Failed to delete task",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      router.push(`/${workspace.workspace_id}/project/${project?.project_id}`);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTask = async () => {
    try {
      const newTaskId = generateTaskId();

      const { data: duplicatedTask, error } = await supabase
        .from("tasks")
        .insert({
          task_id: newTaskId,
          name: `${initialTask.name} (Copy)`,
          description: initialTask.description,
          project_id: initialTask.project_id,
          space_id: initialTask.space_id,
          workspace_id: initialTask.workspace_id,
          status_id: statuses[0]?.id,
          priority: initialTask.priority,
          due_date: initialTask.due_date,
          start_date: initialTask.start_date,
          assignee_id: initialTask.assignee_id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error duplicating task:", error);
        toast({
          title: "Error",
          description: "Failed to duplicate task",
          variant: "destructive",
        });
        return;
      }

      // Duplicate task tags if any
      if (initialTask.task_tags && initialTask.task_tags.length > 0) {
        const tagInserts = initialTask.task_tags.map((taskTag: any) => ({
          task_id: duplicatedTask.id,
          tag_id: taskTag.tag.id,
        }));

        await supabase.from("task_tags").insert(tagInserts);
      }

      if (user) {
        await createTaskActivity({
          type: "subtask_created",
          taskId: initialTask.id,
          taskName: initialTask.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `duplicated task as "${duplicatedTask.name}"`,
          metadata: {
            duplicatedTaskId: duplicatedTask.id,
            duplicatedTaskName: duplicatedTask.name,
          },
        });

        onReloadActivities();
      }

      toast({
        title: "Success",
        description: "Task duplicated successfully",
      });

      window.location.href = `/${workspace.workspace_id}/task/${duplicatedTask.task_id}`;
    } catch (error) {
      console.error("Error duplicating task:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate task",
        variant: "destructive",
      });
    }
  };

  return {
    loading,
    handleUpdateStatus,
    handleUpdatePriority,
    handleUpdateStartDate,
    handleUpdateDueDate,
    handleUpdateTimeEstimate,
    handleCopyLink,
    handleCopyId,
    handleDeleteTask,
    handleDuplicateTask,
  };
};
