"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextEditor } from "@/components/ui/text-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  CalendarIcon,
  Plus,
  MoreHorizontal,
  CheckSquare,
  Square,
  Trash2,
  Flag,
  CircleUserRound,
  Command as CommandIcon,
  CheckIcon,
  Edit,
  CircleDot,
  Users,
  Clock,
  Tag,
  Globe,
  Building2,
  SquareCheck,
  SquareCheckBig,
  Hash,
  SendHorizonal,
  Loader2,
  Brain,
  GitBranch,
  Search,
  Copy,
  Link,
  Move,
  Files,
  Goal,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type {
  Workspace,
  Space,
  Project,
  Task,
  Status,
  Tag as TagType,
} from "@/lib/database.types";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { priorityConfig } from "./project/types";
import { getAvatarInitials } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { createTaskActivity, getTaskActivities } from "@/lib/events";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TaskDetailViewProps {
  task: Task;
  workspace: Workspace;
  space: Space;
  project: Project;
  statuses: Status[];
  tags: TagType[];
}

const colorMap: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  gray: "bg-gray-500",
  orange: "bg-orange-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
};

const tagColorClasses: Record<string, string> = {
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  purple: "bg-purple-100 text-purple-800",
  pink: "bg-pink-100 text-pink-800",
  gray: "bg-gray-100 text-gray-800",
  orange: "bg-orange-100 text-orange-800",
  indigo: "bg-indigo-100 text-indigo-800",
  teal: "bg-teal-100 text-teal-800",
};

