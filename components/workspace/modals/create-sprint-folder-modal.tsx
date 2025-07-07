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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Workspace, Space, SprintFolder, Day } from "@/lib/database.types";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

interface CreateSprintFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sprintFolder: SprintFolder) => void;
  workspace: Workspace;
  spaces: Space[];
  selectedSpaceId?: string;
}

export default function CreateSprintFolderModal({
  open,
  onOpenChange,
  onSuccess,
  workspace,
  spaces,
  selectedSpaceId: propsSelectedSpaceId,
}: CreateSprintFolderModalProps) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const [sprintFolderName, setSprintFolderName] = useState("");
  const [selectedSpaceId, setSelectedSpaceId] = useState(
    propsSelectedSpaceId || ""
  );
  const [durationWeeks, setDurationWeeks] = useState(2);
  const [startDayId, setStartDayId] = useState<string>("");
  const [days, setDays] = useState<Day[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClientSupabaseClient());
  const { toast } = useEnhancedToast();

  // Fetch days when modal opens
  useEffect(() => {
    if (open) {
      fetchDays();
    }
  }, [open]);

  // Update selected space when prop changes
  useEffect(() => {
    if (propsSelectedSpaceId) {
      setSelectedSpaceId(propsSelectedSpaceId);
    }
  }, [propsSelectedSpaceId]);

  const fetchDays = async () => {
    try {
      const { data: daysData, error } = await supabase
        .from("days")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching days:", error);
        return;
      }

      if (daysData) {
        setDays(daysData);
        // Set default start day to Monday if available
        const monday = daysData.find((day) => day.name === "monday");
        if (monday) {
          setStartDayId(monday.id);
        }
      }
    } catch (error) {
      console.error("Error fetching days:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!sprintFolderName.trim()) {
      setError("Sprint folder name cannot be empty.");
      setIsLoading(false);
      return;
    }

    if (!selectedSpaceId) {
      setError("Please select a space.");
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

      // Find the selected space to get its UUID
      const selectedSpace = spaces.find(
        (space) => space.id === selectedSpaceId
      );
      if (!selectedSpace) {
        setError("Selected space not found.");
        setIsLoading(false);
        return;
      }

      const { data: sprintFolder, error: sprintFolderError } = await supabase
        .from("sprint_folders")
        .insert({
          name: sprintFolderName.trim(),
          sprint_start_day_id: startDayId || null,
          duration_week: durationWeeks,
          space_id: selectedSpace.id,
        })
        .select()
        .single();

      if (sprintFolderError) {
        throw sprintFolderError;
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
          ["sprint_folder"].includes("sprint_folder") &&
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
              entityType: "sprint_folder",
              entityName: sprintFolder.name,
              description: `Created sprint folder "${sprintFolder.name}"`,
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
        title: "Sprint folder created",
        description: `Sprint folder "${sprintFolderName.trim()}" has been created successfully.`,
        browserNotificationTitle: "Sprint folder created",
        browserNotificationBody: `Sprint folder "${sprintFolderName.trim()}" has been created successfully.`,
      });

      onSuccess(sprintFolder);
      onOpenChange(false);

      // Reset form
      setSprintFolderName("");
      setSelectedSpaceId("");
      setDurationWeeks(2);
      setStartDayId("");
    } catch (err: any) {
      console.error("Error creating sprint folder:", err);
      setError(err.message || "Failed to create sprint folder.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Sprint Folder</DialogTitle>
          <DialogDescription>
            Sprint folders help you organize sprints within a space.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sprintFolderName" className="text-right">
              Name
            </Label>
            <Input
              id="sprintFolderName"
              value={sprintFolderName}
              onChange={(e) => setSprintFolderName(e.target.value)}
              className="col-span-3"
              placeholder="Enter sprint folder name"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="space" className="text-right">
              Space
            </Label>
            <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a space" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="durationWeeks" className="text-right">
              Duration
            </Label>
            <Select
              value={durationWeeks.toString()}
              onValueChange={(value) => setDurationWeeks(parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 week</SelectItem>
                <SelectItem value="2">2 weeks</SelectItem>
                <SelectItem value="3">3 weeks</SelectItem>
                <SelectItem value="4">4 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDay" className="text-right">
              Start Day
            </Label>
            <Select value={startDayId} onValueChange={setStartDayId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select start day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day.id} value={day.id}>
                    {day.name.charAt(0).toUpperCase() + day.name.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={isLoading} variant="workspace">
              {isLoading ? "Creating..." : "Create Sprint Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
