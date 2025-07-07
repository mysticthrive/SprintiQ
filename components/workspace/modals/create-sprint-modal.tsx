"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type {
  Workspace,
  Space,
  Sprint,
  SprintFolder,
} from "@/lib/database.types";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

interface CreateSprintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sprint: Sprint) => void;
  workspace: Workspace;
  space?: Space;
  sprintFolder?: SprintFolder;
}

export default function CreateSprintModal({
  open,
  onOpenChange,
  onSuccess,
  workspace,
  space,
  sprintFolder: propsSprintFolder,
}: CreateSprintModalProps) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const [sprintName, setSprintName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedSprintFolderId, setSelectedSprintFolderId] = useState(
    propsSprintFolder?.id || ""
  );
  const [sprintFolders, setSprintFolders] = useState<SprintFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClientSupabaseClient());
  const { toast } = useEnhancedToast();

  // Fetch sprint folders when modal opens
  useEffect(() => {
    if (open) {
      fetchSprintFolders();
    }
  }, [open, space?.id]);

  // Update selected sprint folder when prop changes
  useEffect(() => {
    if (propsSprintFolder) {
      setSelectedSprintFolderId(propsSprintFolder.id);
    }
  }, [propsSprintFolder]);

  const fetchSprintFolders = async () => {
    try {
      const { data: sprintFoldersData, error } = await supabase
        .from("sprint_folders")
        .select("*")
        .eq("space_id", space?.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching sprint folders:", error);
        return;
      }

      if (sprintFoldersData) {
        setSprintFolders(sprintFoldersData);
        // If no sprint folder is selected and there are sprint folders, select the first one
        if (!selectedSprintFolderId && sprintFoldersData.length > 0) {
          setSelectedSprintFolderId(sprintFoldersData[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching sprint folders:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!sprintName.trim()) {
      setError("Sprint name cannot be empty.");
      setIsLoading(false);
      return;
    }

    if (!selectedSprintFolderId) {
      setError("Please select a sprint folder.");
      setIsLoading(false);
      return;
    }

    if (!space) {
      setError("Space is required.");
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

      const { data: sprint, error: sprintError } = await supabase
        .from("sprints")
        .insert({
          name: sprintName.trim(),
          goal: goal.trim() || null,
          start_date: startDate ? startDate.toISOString().split("T")[0] : null,
          end_date: endDate ? endDate.toISOString().split("T")[0] : null,
          sprint_folder_id: selectedSprintFolderId,
          space_id: space!.id,
        })
        .select()
        .single();

      if (sprintError) {
        throw sprintError;
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
          ["sprint"].includes("sprint") &&
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
              entityType: "sprint",
              entityName: sprint.name,
              description: `Created sprint "${sprint.name}"`,
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
        title: "Sprint created",
        description: `Sprint "${sprintName.trim()}" has been created successfully.`,
        browserNotificationTitle: "Sprint created",
        browserNotificationBody: `Sprint "${sprintName.trim()}" has been created successfully.`,
      });

      onSuccess(sprint);
      onOpenChange(false);

      // Dispatch custom event for sidebar synchronization
      window.dispatchEvent(
        new CustomEvent("sprintCreated", {
          detail: { sprint, space },
        })
      );

      // Reset form
      setSprintName("");
      setGoal("");
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedSprintFolderId("");
    } catch (err: any) {
      console.error("Error creating sprint:", err);
      setError(err.message || "Failed to create sprint.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Sprint</DialogTitle>
          <DialogDescription>
            Create a new sprint to organize and track your work.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {!space && (
            <p className="text-red-500 text-sm">
              No space selected. Please select a space first.
            </p>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sprintName" className="text-right">
              Name
            </Label>
            <Input
              id="sprintName"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              className="col-span-3"
              placeholder="Enter sprint name"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goal" className="text-right">
              Goal
            </Label>
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="col-span-3"
              placeholder="What do you want to achieve in this sprint?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sprintFolder" className="text-right">
              Sprint Folder
            </Label>
            <Select
              value={selectedSprintFolderId}
              onValueChange={setSelectedSprintFolderId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a sprint folder" />
              </SelectTrigger>
              <SelectContent>
                {sprintFolders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => (startDate ? date < startDate : false)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !space}
              variant="workspace"
            >
              {isLoading ? "Creating..." : "Create Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