export default function TaskDetailView({
  task: initialTask,
  workspace,
  space,
  project,
  statuses,
  tags,
}: TaskDetailViewProps) {
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [editedDescription, setEditedDescription] = useState(
    task.description || ""
  );
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [taskAssignees, setTaskAssignees] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [showActivitySearch, setShowActivitySearch] = useState(false);

  // State for tag search input
  const [tagSearchValue, setTagSearchValue] = useState("");

  // State for activity search
  const [activitySearchValue, setActivitySearchValue] = useState("");

  // State for subtask delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  // State for comment input
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // State for task name editing
  const [isEditingTaskName, setIsEditingTaskName] = useState(false);
  const [editedTaskName, setEditedTaskName] = useState(task.name);

  // State for task delete dialog
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);

  const supabase = createClientSupabaseClient();
  const router = useRouter();
  const { toast } = useEnhancedToast();
  const { user } = useAuth();

  // Filter activities based on search
  const filteredActivities = activities.filter((activity) => {
    if (!activitySearchValue.trim()) return true;

    const searchTerm = activitySearchValue.toLowerCase();
    const userName = activity.user?.full_name?.toLowerCase() || "";
    const description = activity.description?.toLowerCase() || "";
    const comment = activity.metadata?.comment?.toLowerCase() || "";

    return (
      userName.includes(searchTerm) ||
      description.includes(searchTerm) ||
      comment.includes(searchTerm)
    );
  });

  // Load subtasks, workspace members, task assignees, and activities
  useEffect(() => {
    console.log("Task detail view loaded with:", {
      taskId: task.id,
      statusesCount: statuses.length,
      statuses: statuses.map((s) => ({ id: s.id, name: s.name })),
      workspace: { id: workspace.id, name: workspace.name },
      project: { id: project.id, name: project.name },
      space: { id: space.id, name: space.name },
    });

    loadSubtasks();
    loadWorkspaceMembers();
    loadTaskAssignees();
    loadTaskActivities();
  }, [task.id]);

  // Update assignees when task changes
  useEffect(() => {
    loadTaskAssignees();
  }, [task.assignee_id, task.assignee]);

  // Update edited description when task changes
  useEffect(() => {
    setEditedDescription(task.description || "");
  }, [task.description]);

  // Update edited task name when task changes
  useEffect(() => {
    setEditedTaskName(task.name);
  }, [task.name]);

  // Ensure editedDescription is set when switching to edit mode
  useEffect(() => {
    if (isEditingDescription && !editedDescription && task.description) {
      setEditedDescription(task.description);
    }
  }, [isEditingDescription, editedDescription, task.description]);

  const loadSubtasks = async () => {
    if (!task.id) {
      console.error("❌ Task ID is missing:", task.id);
      return;
    }

    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("❌ Auth error:", authError);
        return;
      }

      if (!user) {
        console.error("❌ No authenticated user");
        return;
      }

      // Now directly try the corrected full query with specific foreign key relationships
      const { data: subtasksData, error } = await supabase
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
        .eq("parent_task_id", task.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Query failed:", error);
        return;
      }

      setSubtasks(subtasksData || []);
    } catch (exception) {
      console.error("💥 Exception caught:", {
        message: exception instanceof Error ? exception.message : "Unknown",
        stack: exception instanceof Error ? exception.stack : "No stack",
        type: typeof exception,
      });
    }
  };

  const loadWorkspaceMembers = async () => {
    try {
      // First get workspace members
      const { data: members, error: membersError } = await supabase
        .from("workspace_members")
        .select("id, user_id, email, role")
        .eq("workspace_id", workspace.id)
        .eq("status", "active");

      if (membersError) {
        console.error("Error loading workspace members:", membersError);
        return;
      }

      if (!members || members.length === 0) {
        setWorkspaceMembers([]);
        return;
      }

      // Then get profiles for these members
      const userIds = members.map((m) => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        // Still set members without profiles
        const membersWithoutProfiles = members.map((member) => ({
          id: member.user_id,
          full_name: "Unknown User",
          email: member.email || "",
          avatar_url: null,
        }));
        setWorkspaceMembers(membersWithoutProfiles);
        return;
      }

      // Combine members with their profiles
      const formattedMembers = members.map((member) => {
        const profile = profiles?.find((p) => p.id === member.user_id);
        return {
          id: member.user_id,
          full_name: profile?.full_name || "Unknown User",
          email: profile?.email || member.email || "",
          avatar_url: profile?.avatar_url || null,
        };
      });

      setWorkspaceMembers(formattedMembers);
    } catch (error) {
      console.error("Exception in loadWorkspaceMembers:", error);
    }
  };

  const loadTaskAssignees = async () => {
    try {
      // For now, we'll use the existing single assignee system
      // In the future, this could be expanded to use a task_assignees table
      if (task.assignee_id && task.assignee) {
        setTaskAssignees([task.assignee]);
      } else {
        setTaskAssignees([]);
      }
    } catch (error) {
      console.error("Error loading task assignees:", error);
    }
  };

  const loadTaskActivities = async () => {
    try {
      const activitiesData = await getTaskActivities(task.id, workspace.id);
      setActivities(activitiesData || []);
    } catch (error) {
      console.error("Error loading task activities:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          name: editedTask.name,
          description: editedTask.description,
          status_id: editedTask.status_id,
          priority: editedTask.priority,
          due_date: editedTask.due_date,
          start_date: editedTask.start_date,
        })
        .eq("id", task.id);

      if (error) {
        console.error("Error updating task:", error);
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive",
        });
        return;
      }

      setTask(editedTask);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  const handleSaveDescription = async () => {
    setLoading(true);
    try {
      const oldDescription = task.description;

      const { error } = await supabase
        .from("tasks")
        .update({
          description: editedDescription,
        })
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

      // Create activity log
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
          projectId: project.id,
          description: activityDescription,
          metadata: {
            oldValue: oldDescription,
            newValue: editedDescription,
          },
        });

        // Reload activities
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

  const handleStartEditDescription = () => {
    // Ensure we have the latest content before switching to edit mode
    const currentDescription = task.description || "";
    setEditedDescription(currentDescription);
    setIsEditingDescription(true);
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim()) return;

    setLoading(true);
    try {
      // Validate required data
      if (!statuses || statuses.length === 0) {
        console.error("No statuses available for subtask creation");
        toast({
          title: "Error",
          description: "No statuses available. Please try refreshing the page.",
          variant: "destructive",
        });
        return;
      }

      // Generate subtask ID
      const subtaskId = `t${Math.floor(Math.random() * 1000000000000)
        .toString()
        .padStart(12, "0")}`;

      console.log("Creating subtask with data:", {
        task_id: subtaskId,
        name: newSubtaskName,
        project_id: task.project_id,
        space_id: task.space_id,
        workspace_id: task.workspace_id,
        parent_task_id: task.id,
        status_id: statuses[0].id,
        priority: "medium",
      });

      const { data: newSubtask, error } = await supabase
        .from("tasks")
        .insert({
          task_id: subtaskId,
          name: newSubtaskName,
          project_id: task.project_id,
          space_id: task.space_id,
          workspace_id: task.workspace_id,
          parent_task_id: task.id,
          status_id: statuses[0].id, // Use first status
          priority: "medium",
        })
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
        .single();

      if (error) {
        console.error("Error creating subtask:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        toast({
          title: "Error",
          description: error.message || "Failed to create subtask",
          variant: "destructive",
        });
        return;
      }

      if (!newSubtask) {
        console.error("No subtask data returned from insert");
        toast({
          title: "Error",
          description: "Failed to create subtask - no data returned",
          variant: "destructive",
        });
        return;
      }

      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskName("");
      setIsAddingSubtask(false);

      // Create activity log
      if (user) {
        await createTaskActivity({
          type: "subtask_created",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `created subtask "${newSubtaskName}"`,
          metadata: {
            subtaskId: newSubtask.id,
            subtaskName: newSubtaskName,
          },
        });

        // Reload activities
        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: "Subtask created successfully",
      });
    } catch (error) {
      console.error("Exception in handleAddSubtask:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack"
      );
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
    // Find a "completed" status or use the last status as completed
    const completedStatus =
      statuses.find(
        (s) =>
          s.name.toLowerCase().includes("done") ||
          s.name.toLowerCase().includes("complete")
      ) || statuses[statuses.length - 1];
    const todoStatus = statuses[0];

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
          st.id === subtask.id ? { ...st, status_id: newStatusId } : st
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

      // Create activity log
      if (user && subtaskToDelete) {
        await createTaskActivity({
          type: "subtask_created", // Using existing type since there's no delete type
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `deleted subtask "${subtaskToDelete.name}"`,
          metadata: {
            subtaskId: subtaskId,
            subtaskName: subtaskToDelete.name,
            action: "deleted",
          },
        });

        // Reload activities
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

      // Update local state
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

      // Create activity log
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
          projectId: project.id,
          description: `changed assignee from ${oldAssigneeName} to ${newAssigneeName}`,
          metadata: {
            oldValue: oldAssigneeName,
            newValue: newAssigneeName,
            subtaskId: subtaskId,
            subtaskName: oldSubtask.name,
          },
        });

        // Reload activities
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

      // Update local state
      const oldSubtask = subtasks.find((st) => st.id === subtaskId);
      setSubtasks(
        subtasks.map((st) =>
          st.id === subtaskId ? { ...st, priority: priority || "medium" } : st
        )
      );

      // Create activity log
      if (user && oldSubtask) {
        const oldPriorityLabel = oldSubtask.priority
          ? priorityConfig[oldSubtask.priority as keyof typeof priorityConfig]
              ?.label
          : "No priority";
        const newPriorityLabel = priority
          ? priorityConfig[priority as keyof typeof priorityConfig]?.label
          : "No priority";

        await createTaskActivity({
          type: "priority_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `changed subtask "${oldSubtask.name}" priority from ${oldPriorityLabel} to ${newPriorityLabel}`,
          metadata: {
            subtaskId: subtaskId,
            subtaskName: oldSubtask.name,
            oldValue: oldSubtask.priority,
            newValue: priority || null,
          },
        });

        // Reload activities
        loadTaskActivities();
      }

      const priorityLabel = priority
        ? priorityConfig[priority as keyof typeof priorityConfig]?.label
        : "No priority";

      toast({
        title: "Success",
        description: `Subtask priority updated to ${priorityLabel}`,
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

      // Update local state
      const oldSubtask = subtasks.find((st) => st.id === subtaskId);
      setSubtasks(
        subtasks.map((st) =>
          st.id === subtaskId
            ? { ...st, due_date: date ? date.toISOString() : null }
            : st
        )
      );

      // Create activity log
      if (user && oldSubtask) {
        const oldDate = oldSubtask.due_date
          ? format(parseISO(oldSubtask.due_date), "MMM d, yyyy")
          : "No due date";
        const newDate = date ? format(date, "MMM d, yyyy") : "No due date";

        await createTaskActivity({
          type: "due_date_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `changed subtask "${oldSubtask.name}" due date from ${oldDate} to ${newDate}`,
          metadata: {
            subtaskId: subtaskId,
            subtaskName: oldSubtask.name,
            oldValue: oldSubtask.due_date,
            newValue: date ? date.toISOString() : null,
          },
        });

        // Reload activities
        loadTaskActivities();
      }

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

  const getStatusColor = (status: Status) => {
    return colorMap[status.color] || "bg-gray-500";
  };

  const handleBack = () => {
    router.back();
  };

  const completedSubtasks = subtasks.filter((st) => {
    const completedStatus =
      statuses.find(
        (s) =>
          s.name.toLowerCase().includes("done") ||
          s.name.toLowerCase().includes("complete")
      ) || statuses[statuses.length - 1];
    return st.status_id === completedStatus?.id;
  }).length;

  const handleUpdateStartDate = async (date: Date | undefined) => {
    setLoading(true);
    try {
      const oldStartDate = task.start_date;

      const { error } = await supabase
        .from("tasks")
        .update({
          start_date: date ? date.toISOString() : null,
        })
        .eq("id", task.id);

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
        ...task,
        start_date: date ? date.toISOString() : null,
      };
      setTask(updatedTask);
      setEditedTask(updatedTask);
      setStartDateOpen(false);

      // Create activity log
      if (user) {
        const oldDate = oldStartDate
          ? format(parseISO(oldStartDate), "MMM d, yyyy")
          : "None";
        const newDate = date ? format(date, "MMM d, yyyy") : "None";

        await createTaskActivity({
          type: "start_date_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `changed start date from ${oldDate} to ${newDate}`,
          metadata: {
            oldValue: oldStartDate,
            newValue: date ? date.toISOString() : null,
          },
        });

        // Reload activities
        loadTaskActivities();
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
      const oldDueDate = task.due_date;

      const { error } = await supabase
        .from("tasks")
        .update({
          due_date: date ? date.toISOString() : null,
        })
        .eq("id", task.id);

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
        ...task,
        due_date: date ? date.toISOString() : null,
      };
      setTask(updatedTask);
      setEditedTask(updatedTask);
      setDueDateOpen(false);

      // Create activity log
      if (user) {
        const oldDate = oldDueDate
          ? format(parseISO(oldDueDate), "MMM d, yyyy")
          : "None";
        const newDate = date ? format(date, "MMM d, yyyy") : "None";

        await createTaskActivity({
          type: "due_date_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `changed due date from ${oldDate} to ${newDate}`,
          metadata: {
            oldValue: oldDueDate,
            newValue: date ? date.toISOString() : null,
          },
        });

        // Reload activities
        loadTaskActivities();
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

  const handleUpdateStatus = async (statusId: string) => {
    setLoading(true);
    try {
      const oldStatus = task.status;

      const { error } = await supabase
        .from("tasks")
        .update({
          status_id: statusId,
        })
        .eq("id", task.id);

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
        ...task,
        status_id: statusId,
        status: updatedStatus || task.status,
      };
      setTask(updatedTask);
      setEditedTask(updatedTask);

      // Create activity log
      if (user) {
        const oldStatusName = oldStatus?.name || "None";
        const newStatusName = updatedStatus?.name || "Unknown";

        await createTaskActivity({
          type: "status_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `changed status from ${oldStatusName} to ${newStatusName}`,
          metadata: {
            oldValue: oldStatus?.name,
            newValue: newStatusName,
            oldStatusId: task.status_id,
            newStatusId: statusId,
          },
        });

        // Reload activities
        loadTaskActivities();
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
      const oldPriority = task.priority;

      const { error } = await supabase
        .from("tasks")
        .update({
          priority: priority || null,
        })
        .eq("id", task.id);

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
        ...task,
        priority: priority || "medium",
      } as Task;
      setTask(updatedTask);
      setEditedTask(updatedTask);

      const priorityLabel = priority
        ? priorityConfig[priority as keyof typeof priorityConfig]?.label
        : "No priority";

      // Create activity log
      if (user) {
        const oldPriorityLabel = oldPriority
          ? priorityConfig[oldPriority as keyof typeof priorityConfig]?.label
          : "No priority";

        await createTaskActivity({
          type: "priority_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `changed priority from ${oldPriorityLabel} to ${priorityLabel}`,
          metadata: {
            oldValue: oldPriority,
            newValue: priority || null,
          },
        });

        // Reload activities
        loadTaskActivities();
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

  const addAssignee = async (memberId: string) => {
    try {
      const member = workspaceMembers.find((m) => m.id === memberId);
      if (!member) return;

      // Check if already assigned
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

      // For single assignee system, replace the current assignee
      // In future, this would add to a task_assignees table
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

      // Update local state
      setTaskAssignees([member]); // Replace for single assignee
      const updatedTask = { ...task, assignee_id: memberId, assignee: member };
      setTask(updatedTask);
      setEditedTask(updatedTask);

      // Create activity log
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
          projectId: project.id,
          description: `changed assignee from ${oldAssigneeName} to ${newAssigneeName}`,
          metadata: {
            oldValue: oldAssignee?.full_name,
            newValue: member.full_name,
            oldAssigneeId: task.assignee_id,
            newAssigneeId: memberId,
          },
        });

        // Reload activities
        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: `${member.full_name} assigned to task`,
        browserNotificationTitle: "Task assigned",
        browserNotificationBody: `${member.full_name} has been assigned to the task.`,
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

      // Remove from task
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

      // Update local state
      setTaskAssignees([]);
      const updatedTask = { ...task, assignee_id: null, assignee: null };
      setTask(updatedTask);
      setEditedTask(updatedTask);

      toast({
        title: "Success",
        description: `${member.full_name} removed from task`,
        browserNotificationTitle: "Task unassigned",
        browserNotificationBody: `${member.full_name} has been removed from the task.`,
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

  const onAssignTask = async (taskId: string, assigneeId: string | null) => {
    if (assigneeId) {
      await addAssignee(assigneeId);
    } else {
      // Remove all assignees (for single assignee system)
      if (taskAssignees.length > 0) {
        await removeAssignee(taskAssignees[0].id);
      }
    }
  };

  const addTagToTask = async (tagId: string) => {
    try {
      // Check if tag is already assigned
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

      // Reload the task to get updated tags
      const { data: updatedTask, error: taskError } = await supabase
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
        .eq("id", task.id)
        .single();

      if (taskError) {
        console.error("Error reloading task:", taskError);
        return;
      }

      setTask(updatedTask);
      setEditedTask(updatedTask);

      const addedTag = tags.find((tag) => tag.id === tagId);

      // Create activity log
      if (user && addedTag) {
        await createTaskActivity({
          type: "tag_added",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `added tag "${addedTag.name}"`,
          metadata: {
            tagId: tagId,
            tagName: addedTag.name,
            tagColor: addedTag.color,
          },
        });

        // Reload activities
        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: `Tag "${addedTag?.name}" added to task`,
        browserNotificationTitle: "Tag added",
        browserNotificationBody: `Tag "${addedTag?.name}" has been added to the task.`,
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

      // Update local state
      const updatedTaskTags =
        task.task_tags?.filter((taskTag: any) => taskTag.tag.id !== tagId) ||
        [];
      const updatedTask = {
        ...task,
        task_tags: updatedTaskTags,
      };
      setTask(updatedTask);
      setEditedTask(updatedTask);

      // Create activity log
      if (user && removedTag) {
        await createTaskActivity({
          type: "tag_removed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `removed tag "${removedTag.name}"`,
          metadata: {
            tagId: tagId,
            tagName: removedTag.name,
            tagColor: removedTag.color,
          },
        });

        // Reload activities
        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: `Tag "${removedTag?.name}" removed from task`,
        browserNotificationTitle: "Tag removed",
        browserNotificationBody: `Tag "${removedTag?.name}" has been removed from the task.`,
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

  const handleUpdateTimeEstimate = async (timeEstimate: string) => {
    setLoading(true);
    try {
      const oldTimeEstimate = (task as any).time_estimate;

      const { error } = await supabase
        .from("tasks")
        .update({
          time_estimate: timeEstimate || null,
        })
        .eq("id", task.id);

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
        ...task,
        time_estimate: timeEstimate || null,
      } as Task;
      setTask(updatedTask);
      setEditedTask(updatedTask);

      // Create activity log
      if (user) {
        const oldValue = oldTimeEstimate || "None";
        const newValue = timeEstimate || "None";

        await createTaskActivity({
          type: "time_estimate_changed",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `changed time estimate from ${oldValue} to ${newValue}`,
          metadata: {
            oldValue: oldTimeEstimate,
            newValue: timeEstimate || null,
          },
        });

        // Reload activities
        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: timeEstimate
          ? `Time estimate set to ${timeEstimate}`
          : "Time estimate cleared",
        browserNotificationTitle: "Time estimate updated",
        browserNotificationBody: timeEstimate
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

  const createAndAssignNewTag = async (tagName: string) => {
    if (!tagName.trim()) return;

    try {
      // Check if tag with same name already exists in workspace (case-insensitive)
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

      // Double-check by querying database for existing tags
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

      // Generate tag ID
      const tagId = `tag${Math.floor(Math.random() * 1000000000000)
        .toString()
        .padStart(12, "0")}`;

      // Available colors for tags
      const availableColors = [
        "red",
        "blue",
        "green",
        "yellow",
        "purple",
        "pink",
        "gray",
        "orange",
        "indigo",
        "teal",
      ];

      // Get a random color
      const randomColor =
        availableColors[Math.floor(Math.random() * availableColors.length)];

      // Create new tag (tags are workspace-level, not project-level)
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

        // Check if it's a duplicate error
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

      // Assign the new tag to the current task
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

      // Reload the task to get updated tags
      const { data: updatedTask, error: taskError } = await supabase
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
        .eq("id", task.id)
        .single();

      if (taskError) {
        console.error("Error reloading task:", taskError);
        return;
      }

      setTask(updatedTask);
      setEditedTask(updatedTask);

      const addedTag = tags.find((tag) => tag.id === tagId);

      // Create activity log
      if (user && addedTag) {
        await createTaskActivity({
          type: "tag_added",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `added tag "${addedTag.name}"`,
          metadata: {
            tagId: tagId,
            tagName: addedTag.name,
            tagColor: addedTag.color,
          },
        });

        // Reload activities
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
        projectId: project.id,
        description: `commented: ${commentText.trim()}`,
        metadata: {
          comment: commentText.trim(),
        },
      });

      // Clear the comment input
      setCommentText("");

      // Reload activities to show the new comment
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

  // Task actions handlers
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

      // Create activity log
      if (user) {
        await createTaskActivity({
          type: "description_changed",
          taskId: task.id,
          taskName: editedTaskName.trim(),
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `changed task name from "${oldName}" to "${editedTaskName.trim()}"`,
          metadata: {
            oldValue: oldName,
            newValue: editedTaskName.trim(),
            changeType: "name",
          },
        });

        // Reload activities
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

  const handleMoveTask = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Move task feature will be available soon",
    });
  };

  const handleDuplicateTask = async () => {
    try {
      // Generate new task ID
      const newTaskId = `t${Math.floor(Math.random() * 1000000000000)
        .toString()
        .padStart(12, "0")}`;

      const { data: duplicatedTask, error } = await supabase
        .from("tasks")
        .insert({
          task_id: newTaskId,
          name: `${task.name} (Copy)`,
          description: task.description,
          project_id: task.project_id,
          space_id: task.space_id,
          workspace_id: task.workspace_id,
          status_id: statuses[0]?.id, // Use first status for duplicated task
          priority: task.priority,
          due_date: task.due_date,
          start_date: task.start_date,
          assignee_id: task.assignee_id,
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
      if (task.task_tags && task.task_tags.length > 0) {
        const tagInserts = task.task_tags.map((taskTag: any) => ({
          task_id: duplicatedTask.id,
          tag_id: taskTag.tag.id,
        }));

        await supabase.from("task_tags").insert(tagInserts);
      }

      // Create activity log
      if (user) {
        await createTaskActivity({
          type: "subtask_created",
          taskId: task.id,
          taskName: task.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space.id,
          projectId: project.id,
          description: `duplicated task as "${duplicatedTask.name}"`,
          metadata: {
            duplicatedTaskId: duplicatedTask.id,
            duplicatedTaskName: duplicatedTask.name,
          },
        });

        // Reload activities
        loadTaskActivities();
      }

      toast({
        title: "Success",
        description: "Task duplicated successfully",
      });

      // Navigate to the duplicated task
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

  const handleCopyLink = async () => {
    try {
      const taskUrl = `${window.location.origin}/${workspace.workspace_id}/task/${task.task_id}`;
      await navigator.clipboard.writeText(taskUrl);
      toast({
        title: "Success",
        description: "Task link copied to clipboard",
      });
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
      await navigator.clipboard.writeText(task.task_id);
      toast({
        title: "Success",
        description: "Task ID copied to clipboard",
      });
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
      // First delete all subtasks
      if (subtasks.length > 0) {
        const { error: subtaskError } = await supabase
          .from("tasks")
          .delete()
          .eq("parent_task_id", task.id);

        if (subtaskError) {
          console.error("Error deleting subtasks:", subtaskError);
          toast({
            title: "Error",
            description: "Failed to delete subtasks",
            variant: "destructive",
          });
          return;
        }
      }

      // Delete task tags
      const { error: tagError } = await supabase
        .from("task_tags")
        .delete()
        .eq("task_id", task.id);

      if (tagError) {
        console.error("Error deleting task tags:", tagError);
      }

      // Delete the task
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);

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

      // Navigate back to project
      router.push(`/${workspace.workspace_id}/project/${project.project_id}`);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  return (
    // <div className="min-h-screen bg-gray-50">
    <div className="flex flex-col h-full workspace-header-bg">
      {/* Header */}
      <div className="workspace-header-bg border-b workspace-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="bg-transparent workspace-sidebar-text hover:bg-transparent text-xs p-0 h-6 mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-xs workspace-sidebar-text">
              <button
                onClick={() => router.push(`/${workspace.workspace_id}/home`)}
                className="p-1 -m-1 rounded transition-colors hover:workspace-text"
              >
                <Building2 className="w-4 h-4 inline-block mr-1" />
                {workspace.name}
              </button>
              {" / "}
              <button
                onClick={() =>
                  router.push(
                    `/${workspace.workspace_id}/space/${space.space_id}/project/${project.project_id}`
                  )
                }
                className="p-1 -m-1 rounded transition-colors hover:workspace-text"
              >
                <Globe className="w-4 h-4 inline-block mr-1" />
                {space.name}
              </button>
              {" / "}
              <button
                onClick={() =>
                  router.push(
                    `/${workspace.workspace_id}/space/${space.space_id}/project/${project.project_id}`
                  )
                }
                className="p-1 -m-1 rounded transition-colors hover:workspace-text"
              >
                <Hash className="w-4 h-4 inline-block mr-1" />
                {project.name}
              </button>
            </div>
          </div>

          {/* Task Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="workspace-sidebar-text hover:workspace-hover h-6 w-6 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEditTaskName}>
                <Edit className="h-4 w-4 mr-2" />
                Edit task name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMoveTask}>
                <Move className="h-4 w-4 mr-2" />
                Move
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicateTask}>
                <Files className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyId}>
                <Copy className="h-4 w-4 mr-2" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteTaskDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex h-[calc(100vh-130px)] workspace-header-bg">
        {/* Left Sidebar - Properties */}
        <div className="w-72 workspace-header-bg border-r workspace-border p-3 overflow-y-auto">
          {/* Status */}
          <div className="flex items-center mb-3">
            <span className="text-sm font-medium workspace-sidebar-text mb-4">
              Details
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="mb-3">
              <div className="flex items-center mb-3 gap-2">
                <CircleDot className="w-4 h-4 workspace-sidebar-text" />
                <label className="text-xs font-medium workspace-sidebar-text uppercase">
                  Status
                </label>
              </div>
              <Select
                value={editedTask.status_id}
                onValueChange={(value) => handleUpdateStatus(value)}
                disabled={loading}
              >
                <SelectTrigger className="h-8 workspace-header-bg border border-transparent hover:workspace-hover">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="workspace-header-bg">
                  {statuses.map((status) => (
                    <SelectItem
                      key={status.id}
                      value={status.id}
                      className="hover:workspace-hover cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(
                            status
                          )}`}
                        />
                        <span className="text-xs truncate">{status.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-3">
              <div className="flex items-center mb-3 gap-2">
                <Goal className="w-4 h-4 workspace-sidebar-text" />
                <label className="text-xs font-medium workspace-sidebar-text uppercase">
                  Priority
                </label>
              </div>
              <Select
                value={task.priority || "none"}
                onValueChange={(value) =>
                  handleUpdatePriority(value === "none" ? "" : value)
                }
                disabled={loading}
              >
                <SelectTrigger className="h-8 workspace-header-bg border border-transparent hover:workspace-hover">
                  <SelectValue>
                    {task.priority ? (
                      <div className="flex items-center gap-2">
                        <Goal
                          className={`w-4 h-4 ${
                            priorityConfig[
                              task.priority as keyof typeof priorityConfig
                            ]?.color
                          }`}
                        />
                        <span className="text-xs">
                          {
                            priorityConfig[
                              task.priority as keyof typeof priorityConfig
                            ]?.label
                          }
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No priority</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="workspace-header-bg">
                  <SelectItem
                    value="none"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <span className="text-xs text-gray-500">No priority</span>
                  </SelectItem>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="hover:workspace-hover cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Goal className={`w-4 h-4 ${config.color}`} />
                        <span className="text-xs">{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Dates */}
            <div className="mb-3">
              <div className="flex items-center mb-3 gap-2">
                <CalendarIcon className="w-4 h-4 workspace-sidebar-text" />
                <label className="text-xs font-medium workspace-sidebar-text uppercase">
                  Start Date
                </label>
              </div>
              <div className="space-y-2">
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-8 p-2 text-xs workspace-sidebar-text hover:workspace-hover border border-transparent"
                    >
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="workspace-sidebar-text">
                        {task.start_date
                          ? format(parseISO(task.start_date), "MMM d")
                          : "Set start date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        task.start_date ? parseISO(task.start_date) : undefined
                      }
                      onSelect={handleUpdateStartDate}
                      disabled={loading}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex items-center mb-3 gap-2">
                <CalendarIcon className="w-4 h-4 workspace-sidebar-text" />
                <label className="text-xs font-medium workspace-sidebar-text uppercase">
                  Due Date
                </label>
              </div>
              <div className="space-y-2">
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-8 p-2 text-xs workspace-sidebar-text hover:workspace-hover border border-transparent"
                    >
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="workspace-sidebar-text">
                        {task.due_date
                          ? format(parseISO(task.due_date), "MMM d")
                          : "Set due date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        task.due_date ? parseISO(task.due_date) : undefined
                      }
                      onSelect={handleUpdateDueDate}
                      disabled={loading}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Assignees */}
            <div className="mb-6">
              <div className="flex items-center mb-3 gap-2">
                <Users className="w-4 h-4 workspace-sidebar-text" />
                <label className="text-xs font-medium workspace-sidebar-text uppercase">
                  Assignees
                </label>
              </div>

              {/* Display current assignees */}
              <div className="space-y-2">
                {taskAssignees.length > 0 ? (
                  <div className="space-y-1">
                    {taskAssignees.map((assignee) => (
                      <div
                        key={assignee.id}
                        className="flex items-center justify-between"
                      >
                        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                          <Avatar className="h-6 w-6 relative group">
                            <AvatarImage
                              src={assignee.avatar_url ?? undefined}
                              alt={assignee.full_name || "User"}
                            />
                            <AvatarFallback className="text-xs workspace-component-bg workspace-component-active-color">
                              {getAvatarInitials(
                                assignee.full_name,
                                assignee.email
                              )}
                            </AvatarFallback>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAssignee(assignee.id)}
                              className="h-6 w-6 p-0 rounded-full absolute right-0 top-0 cursor-pointer workspace-secondary-sidebar-bg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500 hover:text-white text-xs"
                            >
                              ×
                            </Button>
                          </Avatar>
                          <Popover>
                            <PopoverTrigger asChild>
                              {taskAssignees.length !== 0 && (
                                <Avatar className="h-6 w-6 cursor-pointer hover:workspace-hover">
                                  <AvatarImage
                                    src={undefined}
                                    alt={"User"}
                                    className="h-6 w-6 border border-dashed workspace-border"
                                  />
                                  <AvatarFallback className="text-xs workspace-sidebar-text border border-dashed workspace-border">
                                    <Plus className="h-3 w-3 " />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </PopoverTrigger>

                            <PopoverContent className="w-[200px] p-0">
                              <Command>
                                <CommandInput placeholder="Search user..." />
                                <CommandList>
                                  <CommandEmpty>No users found.</CommandEmpty>
                                  <CommandGroup>
                                    {taskAssignees.length > 0 && (
                                      <CommandItem
                                        onSelect={() =>
                                          onAssignTask(task.id, null)
                                        }
                                        className="flex items-center justify-between text-red-600"
                                      >
                                        <span>Remove all assignees</span>
                                      </CommandItem>
                                    )}
                                    {workspaceMembers
                                      .filter(
                                        (member) =>
                                          !taskAssignees.some(
                                            (assignee) =>
                                              assignee.id === member.id
                                          )
                                      )
                                      .map((member) => (
                                        <CommandItem
                                          key={member.id}
                                          onSelect={() =>
                                            addAssignee(member.id)
                                          }
                                          className="flex items-center justify-between"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <Avatar className="h-6 w-6">
                                              <AvatarFallback className="text-xs">
                                                {getAvatarInitials(
                                                  member.full_name,
                                                  member.email
                                                )}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>{member.full_name}</span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="workspace-sidebar-text text-xs w-full p-2 h-8 justify-start workspace-secondary-sidebar-bg hover:workspace-hover "
                      >
                        Empty
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search user..." />
                        <CommandList>
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup>
                            {taskAssignees.length > 0 && (
                              <CommandItem
                                onSelect={() => onAssignTask(task.id, null)}
                                className="flex items-center justify-between text-red-600"
                              >
                                <span>Remove all assignees</span>
                              </CommandItem>
                            )}
                            {workspaceMembers
                              .filter(
                                (member) =>
                                  !taskAssignees.some(
                                    (assignee) => assignee.id === member.id
                                  )
                              )
                              .map((member) => (
                                <CommandItem
                                  key={member.id}
                                  onSelect={() => addAssignee(member.id)}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {getAvatarInitials(
                                          member.full_name,
                                          member.email
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{member.full_name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Time Estimate */}
            <div className="mb-3">
              <div className="flex items-center mb-3 gap-2">
                <Clock className="w-4 h-4 workspace-sidebar-text" />
                <label className="text-xs font-medium workspace-sidebar-text uppercase">
                  Time Estimate
                </label>
              </div>
              <Select
                value={(task as any).time_estimate || "none"}
                onValueChange={(value) =>
                  handleUpdateTimeEstimate(value === "none" ? "" : value)
                }
                disabled={loading}
              >
                <SelectTrigger className="h-8 workspace-header-bg border border-transparent hover:workspace-hover">
                  <SelectValue>
                    {(task as any).time_estimate ? (
                      <span className="text-xs">
                        {(task as any).time_estimate}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">No estimate</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="workspace-header-bg">
                  <SelectItem
                    value="none"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <span className="text-xs text-gray-500">No estimate</span>
                  </SelectItem>
                  <SelectItem
                    value="30m"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <span className="text-xs">30 minutes</span>
                  </SelectItem>
                  <SelectItem
                    value="1h"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <span className="text-xs">1 hour</span>
                  </SelectItem>
                  <SelectItem
                    value="2h"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <span className="text-xs">2 hours</span>
                  </SelectItem>
                  <SelectItem
                    value="4h"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <span className="text-xs">4 hours</span>
                  </SelectItem>
                  <SelectItem
                    value="1d"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <span className="text-xs">1 day</span>
                  </SelectItem>
                  <SelectItem
                    value="2d"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <span className="text-xs">2 days</span>
                  </SelectItem>
                  <SelectItem
                    value="1w"
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <span className="text-xs">1 week</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-3">
            <div className="flex items-center mb-3 gap-2">
              <Tag className="w-4 h-4 workspace-sidebar-text" />
              <label className="text-xs font-medium workspace-sidebar-text uppercase">
                Tags
              </label>
            </div>

            <div className="space-y-2">
              {task.task_tags && task.task_tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {task.task_tags.map((taskTag: any) => (
                    <span
                      key={taskTag.tag.id}
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        tagColorClasses[taskTag.tag.color]
                      } group relative`}
                    >
                      {taskTag.tag.name}
                      <button
                        onClick={() => removeTagFromTask(taskTag.tag.id)}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Add tag button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="workspace-sidebar-text text-xs p-2 h-8 justify-start workspace-secondary-sidebar-bg hover:workspace-hover"
                  >
                    <Plus className="h-3 w-3" />
                    {task.task_tags && task.task_tags.length > 0
                      ? "Add tag"
                      : "Add tags"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search or create tags..."
                      value={tagSearchValue}
                      onValueChange={setTagSearchValue}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && tagSearchValue.trim()) {
                          // Check if the tag already exists
                          const existingTag = tags.find(
                            (tag) =>
                              tag.name.toLowerCase() ===
                              tagSearchValue.trim().toLowerCase()
                          );

                          if (existingTag) {
                            // If tag exists, assign it
                            addTagToTask(existingTag.id);
                          } else {
                            // If tag doesn't exist, create and assign it
                            createAndAssignNewTag(tagSearchValue.trim());
                          }
                          setTagSearchValue("");
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {tagSearchValue.trim() ? (
                          <div className="p-2 text-center">
                            <div className="text-sm text-gray-500 mb-2">
                              No tags found
                            </div>
                            <div className="text-xs text-blue-600">
                              Press Enter to create "{tagSearchValue.trim()}"
                            </div>
                          </div>
                        ) : (
                          "No tags found."
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {tags
                          .filter(
                            (tag) =>
                              !task.task_tags?.some(
                                (taskTag: any) => taskTag.tag.id === tag.id
                              ) &&
                              tag.name
                                .toLowerCase()
                                .includes(tagSearchValue.toLowerCase())
                          )
                          .map((tag) => (
                            <CommandItem
                              key={tag.id}
                              onSelect={() => {
                                addTagToTask(tag.id);
                                setTagSearchValue("");
                              }}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    colorMap[tag.color] || "bg-gray-500"
                                  }`}
                                />
                                <span>{tag.name}</span>
                              </div>
                            </CommandItem>
                          ))}
                        {tagSearchValue.trim() &&
                          !tags.some(
                            (tag) =>
                              tag.name.toLowerCase() ===
                              tagSearchValue.trim().toLowerCase()
                          ) && (
                            <CommandItem
                              onSelect={() => {
                                createAndAssignNewTag(tagSearchValue.trim());
                                setTagSearchValue("");
                              }}
                              className="flex items-center justify-between text-blue-600"
                            >
                              <div className="flex items-center space-x-2">
                                <Plus className="w-3 h-3" />
                                <span>Create "{tagSearchValue.trim()}"</span>
                              </div>
                            </CommandItem>
                          )}
                        {tags.filter(
                          (tag) =>
                            !task.task_tags?.some(
                              (taskTag: any) => taskTag.tag.id === tag.id
                            ) &&
                            tag.name
                              .toLowerCase()
                              .includes(tagSearchValue.toLowerCase())
                        ).length === 0 &&
                          !tagSearchValue.trim() && (
                            <CommandItem disabled>
                              <span className="text-gray-500">
                                All tags assigned
                              </span>
                            </CommandItem>
                          )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="flex-1 p-3 overflow-y-auto">
            {/* Task Title */}
            <div className="mb-3">
              {isEditing ? (
                <Input
                  value={editedTask.name}
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, name: e.target.value })
                  }
                  className="text-2xl font-semibold border-none p-0 focus:ring-0 bg-transparent"
                  placeholder="Task name"
                />
              ) : (
                <>
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs p-1 font-medium workspace-sidebar-text border rounded-md">
                      Task
                    </span>
                    |
                    <span className="text-xs p-1 font-medium workspace-sidebar-text border rounded-md">
                      {task.task_id}
                    </span>
                  </div>
                  {isEditingTaskName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedTaskName}
                        onChange={(e) => setEditedTaskName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveTaskName();
                          } else if (e.key === "Escape") {
                            handleCancelTaskName();
                          }
                        }}
                        className="text-xl font-semibold border workspace-border p-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-2 focus:workspace-ring bg-transparent"
                        placeholder="Task name"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveTaskName}
                        disabled={loading}
                        className="workspace-primary hover:workspace-primary-hover"
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelTaskName}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <h1 className="text-xl font-semibold workspace-sidebar-text">
                      {task.name}
                    </h1>
                  )}
                </>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-medium workspace-sidebar-text">
                  Description
                </h3>
              </div>

              {isEditingDescription ? (
                <div>
                  <TextEditor
                    key={`edit-${task.id}`}
                    value={editedDescription}
                    onChange={(value) => setEditedDescription(value)}
                    placeholder="Add a description..."
                    className="w-full min-h-[200px] workspace-sidebar-text workspace-header-bg"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelDescription}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveDescription}
                      disabled={loading}
                      className="workspace-primary hover:workspace-primary-hover"
                    >
                      {loading ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="workspace-header-bg border workspace-border rounded-lg p-4 min-h-[200px] cursor-pointer hover:workspace-hover workspace-sidebar-text"
                  onClick={handleStartEditDescription}
                >
                  {task.description ? (
                    <TextEditor
                      value={task.description}
                      readOnly={true}
                      className="border-none p-0"
                    />
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      Click to add a description...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium workspace-sidebar-text">
                  Subtasks
                  <span className="ml-2 text-sm font-normal workspace-sidebar-text">
                    {completedSubtasks}/{subtasks.length}
                  </span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingSubtask(true)}
                  className="workspace-sidebar-text"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </div>

              <div className="workspace-sidebar-bg border workspace-border rounded-lg workspace-sidebar-text">
                {/* Subtasks Header */}
                <div className="grid grid-cols-12 gap-4 p-3 border-b workspace-border text-xs font-medium workspace-sidebar-text uppercase tracking-wide">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-3">Assignee</div>
                  <div className="col-span-2">Priority</div>
                  <div className="col-span-2">Due date</div>
                  <div className="col-span-1">Actions</div>
                </div>

                {/* Subtasks List */}
                <div>
                  {subtasks.map((subtask) => {
                    const completedStatus =
                      statuses.find(
                        (s) =>
                          s.name.toLowerCase().includes("done") ||
                          s.name.toLowerCase().includes("complete")
                      ) || statuses[statuses.length - 1];
                    const isCompleted =
                      subtask.status_id === completedStatus?.id;

                    return (
                      <div
                        key={subtask.id}
                        className="grid grid-cols-12 gap-4 p-3 hover:workspace-hover border-b workspace-border last:border-b-0 cursor-pointer"
                        onClick={(e) => {
                          if (
                            e.target instanceof HTMLElement &&
                            e.target.closest("button")
                          )
                            return;
                          window.location.href = `/${workspace.workspace_id}/task/${subtask.task_id}`;
                        }}
                      >
                        <div className="col-span-4 flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubtaskComplete(subtask);
                            }}
                            className="flex-shrink-0"
                          >
                            {isCompleted ? (
                              <CheckSquare className="h-4 w-4 text-green-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <span
                            className={`text-sm ${
                              isCompleted ? "line-through" : ""
                            }`}
                          >
                            {subtask.name}
                          </span>
                        </div>
                        <div className="col-span-3 flex items-center">
                          {subtask.assignee ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 p-1 workspace-sidebar-text hover:workspace-hover"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Avatar className="h-4 w-4 mr-1">
                                    <AvatarImage
                                      src={
                                        subtask.assignee.avatar_url ?? undefined
                                      }
                                      alt={subtask.assignee.full_name || "User"}
                                    />
                                    <AvatarFallback className="text-xs workspace-component-bg workspace-component-active-color">
                                      {getAvatarInitials(
                                        subtask.assignee.full_name,
                                        subtask.assignee.email
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs truncate max-w-[80px]">
                                    {subtask.assignee.full_name}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search user..." />
                                  <CommandList>
                                    <CommandEmpty>No users found.</CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() =>
                                          updateSubtaskAssignee(
                                            subtask.id,
                                            null
                                          )
                                        }
                                        className="flex items-center justify-between text-red-600"
                                      >
                                        <span>Remove assignee</span>
                                      </CommandItem>
                                      {workspaceMembers
                                        .filter(
                                          (member) =>
                                            member.id !== subtask.assignee_id
                                        )
                                        .map((member) => (
                                          <CommandItem
                                            key={member.id}
                                            onSelect={() =>
                                              updateSubtaskAssignee(
                                                subtask.id,
                                                member.id
                                              )
                                            }
                                            className="flex items-center justify-between"
                                          >
                                            <div className="flex items-center space-x-2">
                                              <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs">
                                                  {getAvatarInitials(
                                                    member.full_name,
                                                    member.email
                                                  )}
                                                </AvatarFallback>
                                              </Avatar>
                                              <span>{member.full_name}</span>
                                            </div>
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 p-1 workspace-sidebar-text hover:workspace-hover"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search user..." />
                                  <CommandList>
                                    <CommandEmpty>No users found.</CommandEmpty>
                                    <CommandGroup>
                                      {workspaceMembers.map((member) => (
                                        <CommandItem
                                          key={member.id}
                                          onSelect={() =>
                                            updateSubtaskAssignee(
                                              subtask.id,
                                              member.id
                                            )
                                          }
                                          className="flex items-center justify-between"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <Avatar className="h-6 w-6">
                                              <AvatarFallback className="text-xs">
                                                {getAvatarInitials(
                                                  member.full_name,
                                                  member.email
                                                )}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>{member.full_name}</span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <div className="col-span-2 flex items-center">
                          <Select
                            value={subtask.priority || "none"}
                            onValueChange={(value) =>
                              updateSubtaskPriority(
                                subtask.id,
                                value === "none" ? "" : value
                              )
                            }
                          >
                            <SelectTrigger
                              className="h-6 text-xs workspace-header-bg border border-transparent hover:workspace-hover"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue>
                                {subtask.priority ? (
                                  <div className="flex items-center gap-1">
                                    <Goal
                                      className={`w-3 h-3 ${
                                        priorityConfig[
                                          subtask.priority as keyof typeof priorityConfig
                                        ]?.color
                                      }`}
                                    />
                                    <span className="text-xs">
                                      {
                                        priorityConfig[
                                          subtask.priority as keyof typeof priorityConfig
                                        ]?.label
                                      }
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    Priority
                                  </span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="workspace-header-bg">
                              <SelectItem
                                value="none"
                                className="hover:workspace-hover cursor-pointer"
                              >
                                <span className="text-xs text-gray-500">
                                  No priority
                                </span>
                              </SelectItem>
                              {Object.entries(priorityConfig).map(
                                ([key, config]) => (
                                  <SelectItem
                                    key={key}
                                    value={key}
                                    className="hover:workspace-hover cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Goal
                                        className={`w-3 h-3 ${config.color}`}
                                      />
                                      <span className="text-xs">
                                        {config.label}
                                      </span>
                                    </div>
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-6 p-1 text-xs workspace-sidebar-text hover:workspace-hover"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <CalendarIcon className="h-3 w-3 text-gray-400 mr-1" />
                                <span>
                                  {subtask.due_date
                                    ? format(
                                        parseISO(subtask.due_date),
                                        "MMM d"
                                      )
                                    : "Due date"}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  subtask.due_date
                                    ? parseISO(subtask.due_date)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  updateSubtaskDueDate(subtask.id, date)
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialogOpen(subtask.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {isAddingSubtask && (
                    <div className="grid grid-cols-12 gap-4 p-3 border-b workspace-border">
                      <div className="col-span-4 flex items-center space-x-2">
                        <Square className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          value={newSubtaskName}
                          onChange={(e) => setNewSubtaskName(e.target.value)}
                          placeholder="Subtask name"
                          className="border-none p-0 focus:ring-0 bg-transparent"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddSubtask();
                            } else if (e.key === "Escape") {
                              setIsAddingSubtask(false);
                              setNewSubtaskName("");
                            }
                          }}
                          autoFocus
                        />
                      </div>
                      <div className="col-span-8 flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          onClick={handleAddSubtask}
                          disabled={loading}
                        >
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsAddingSubtask(false);
                            setNewSubtaskName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {subtasks.length === 0 && !isAddingSubtask && (
                    <div className="p-8 text-center workspace-sidebar-text text-xs">
                      <GitBranch className="h-8 w-8 mx-auto mb-4 text-gray-300" />
                      <p>No subtasks yet. Add one to break down this task.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Activity Sidebar */}
          <div className="w-80 border-l workspace-border p-3 overflow-y-auto flex flex-col">
            {showActivitySearch ? (
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                  <Input
                    variant="workspace"
                    placeholder="Search activities..."
                    value={activitySearchValue}
                    onChange={(e) => setActivitySearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setActivitySearchValue("");
                        setShowActivitySearch(false);
                      }
                    }}
                    className="pl-7 h-7 text-xs workspace-sidebar-text workspace-header-bg focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-2 focus:workspace-ring"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-between mb-3">
                <h3 className="text-sm font-medium workspace-sidebar-text">
                  Activity
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowActivitySearch(!showActivitySearch)}
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex flex-col h-[calc(100vh-75px)] justify-between overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Real activities from database */}
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="text-xs workspace-sidebar-text"
                  >
                    <div className="flex items-start space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={activity.user?.avatar_url ?? undefined}
                          alt={activity.user?.full_name || "User"}
                        />
                        <AvatarFallback className="text-xs workspace-component-bg workspace-component-active-color">
                          {getAvatarInitials(
                            activity.user?.full_name,
                            activity.user?.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {activity.type === "comment_added" ||
                        activity.type === "comment" ? (
                          <div>
                            <p className="text-xs workspace-sidebar-text">
                              <span className="font-medium">
                                {activity.user?.id === user?.id
                                  ? "You"
                                  : activity.user?.full_name || "Unknown User"}
                              </span>{" "}
                              commented:
                            </p>
                            <div className="mt-1 p-2 rounded text-xs workspace-sidebar-text">
                              {activity.metadata?.comment ||
                                activity.description.replace("commented: ", "")}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(
                                parseISO(activity.created_at),
                                "MMM d 'at' h:mm a"
                              )}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs workspace-sidebar-text">
                              <span className="font-medium">
                                {activity.user?.id === user?.id
                                  ? "You"
                                  : activity.user?.full_name || "Unknown User"}
                              </span>{" "}
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(
                                parseISO(activity.created_at),
                                "MMM d 'at' h:mm a"
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredActivities.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-500">
                      {activitySearchValue.trim()
                        ? `No activities found for "${activitySearchValue}"`
                        : "No recent activity"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Comment Input */}
            <div className="mt-2 pt-3 border-t workspace-border text-xs relative">
              <Textarea
                placeholder="Write a comment... (Ctrl+Enter or Cmd+Enter to send)"
                className="w-full text-xs workspace-sidebar-text workspace-header-bg placeholder:text-xs resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-2 focus:workspace-ring"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    handleSendComment();
                  }
                }}
                rows={5}
                disabled={isSubmittingComment}
              />
              <div className="flex justify-end mt-2 absolute bottom-2 right-2 space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      className="text-xs workspace-sidebar-text workspace-secondary-sidebar-bg hover:workspace-hover p-1 h-6"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="h-2 w-2 animate-spin" />
                      ) : (
                        <Brain className="h-2 w-2" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="end">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => {
                          // TODO: Implement summarize task
                          toast({
                            title: "Feature Coming Soon",
                            description:
                              "Summarize task feature will be available soon",
                          });
                        }}
                      >
                        <Brain className="h-3 w-3" />
                        Summarize Task
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => {
                          // TODO: Implement create subtasks
                          toast({
                            title: "Feature Coming Soon",
                            description:
                              "Auto-create subtasks feature will be available soon",
                          });
                        }}
                      >
                        <GitBranch className="h-3 w-3" />
                        Create Subtasks
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => {
                          // TODO: Implement progress update
                          toast({
                            title: "Feature Coming Soon",
                            description:
                              "Progress update feature will be available soon",
                          });
                        }}
                      >
                        <CircleDot className="h-3 w-3" />
                        Progress Update
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => {
                          // TODO: Implement write feature
                          toast({
                            title: "Feature Coming Soon",
                            description:
                              "AI writing assistant will be available soon",
                          });
                        }}
                      >
                        <Edit className="h-3 w-3" />
                        Write
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  size="sm"
                  onClick={handleSendComment}
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="text-xs workspace-sidebar-text workspace-primary hover:workspace-primary-hover p-1 h-6"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-2 w-2 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-2 w-2" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Subtask Dialog */}
      <Dialog
        open={!!deleteDialogOpen}
        onOpenChange={(open) => !open && setDeleteDialogOpen(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Subtask</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {deleteDialogOpen
                ? subtasks.find((st) => st.id === deleteDialogOpen)?.name
                : ""}
              "? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialogOpen) {
                  deleteSubtask(deleteDialogOpen);
                  setDeleteDialogOpen(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
