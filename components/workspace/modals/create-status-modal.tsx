"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { CirclePlay, CircleCheck, CircleDashed, Loader2 } from "lucide-react";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import type {
  Workspace,
  Space,
  Project,
  Sprint,
  Status,
  StatusType,
} from "@/lib/database.types";
import { createEventServer } from "@/app/[workspaceId]/actions/events";
import { STATUS_COLORS } from "@/types";

interface CreateStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (status: Status) => void;
  workspace: Workspace;
  space?: Space;
  project?: Project;
  sprint?: Sprint;
  statusTypes?: StatusType[];
}

export default function CreateStatusModal({
  open,
  onOpenChange,
  onSuccess,
  workspace,
  space,
  project,
  sprint,
  statusTypes = [],
}: CreateStatusModalProps) {
  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [statusTypeId, setStatusTypeId] = useState<string>("");
  const [type, setType] = useState<"space" | "project" | "sprint">(() => {
    if (sprint) return "sprint";
    if (project) return "project";
    return "space";
  });
  const [isLoading, setIsLoading] = useState(false);

  // Set default status type when modal opens
  useEffect(() => {
    if (open && statusTypes.length > 0) {
      // Default to "not-started" status type
      const notStartedType = statusTypes.find(
        (st) => st.name === "not-started"
      );
      setStatusTypeId(notStartedType?.id || statusTypes[0]?.id || "");
    } else if (open && statusTypes.length === 0) {
      // If no status types are available, clear the selection
      setStatusTypeId("");
    }
  }, [open, statusTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    try {
      // Get the current max position
      const { data: existingStatuses } = await supabase
        .from("statuses")
        .select("position")
        .eq("workspace_id", workspace.id)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition =
        existingStatuses && existingStatuses.length > 0
          ? existingStatuses[0].position + 1
          : 0;

      // Create the status with the correct type and project_id if applicable
      const statusData: any = {
        name: name.trim(),
        color,
        position: nextPosition,
        workspace_id: workspace.id,
        space_id: space?.id,
        type: type,
        status_type_id: statusTypeId || null, // Allow null if no status type is selected
      };

      // If creating a project-specific status, add the project_id
      if (type === "project" && project) {
        statusData.project_id = project.id;
      }

      // If creating a space-specific status, add the space_id
      if (type === "space" && space) {
        statusData.space_id = space.id;
      }

      // If creating a sprint-specific status, add the sprint_id
      if (type === "sprint" && sprint) {
        statusData.sprint_id = sprint.id;
      }

      const { data: status, error } = await supabase
        .from("statuses")
        .insert(statusData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create event for status creation
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          await createEventServer({
            type: "created",
            entityType: "status",
            entityId: status.id,
            entityName: status.name,
            userId: user.id,
            workspaceId: workspace.id,
            spaceId: type === "space" && space ? space.id : undefined,
            projectId: type === "project" && project ? project.id : undefined,
            description: `Created ${type} status "${status.name}"${
              space ? ` in space "${space.name}"` : ""
            }${project ? ` in project "${project.name}"` : ""}${
              sprint ? ` in sprint "${sprint.name}"` : ""
            }`,
            metadata: {
              color: status.color,
              type: status.type,
              position: status.position,
              spaceName: space?.name,
              projectName: project?.name,
              sprintName: sprint?.name,
              sprintId: type === "sprint" && sprint ? sprint.id : undefined,
            },
          });
        } catch (eventError) {
          console.warn(
            "Failed to create event, but status was created successfully:",
            eventError
          );
          // Don't block status creation if event creation fails
        }
      }
      const {
        data: { profile },
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (
        profile?.email_notifications === "All" ||
        (profile?.email_notifications === "Default" &&
          ["status"].includes("status") &&
          ["created", "updated", "deleted"].includes("created"))
      ) {
        try {
          const response = await fetch("/api/send-email-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user?.id,
              eventType: "created",
              entityType: "status",
              entityName: status.name,
              description: `Created status "${status.name}"`,
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

      toast({
        title: "Status created",
        description: `${name} status has been created successfully.`,
        browserNotificationTitle: "Status created",
        browserNotificationBody: `${name} status has been created successfully.`,
      });

      // Reset form
      setName("");
      setColor("blue");
      setStatusTypeId("");
      setType(sprint ? "sprint" : project ? "project" : "space");

      // Close modal
      onOpenChange(false);

      // Callback with the new status
      if (onSuccess) {
        onSuccess(status);
      }
    } catch (error: any) {
      console.error("Error creating status:", error);
      toast({
        title: "Error creating status",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusTypeIcon = (statusTypeName: string) => {
    switch (statusTypeName) {
      case "not-started":
        return <CircleDashed className="h-4 w-4" />;
      case "active":
        return <CirclePlay className="h-4 w-4" />;
      case "done":
      case "closed":
        return <CircleCheck className="h-4 w-4" />;
      default:
        return <CircleDashed className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create a Status</DialogTitle>
          <DialogDescription>
            Add a new status column to organize your tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="status-name">Status name</Label>
              <Input
                id="status-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. In Review, Testing, Blocked"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="status-color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_COLORS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="hover:workspace-hover cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 ${option.class} rounded-full mr-2`}
                        />
                        {option.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-type">Status Type</Label>
              <Select value={statusTypeId} onValueChange={setStatusTypeId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status type" />
                </SelectTrigger>
                <SelectContent>
                  {statusTypes.length > 0 ? (
                    statusTypes.map((statusType) => (
                      <SelectItem key={statusType.id} value={statusType.id}>
                        <div className="flex items-center gap-2">
                          {getStatusTypeIcon(statusType.name)}

                          <span className="capitalize">
                            {statusType.name.replace("-", " ")}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      <div className="flex items-center">
                        <span className="text-gray-500">
                          No status types available
                        </span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Status type determines how this status is used in progress
                calculations. This field is optional.
              </p>
            </div>

            <div>
              <Label htmlFor="status-type">Status scope</Label>
              <Select
                value={type}
                onValueChange={(value: "space" | "project" | "sprint") =>
                  setType(value)
                }
                disabled={!project && !sprint} // Disable if no project or sprint is provided
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="space">
                    <div className="flex items-center">
                      <span>
                        Space - Available to all projects in{" "}
                        {space?.name || "this space"}
                      </span>
                    </div>
                  </SelectItem>
                  {project && (
                    <SelectItem value="project">
                      <div className="flex items-center">
                        <span>Project - Only available to {project.name}</span>
                      </div>
                    </SelectItem>
                  )}
                  {sprint && (
                    <SelectItem value="sprint">
                      <div className="flex items-center">
                        <span>Sprint - Only available to {sprint.name}</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              variant="workspace"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Status"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
