"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { useAuth } from "@/contexts/auth-context";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { createTaskActivity } from "@/lib/events";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Import hooks
import { useTaskData } from "./hooks/use-task-data";
import { useTaskActions } from "./hooks/use-task-actions";

// Import components
import { TaskHeader } from "./components/task-header";
import { TaskProperties } from "./components/task-properties";
import { TaskDescription } from "./components/task-description";
import { SubtasksList } from "./components/subtasks-list";
import { TaskActivity } from "./components/task-activity";

// Import utilities
import {
  generateTaskId,
  generateTagId,
  getRandomTagColor,
  getCompletedStatus,
  getTodoStatus,
} from "./utils";

import type { TaskDetailViewProps } from "./types";
import type { Task } from "@/lib/database.types";

export default function TaskDetailView({
  task: initialTask,
  workspace,
  space,
  project,
  sprint,
  statuses,
  tags,
}: TaskDetailViewProps) {
  // State management
  const [task, setTask] = useState(initialTask);
  const [editedTask, setEditedTask] = useState(task);
  const [editedDescription, setEditedDescription] = useState(
    task.description || ""
  );
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Subtask state
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  // Activity state
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activitySearchValue, setActivitySearchValue] = useState("");
  const [showActivitySearch, setShowActivitySearch] = useState(false);

  // Task name editing state
  const [isEditingTaskName, setIsEditingTaskName] = useState(false);
  const [editedTaskName, setEditedTaskName] = useState(task.name);

  // Delete task dialog
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);

  // General loading state
  const [loading, setLoading] = useState(false);

  // Hooks
  const router = useRouter();
  const { toast } = useEnhancedToast();
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();

  // Data fetching hook
  const {
    subtasks,
    setSubtasks,
    workspaceMembers,
    taskAssignees,
    setTaskAssignees,
    activities,
    loadSubtasks,
    loadWorkspaceMembers,
    loadTaskAssignees,
    loadTaskActivities,
  } = useTaskData(task, workspace);

  // Task actions hook
  const {
    loading: actionsLoading,
    handleUpdateStatus,
    handleUpdatePriority,
    handleUpdateStartDate,
    handleUpdateDueDate,
    handleUpdateTimeEstimate,
    handleCopyLink,
    handleCopyId,
    handleDeleteTask,
    handleDuplicateTask,
  } = useTaskActions(
    task,
    workspace,
    space,
    project,
    statuses,
    tags,
    setTask,
    loadTaskActivities
  );

  // Update loading state
  const isLoading = loading || actionsLoading;

  // Update states when task changes
  useEffect(() => {
    setEditedDescription(task.description || "");
    setEditedTaskName(task.name);
    setEditedTask(task);
  }, [task]);

  // Description handlers
  const handleStartEditDescription = () => {
    const currentDescription = task.description || "";
    setEditedDescription(currentDescription);
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    setLoading(true);
    try {
      const oldDescription = task.description;

      const { error } = await supabase
        .from("tasks")
        .update({ description: editedDescription })
        .eq("id", task.id);

      if (error) {
        console.error("Error updating description:", error);
        toast({
          title: "Error",
          description: "Failed to update description",
          variant: "destructive",
        });
        return;
      }

      const updatedTask = { ...task, description: editedDescription };
      setTask(updatedTask);
      setEditedTask(updatedTask);
      setIsEditingDescription(false);

      // Mark for sync if this is a Jira project (both jira and default type tasks)
      if (
        project?.type === "jira" &&
        (task.type === "jira" || task.type === "default")
      ) {
        await supabase
          .from("tasks")
          .update({
            pending_sync: true,
            sync_status: "pending",
          })
          .eq("id", task.id);
      }

      if (user) {
        const hasOldContent =
          oldDescription && oldDescription.trim().length > 0;
        const hasNewContent =
          editedDescription && editedDescription.trim().length > 0;

        let activityDescription = "";
        if (!hasOldContent && hasNewContent) {
          activityDescription = "added description";
        } else if (hasOldContent && !hasNewContent) {
          activityDescription = "removed description";
        } else {
          activityDescription = "updated description";
        }

        await createTaskActivity({
          type: "description_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: activityDescription,
          metadata: {
            oldValue: oldDescription,
            newValue: editedDescription,
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
                entityId: task.id,
                entityName: task.name,
                eventType: "updated",
                description: `Updated task "${task.name}" description`,
                metadata: {
                  projectName: project?.name,
                  spaceName: space.name,
                  changeType: "description",
                  oldValue: oldDescription,
                  newValue: editedDescription,
                  userName: user.user_metadata?.full_name || user.email,
                  statusName: statuses.find((s) => s.id === task.status_id)
                    ?.name,
                  priority: task.priority,
                  // storyPoints: task.story_points, // Not implemented in current schema
                  assigneeName: task.assignee?.full_name,
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

        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: "Description updated successfully",
      });
    } catch (error) {
      console.error("Error updating description:", error);
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDescription = () => {
    setEditedDescription(task.description || "");
    setIsEditingDescription(false);
  };

  // Task name handlers
  const handleEditTaskName = () => {
    setEditedTaskName(task.name);
    setIsEditingTaskName(true);
  };

  const handleSaveTaskName = async () => {
    if (!editedTaskName.trim() || editedTaskName.trim() === task.name) {
      setIsEditingTaskName(false);
      return;
    }

    setLoading(true);
    try {
      const oldName = task.name;

      const { error } = await supabase
        .from("tasks")
        .update({ name: editedTaskName.trim() })
        .eq("id", task.id);

      if (error) {
        console.error("Error updating task name:", error);
        toast({
          title: "Error",
          description: "Failed to update task name",
          variant: "destructive",
        });
        return;
      }

      const updatedTask = { ...task, name: editedTaskName.trim() };
      setTask(updatedTask);
      setEditedTask(updatedTask);
      setIsEditingTaskName(false);

      // Mark for sync if this is a Jira project (both jira and default type tasks)
      if (
        project?.type === "jira" &&
        (task.type === "jira" || task.type === "default")
      ) {
        await supabase
          .from("tasks")
          .update({
            pending_sync: true,
            sync_status: "pending",
          })
          .eq("id", task.id);
      }

      if (user) {
        await createTaskActivity({
          type: "description_changed",
          taskId: task.id,
          taskName: editedTaskName.trim(),
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `changed task name from "${oldName}" to "${editedTaskName.trim()}"`,
          metadata: {
            oldValue: oldName,
            newValue: editedTaskName.trim(),
            changeType: "name",
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
                entityId: task.id,
                entityName: editedTaskName.trim(),
                eventType: "updated",
                description: `Updated task name from "${oldName}" to "${editedTaskName.trim()}"`,
                metadata: {
                  projectName: project?.name,
                  spaceName: space.name,
                  changeType: "name",
                  oldValue: oldName,
                  newValue: editedTaskName.trim(),
                  userName: user.user_metadata?.full_name || user.email,
                  statusName: statuses.find((s) => s.id === task.status_id)
                    ?.name,
                  priority: task.priority,
                  assigneeName: task.assignee?.full_name,
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

        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: "Task name updated successfully",
      });
    } catch (error) {
      console.error("Error updating task name:", error);
      toast({
        title: "Error",
        description: "Failed to update task name",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTaskName = () => {
    setEditedTaskName(task.name);
    setIsEditingTaskName(false);
  };

  // Subtask handlers
  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim()) return;

    setLoading(true);
    try {
      if (!statuses || statuses.length === 0) {
        console.error("No statuses available for subtask creation");
        toast({
          title: "Error",
          description: "No statuses available. Please try refreshing the page.",
          variant: "destructive",
        });
        return;
      }

      const subtaskId = generateTaskId();

      const { data: newSubtask, error } = await supabase
        .from("tasks")
        .insert({
          task_id: subtaskId,
          name: newSubtaskName,
          project_id: task.project_id,
          space_id: task.space_id,
          workspace_id: task.workspace_id,
          parent_task_id: task.id,
          status_id: statuses[0].id,
          priority: "medium",
        })
        .select(
          `
          *,
          assignee:profiles!tasks_assignee_id_fkey(*),
          status:statuses(*),
          task_tags(tag:tags(*))
        `
        )
        .single();

      if (error) {
        console.error("Error creating subtask:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create subtask",
          variant: "destructive",
        });
        return;
      }

      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskName("");
      setIsAddingSubtask(false);

      if (user) {
        await createTaskActivity({
          type: "subtask_created",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `created subtask "${newSubtaskName}"`,
          metadata: {
            subtaskId: newSubtask.id,
            subtaskName: newSubtaskName,
          },
        });

        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: "Subtask created successfully",
      });
    } catch (error) {
      console.error("Exception in handleAddSubtask:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create subtask",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubtaskComplete = async (subtask: Task) => {
    const completedStatus = getCompletedStatus(statuses);
    const todoStatus = getTodoStatus(statuses);

    const newStatusId =
      subtask.status_id === completedStatus?.id
        ? todoStatus?.id
        : completedStatus?.id;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status_id: newStatusId })
        .eq("id", subtask.id);

      if (error) {
        console.error("Error updating subtask:", error);
        return;
      }

      setSubtasks(
        subtasks.map((st) =>
          st.id === subtask.id
            ? { ...st, status_id: newStatusId || st.status_id }
            : st
        )
      );
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      const subtaskToDelete = subtasks.find((st) => st.id === subtaskId);

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", subtaskId);

      if (error) {
        console.error("Error deleting subtask:", error);
        toast({
          title: "Error",
          description: "Failed to delete subtask",
          variant: "destructive",
        });
        return;
      }

      setSubtasks(subtasks.filter((st) => st.id !== subtaskId));

      if (user && subtaskToDelete) {
        await createTaskActivity({
          type: "subtask_created",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `deleted subtask "${subtaskToDelete.name}"`,
          metadata: {
            subtaskId: subtaskId,
            subtaskName: subtaskToDelete.name,
            action: "deleted",
          },
        });

        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: "Subtask deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting subtask:", error);
      toast({
        title: "Error",
        description: "Failed to delete subtask",
        variant: "destructive",
      });
    }
  };

  // Subtask update handlers
  const updateSubtaskAssignee = async (
    subtaskId: string,
    assigneeId: string | null
  ) => {
    try {
      const oldSubtask = subtasks.find((st) => st.id === subtaskId);

      const { error } = await supabase
        .from("tasks")
        .update({ assignee_id: assigneeId })
        .eq("id", subtaskId);

      if (error) {
        console.error("Error updating subtask assignee:", error);
        toast({
          title: "Error",
          description: "Failed to update subtask assignee",
          variant: "destructive",
        });
        return;
      }

      const assignee = assigneeId
        ? workspaceMembers.find((m) => m.id === assigneeId)
        : null;
      setSubtasks(
        subtasks.map((st) =>
          st.id === subtaskId
            ? { ...st, assignee_id: assigneeId, assignee: assignee }
            : st
        )
      );

      if (user && oldSubtask) {
        const oldAssigneeName = oldSubtask.assignee?.full_name || "Unassigned";
        const newAssigneeName = assignee?.full_name || "Unassigned";

        await createTaskActivity({
          type: "assignee_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `changed assignee from ${oldAssigneeName} to ${newAssigneeName}`,
          metadata: {
            oldValue: oldAssigneeName,
            newValue: newAssigneeName,
            subtaskId: subtaskId,
            subtaskName: oldSubtask.name,
          },
        });

        loadTaskActivities();
      }

      const assigneeName = assignee?.full_name || "Unassigned";
      toast({
        title: "Success",
        description: `Subtask assignee updated to ${assigneeName}`,
      });
    } catch (error) {
      console.error("Error updating subtask assignee:", error);
      toast({
        title: "Error",
        description: "Failed to update subtask assignee",
        variant: "destructive",
      });
    }
  };

  const updateSubtaskPriority = async (subtaskId: string, priority: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ priority: priority || null })
        .eq("id", subtaskId);

      if (error) {
        console.error("Error updating subtask priority:", error);
        toast({
          title: "Error",
          description: "Failed to update subtask priority",
          variant: "destructive",
        });
        return;
      }

      const oldSubtask = subtasks.find((st) => st.id === subtaskId);
      setSubtasks(
        subtasks.map((st) =>
          st.id === subtaskId ? { ...st, priority: priority || "medium" } : st
        )
      );

      toast({
        title: "Success",
        description: "Subtask priority updated successfully",
      });
    } catch (error) {
      console.error("Error updating subtask priority:", error);
      toast({
        title: "Error",
        description: "Failed to update subtask priority",
        variant: "destructive",
      });
    }
  };

  const updateSubtaskDueDate = async (
    subtaskId: string,
    date: Date | undefined
  ) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ due_date: date ? date.toISOString() : null })
        .eq("id", subtaskId);

      if (error) {
        console.error("Error updating subtask due date:", error);
        toast({
          title: "Error",
          description: "Failed to update subtask due date",
          variant: "destructive",
        });
        return;
      }

      const oldSubtask = subtasks.find((st) => st.id === subtaskId);
      setSubtasks(
        subtasks.map((st) =>
          st.id === subtaskId
            ? { ...st, due_date: date ? date.toISOString() : null }
            : st
        )
      );

      const dateLabel = date ? format(date, "MMM d, yyyy") : "No due date";
      toast({
        title: "Success",
        description: `Subtask due date updated to ${dateLabel}`,
      });
    } catch (error) {
      console.error("Error updating subtask due date:", error);
      toast({
        title: "Error",
        description: "Failed to update subtask due date",
        variant: "destructive",
      });
    }
  };

  // Assignee handlers
  const addAssignee = async (memberId: string) => {
    try {
      const member = workspaceMembers.find((m) => m.id === memberId);
      if (!member) return;

      const isAlreadyAssigned = taskAssignees.some(
        (assignee) => assignee.id === memberId
      );
      if (isAlreadyAssigned) {
        toast({
          title: "Info",
          description: "User is already assigned to this task",
        });
        return;
      }

      const oldAssignee = task.assignee;

      const { error } = await supabase
        .from("tasks")
        .update({ assignee_id: memberId })
        .eq("id", task.id);

      if (error) {
        console.error("Error adding assignee:", error);
        toast({
          title: "Error",
          description: "Failed to assign user to task",
          variant: "destructive",
        });
        return;
      }

      setTaskAssignees([member]);
      const updatedTask = { ...task, assignee_id: memberId, assignee: member };
      setTask(updatedTask);
      setEditedTask(updatedTask);

      if (user) {
        const oldAssigneeName = oldAssignee?.full_name || "None";
        const newAssigneeName = member.full_name || "Unknown";

        await createTaskActivity({
          type: "assignee_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `changed assignee from ${oldAssigneeName} to ${newAssigneeName}`,
          metadata: {
            oldValue: oldAssignee?.full_name,
            newValue: member.full_name,
            oldAssigneeId: task.assignee_id,
            newAssigneeId: memberId,
          },
        });

        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: `${member.full_name} assigned to task`,
      });
    } catch (error) {
      console.error("Error adding assignee:", error);
      toast({
        title: "Error",
        description: "Failed to assign user to task",
        variant: "destructive",
      });
    }
  };

  const removeAssignee = async (memberId: string) => {
    try {
      const member = taskAssignees.find((assignee) => assignee.id === memberId);
      if (!member) return;

      const { error } = await supabase
        .from("tasks")
        .update({ assignee_id: null })
        .eq("id", task.id);

      if (error) {
        console.error("Error removing assignee:", error);
        toast({
          title: "Error",
          description: "Failed to remove assignee from task",
          variant: "destructive",
        });
        return;
      }

      setTaskAssignees([]);
      const updatedTask = { ...task, assignee_id: null, assignee: null };
      setTask(updatedTask);
      setEditedTask(updatedTask);

      toast({
        title: "Success",
        description: `${member.full_name} removed from task`,
      });
    } catch (error) {
      console.error("Error removing assignee:", error);
      toast({
        title: "Error",
        description: "Failed to remove assignee from task",
        variant: "destructive",
      });
    }
  };

  // Tag handlers
  const addTagToTask = async (tagId: string) => {
    try {
      const isAlreadyAssigned = task.task_tags?.some(
        (taskTag: any) => taskTag.tag.id === tagId
      );
      if (isAlreadyAssigned) {
        toast({
          title: "Info",
          description: "Tag is already assigned to this task",
        });
        return;
      }

      const { error } = await supabase.from("task_tags").insert({
        task_id: task.id,
        tag_id: tagId,
      });

      if (error) {
        console.error("Error adding tag:", error);
        toast({
          title: "Error",
          description: "Failed to add tag to task",
          variant: "destructive",
        });
        return;
      }

      const { data: updatedTask, error: taskError } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:profiles!tasks_assignee_id_fkey(*),
          status:statuses(*),
          task_tags(tag:tags(*))
        `
        )
        .eq("id", task.id)
        .single();

      if (taskError) {
        console.error("Error reloading task:", taskError);
        return;
      }

      setTask(updatedTask);
      setEditedTask(updatedTask);

      const addedTag = tags.find((tag) => tag.id === tagId);

      if (user && addedTag) {
        await createTaskActivity({
          type: "tag_added",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `added tag "${addedTag.name}"`,
          metadata: {
            tagId: tagId,
            tagName: addedTag.name,
            tagColor: addedTag.color,
          },
        });

        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: `Tag "${addedTag?.name}" added to task`,
      });
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error",
        description: "Failed to add tag to task",
        variant: "destructive",
      });
    }
  };

  const removeTagFromTask = async (tagId: string) => {
    try {
      const removedTag = tags.find((tag) => tag.id === tagId);

      const { error } = await supabase
        .from("task_tags")
        .delete()
        .eq("task_id", task.id)
        .eq("tag_id", tagId);

      if (error) {
        console.error("Error removing tag:", error);
        toast({
          title: "Error",
          description: "Failed to remove tag from task",
          variant: "destructive",
        });
        return;
      }

      const updatedTaskTags =
        task.task_tags?.filter((taskTag: any) => taskTag.tag.id !== tagId) ||
        [];
      const updatedTask = {
        ...task,
        task_tags: updatedTaskTags,
      };
      setTask(updatedTask);
      setEditedTask(updatedTask);

      if (user && removedTag) {
        await createTaskActivity({
          type: "tag_removed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `removed tag "${removedTag.name}"`,
          metadata: {
            tagId: tagId,
            tagName: removedTag.name,
            tagColor: removedTag.color,
          },
        });

        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: `Tag "${removedTag?.name}" removed from task`,
      });
    } catch (error) {
      console.error("Error removing tag:", error);
      toast({
        title: "Error",
        description: "Failed to remove tag from task",
        variant: "destructive",
      });
    }
  };

  const createAndAssignNewTag = async (tagName: string) => {
    if (!tagName.trim()) return;

    try {
      const existingTag = tags.find(
        (tag) =>
          tag.name.toLowerCase() === tagName.trim().toLowerCase() &&
          tag.workspace_id === workspace.id
      );

      if (existingTag) {
        toast({
          title: "Tag already exists",
          description: `A tag named "${tagName.trim()}" already exists in this workspace`,
          variant: "destructive",
        });
        return;
      }

      const { data: existingTags, error: checkError } = await supabase
        .from("tags")
        .select("id, name")
        .eq("workspace_id", workspace.id)
        .ilike("name", tagName.trim());

      if (checkError) {
        console.error("Error checking existing tags:", checkError);
        toast({
          title: "Error",
          description: "Failed to check for existing tags",
          variant: "destructive",
        });
        return;
      }

      if (existingTags && existingTags.length > 0) {
        toast({
          title: "Tag already exists",
          description: `A tag named "${tagName.trim()}" already exists in this workspace`,
          variant: "destructive",
        });
        return;
      }

      const tagId = generateTagId();
      const randomColor = getRandomTagColor();

      const { data: newTag, error: tagError } = await supabase
        .from("tags")
        .insert({
          tag_id: tagId,
          name: tagName.trim(),
          color: randomColor,
          workspace_id: workspace.id,
        })
        .select()
        .single();

      if (tagError) {
        console.error("Error creating tag:", tagError);
        if (tagError.code === "23505") {
          toast({
            title: "Tag already exists",
            description: `A tag named "${tagName.trim()}" already exists in this workspace`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create new tag",
            variant: "destructive",
          });
        }
        return;
      }

      const { error: assignError } = await supabase.from("task_tags").insert({
        task_id: task.id,
        tag_id: newTag.id,
      });

      if (assignError) {
        console.error("Error assigning new tag:", assignError);
        toast({
          title: "Error",
          description: "Failed to assign new tag to task",
          variant: "destructive",
        });
        return;
      }

      const { data: updatedTask, error: taskError } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:profiles!tasks_assignee_id_fkey(*),
          status:statuses(*),
          task_tags(tag:tags(*))
        `
        )
        .eq("id", task.id)
        .single();

      if (taskError) {
        console.error("Error reloading task:", taskError);
        return;
      }

      setTask(updatedTask);
      setEditedTask(updatedTask);

      const addedTag = tags.find((tag) => tag.id === tagId);

      if (user && addedTag) {
        await createTaskActivity({
          type: "tag_added",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project?.id,
          description: `added tag "${addedTag.name}"`,
          metadata: {
            tagId: tagId,
            tagName: addedTag.name,
            tagColor: addedTag.color,
          },
        });

        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: `Created and assigned tag "${tagName}"`,
      });
    } catch (error) {
      console.error("Error creating and assigning tag:", error);
      toast({
        title: "Error",
        description: "Failed to create and assign new tag",
        variant: "destructive",
      });
    }
  };

  // Activity handlers
  const handleSendComment = async () => {
    if (!commentText.trim() || !user) return;

    setIsSubmittingComment(true);
    try {
      await createTaskActivity({
        type: "comment_added",
        taskId: task.id,
        taskName: task.name,
        userId: user.id,
        workspaceId: workspace.id,
        spaceId: space.id,
        projectId: project?.id,
        description: `commented: ${commentText.trim()}`,
        metadata: {
          comment: commentText.trim(),
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
              entityId: task.id,
              entityName: task.name,
              eventType: "commented",
              description: `Commented on task "${
                task.name
              }": ${commentText.trim()}`,
              metadata: {
                projectName: project?.name,
                spaceName: space.name,
                comment: commentText.trim(),
                userName: user.user_metadata?.full_name || user.email,
                statusName: statuses.find((s) => s.id === task.status_id)?.name,
                priority: task.priority,
                assigneeName: task.assignee?.full_name,
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

      setCommentText("");
      await loadTaskActivities();

      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Other handlers
  const handleBack = () => {
    router.back();
  };

  const handleMoveTask = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Move task feature will be available soon",
    });
  };

  const completedSubtasks = subtasks.filter((st) => {
    const completedStatus = getCompletedStatus(statuses);
    return st.status_id === completedStatus?.id;
  }).length;

  return (
    <div className="flex flex-col h-full workspace-header-bg">
      {/* Header */}
      <TaskHeader
        task={task}
        workspace={workspace}
        space={space}
        project={project}
        sprint={sprint}
        onBack={handleBack}
        onEditTaskName={handleEditTaskName}
        onMoveTask={handleMoveTask}
        onDuplicateTask={handleDuplicateTask}
        onCopyLink={handleCopyLink}
        onCopyId={handleCopyId}
        onDeleteTask={() => setShowDeleteTaskDialog(true)}
      />

      <div className="flex h-[calc(100vh-130px)] workspace-header-bg">
        {/* Left Sidebar - Properties */}
        <TaskProperties
          task={task}
          statuses={statuses}
          tags={tags}
          workspaceMembers={workspaceMembers}
          taskAssignees={taskAssignees}
          workspace={workspace}
          project={project}
          sprint={sprint}
          space={space}
          loading={isLoading}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePriority={handleUpdatePriority}
          onUpdateStartDate={handleUpdateStartDate}
          onUpdateDueDate={handleUpdateDueDate}
          onUpdateTimeEstimate={handleUpdateTimeEstimate}
          onAddAssignee={addAssignee}
          onRemoveAssignee={removeAssignee}
          onAddTag={addTagToTask}
          onRemoveTag={removeTagFromTask}
          onCreateAndAssignTag={createAndAssignNewTag}
        />

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Task Description and Content */}
          <TaskDescription
            task={task}
            editedDescription={editedDescription}
            isEditingDescription={isEditingDescription}
            isEditingTaskName={isEditingTaskName}
            editedTaskName={editedTaskName}
            loading={isLoading}
            onStartEdit={handleStartEditDescription}
            onSave={handleSaveDescription}
            onCancel={handleCancelDescription}
            onDescriptionChange={setEditedDescription}
            onEditTaskName={handleEditTaskName}
            onSaveTaskName={handleSaveTaskName}
            onCancelTaskName={handleCancelTaskName}
            onTaskNameChange={setEditedTaskName}
          >
            {/* Subtasks */}
            <SubtasksList
              subtasks={subtasks}
              statuses={statuses}
              workspaceMembers={workspaceMembers}
              workspace={workspace}
              completedSubtasks={completedSubtasks}
              isAddingSubtask={isAddingSubtask}
              newSubtaskName={newSubtaskName}
              loading={isLoading}
              deleteDialogOpen={deleteDialogOpen}
              onAddSubtask={() => setIsAddingSubtask(true)}
              onToggleAddSubtask={setIsAddingSubtask}
              onNewSubtaskNameChange={setNewSubtaskName}
              onHandleAddSubtask={handleAddSubtask}
              onToggleSubtaskComplete={toggleSubtaskComplete}
              onDeleteSubtask={deleteSubtask}
              onUpdateSubtaskAssignee={updateSubtaskAssignee}
              onUpdateSubtaskPriority={updateSubtaskPriority}
              onUpdateSubtaskDueDate={updateSubtaskDueDate}
              onSetDeleteDialogOpen={setDeleteDialogOpen}
            />
          </TaskDescription>

          {/* Right Activity Sidebar */}
          <TaskActivity
            activities={activities}
            workspace={workspace}
            user={user}
            commentText={commentText}
            isSubmittingComment={isSubmittingComment}
            activitySearchValue={activitySearchValue}
            showActivitySearch={showActivitySearch}
            onCommentChange={setCommentText}
            onSendComment={handleSendComment}
            onSearchChange={setActivitySearchValue}
            onToggleSearch={() => setShowActivitySearch(!showActivitySearch)}
          />
        </div>
      </div>

      {/* Delete Task Dialog */}
      <Dialog
        open={showDeleteTaskDialog}
        onOpenChange={(open) => setShowDeleteTaskDialog(open)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{task.name}"? This will also
              delete all subtasks and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteTaskDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleDeleteTask();
                setShowDeleteTaskDialog(false);
              }}
            >
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
