"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Gauge, Goal } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import type {
  Workspace,
  Space,
  Project,
  Sprint,
  Status,
  Tag,
  Task,
} from "@/lib/database.types";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { createEventServer } from "@/app/[workspaceId]/actions/events";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { getOrCreateNotStartedStatusType } from "@/lib/status-utils";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (task: Task) => void;
  workspace: Workspace;
  space: Space | undefined;
  project: Project | undefined;
  sprint?: Sprint | undefined;
  statuses: Status[];
  tags: Tag[];
  parentTaskId?: string; // New prop for subtasks
}

export default function CreateTaskModal({
  open,
  onOpenChange,
  onSuccess,
  workspace,
  space,
  project,
  sprint,
  statuses,
  tags,
  parentTaskId, // Use the new prop
}: CreateTaskModalProps) {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [statusId, setStatusId] = useState<string>(statuses[0]?.id || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<
    "critical" | "high" | "medium" | "low"
  >("low");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClientSupabaseClient());
  const { toast } = useEnhancedToast();
  useEffect(() => {
    if (open) {
      setTaskName("");
      setDescription("");
      setAssigneeId(null);
      setStatusId(statuses.length > 0 ? statuses[0]?.id || "" : "no-statuses");
      setDueDate(undefined);
      setPriority("low");
      setSelectedTags([]);
      setError(null);
    }
  }, [open, statuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!taskName.trim()) {
      setError("Task name cannot be empty.");
      setIsLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated.");
        setIsLoading(false);
        return;
      }

      // Check if we have any statuses, if not create a "Backlog" status automatically
      let finalStatusId = statusId;
      if (!statusId || statusId === "" || statusId === "no-statuses") {
        // Get or create the "not-started" status type
        const notStartedStatusTypeId = await getOrCreateNotStartedStatusType(
          supabase
        );

        if (!notStartedStatusTypeId) {
          setError("Failed to create status type.");
          setIsLoading(false);
          return;
        }

        // Create a "Backlog" status
        const { data: newStatus, error: statusError } = await supabase
          .from("statuses")
          .insert({
            name: "Backlog",
            color: "gray",
            position: 0,
            workspace_id: workspace.id,
            type: "project",
            status_type_id: notStartedStatusTypeId,
            project_id: project?.id,
            space_id: space?.id,
            sprint_id: sprint?.id,
          })
          .select()
          .single();

        if (statusError) {
          console.error("Error creating Backlog status:", statusError);
          setError("Failed to create default status.");
          setIsLoading(false);
          return;
        }

        finalStatusId = newStatus.id;
      }

      // Create the task
      const { data: newTask, error: taskError } = await supabase
        .from("tasks")
        .insert({
          task_id: `t${nanoid(12)}`, // Use nanoid to generate task_id in correct format
          name: taskName,
          description: description || null,
          assignee_id: assigneeId,
          status_id: finalStatusId,
          due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
          priority: priority,
          project_id: project?.id,
          sprint_id: sprint?.id,
          space_id: space?.id,
          workspace_id: workspace.id,
          created_by: user.id,
          parent_task_id: parentTaskId || null,
          type: project?.type === "jira" ? "jira" : "default",
          pending_sync: project?.type === "jira" ? true : false,
          sync_status: project?.type === "jira" ? "pending" : "synced",
        })
        .select()
        .single();

      if (taskError) {
        throw taskError;
      }

      // Handle task tags
      if (selectedTags.length > 0 && newTask) {
        const taskTagsToInsert = selectedTags.map((tagId) => ({
          task_id: newTask.id,
          tag_id: tagId,
        }));
        const { error: tagError } = await supabase
          .from("task_tags")
          .insert(taskTagsToInsert);
        if (tagError) {
          console.error("Error inserting task tags:", tagError);
        }
      }

      // Create event for task creation
      try {
        await createEventServer({
          type: "created",
          entityType: parentTaskId ? "subtask" : "task",
          entityId: newTask.id,
          entityName: newTask.name,
          userId: user.id,
          workspaceId: workspace.id,
          spaceId: space?.id,
          projectId: project?.id,
          description:
            statuses.length === 0
              ? parentTaskId
                ? `Created subtask "${newTask.name}" under parent task "${parentTaskId}" with automatically created "Backlog" status`
                : `Created task "${newTask.name}" with automatically created "Backlog" status`
              : parentTaskId
              ? `Created subtask "${newTask.name}" under parent task "${parentTaskId}"`
              : `Created task "${newTask.name}"`,
          metadata: {
            projectName: project?.name,
            sprintName: sprint?.name,
            spaceName: space?.name,
            parentTaskId: parentTaskId || null,
            autoCreatedStatus: statuses.length === 0,
          },
        });

        // Send Slack notification only if workspace is connected to Slack
        try {
          // Check if Slack integration exists for this workspace
          const slackCheckResponse = await fetch(
            `/api/slack/channels?workspaceId=${workspace.workspace_id}`
          );

          if (slackCheckResponse.ok) {
            // Slack is connected, send notification
            const response = await fetch("/api/slack/send-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                workspaceId: workspace.workspace_id,
                entityType: parentTaskId ? "subtask" : "task",
                entityId: newTask.id,
                entityName: newTask.name,
                eventType: "created",
                description:
                  statuses.length === 0
                    ? parentTaskId
                      ? `Created subtask "${newTask.name}" under parent task "${parentTaskId}" with automatically created "Backlog" status`
                      : `Created task "${newTask.name}" with automatically created "Backlog" status`
                    : parentTaskId
                    ? `Created subtask "${newTask.name}" under parent task "${parentTaskId}"`
                    : `Created task "${newTask.name}"`,
                metadata: {
                  projectName: project?.name,
                  sprintName: sprint?.name,
                  spaceName: space?.name,
                  priority: priority,
                  storyPoints: newTask.story_points, // Not implemented in current schema
                  description: newTask.description,
                  statusName:
                    statuses.length === 0
                      ? "Backlog"
                      : statuses.find((s) => s.id === newTask.status_id)?.name,
                  assigneeName: newTask.assignee?.full_name,
                  userName: user.user_metadata?.full_name || user.email,
                  parentTaskId: parentTaskId || null,
                  autoCreatedStatus: statuses.length === 0,
                },
                userId: user.id,
              }),
            });

            if (!response.ok) {
              console.warn("Failed to send Slack notification");
            }
          } else {
            // Slack is not connected, skip notification
            console.log("Slack not connected, skipping notification");
          }
        } catch (slackError) {
          console.warn("Failed to send Slack notification:", slackError);
        }
        toast({
          title: "Task created",
          description:
            statuses.length === 0
              ? `Successfully created task "${newTask.name}" with automatically created "Backlog" status`
              : `Successfully created task "${newTask.name}"`,
          browserNotificationTitle: "Task created",
          browserNotificationBody: `Successfully created task "${newTask.name}"`,
        });
      } catch (eventError) {
        console.warn(
          "Failed to create event, but task was created successfully:",
          eventError
        );
      }

      const {
        data: { profile },
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (
        profile?.email_notifications === "All" ||
        (profile?.email_notifications === "Default" &&
          ["task", "subtask"].includes(parentTaskId ? "subtask" : "task") &&
          ["created", "updated", "deleted"].includes("created"))
      ) {
        try {
          const response = await fetch("/api/send-email-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              eventType: "created",
              entityType: parentTaskId ? "subtask" : "task",
              entityName: newTask.name,
              description:
                statuses.length === 0
                  ? parentTaskId
                    ? `Created subtask "${newTask.name}" under parent task "${parentTaskId}" with automatically created "Backlog" status`
                    : `Created task "${newTask.name}" with automatically created "Backlog" status`
                  : parentTaskId
                  ? `Created subtask "${newTask.name}" under parent task "${parentTaskId}"`
                  : `Created task "${newTask.name}"`,
              workspaceId: workspace.id,
            }),
          });

          const result = await response.json();

          if (result.success) {
            console.log("Test email sent successfully");
          } else {
            console.error("Failed to send test email");
          }
        } catch (error) {
          console.error("Failed to send test email");
        }
      }

      onSuccess(newTask);
      onOpenChange(false);

      // Dispatch custom event for sidebar synchronization
      window.dispatchEvent(
        new CustomEvent("taskCreated", {
          detail: { task: newTask, project, sprint },
        })
      );

      // If we created a status automatically, dispatch an event to refresh statuses
      if (statuses.length === 0) {
        window.dispatchEvent(
          new CustomEvent("statusCreated", {
            detail: { workspace, space, project, sprint },
          })
        );
      }
    } catch (err: any) {
      console.error("Error creating task:", err);
      setError(err.message || "Failed to create task.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {parentTaskId ? "Create Subtask" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="taskName" className="text-right">
              Name
            </Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={statusId} onValueChange={setStatusId}>
              <SelectTrigger className="col-span-3">
                <SelectValue
                  placeholder={
                    statuses.length === 0
                      ? "No statuses - will create Backlog automatically"
                      : "Select a status"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {statuses.length > 0 ? (
                  statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-statuses" disabled>
                    <span className="text-gray-500">
                      No statuses available - will create "Backlog"
                      automatically
                    </span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Priority
            </Label>
            <Select
              value={priority || "low"}
              onValueChange={(value: "critical" | "high" | "medium" | "low") =>
                setPriority(value)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="critical"
                  className="hover:workspace-hover cursor-pointer"
                >
                  <div className="flex items-center">
                    <Goal className="mr-2 h-4 w-4 text-red-500" /> Critical
                  </div>
                </SelectItem>
                <SelectItem
                  value="high"
                  className="hover:workspace-hover cursor-pointer"
                >
                  <div className="flex items-center">
                    <Goal className="mr-2 h-4 w-4 text-yellow-500" /> High
                  </div>
                </SelectItem>
                <SelectItem
                  value="medium"
                  className="hover:workspace-hover cursor-pointer"
                >
                  <div className="flex items-center">
                    <Goal className="mr-2 h-4 w-4 text-blue-500" /> Medium
                  </div>
                </SelectItem>
                <SelectItem
                  value="low"
                  className="hover:workspace-hover cursor-pointer"
                >
                  <div className="flex items-center">
                    <Goal className="mr-2 h-4 w-4 text-green-500" /> Low
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">
              Due Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`col-span-3 justify-start text-left font-normal ${
                    !dueDate && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">
              Tags
            </Label>
            <Select
              value={selectedTags[0] || ""}
              onValueChange={(value) => setSelectedTags(value ? [value] : [])}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select tags" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {parentTaskId && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Parent Task</Label>
              <Input className="col-span-3" value={parentTaskId} disabled />
            </div>
          )}
          <DialogFooter>
            <Button type="submit" variant="workspace" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
