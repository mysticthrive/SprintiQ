"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import type { Sprint, SprintFolder, Space } from "@/lib/database.types";

interface MoveSprintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedSprint: Sprint) => void;
  sprint: Sprint;
  currentSprintFolder: SprintFolder;
  workspace: { id: string };
}

export default function MoveSprintModal({
  open,
  onOpenChange,
  onSuccess,
  sprint,
  currentSprintFolder,
  workspace,
}: MoveSprintModalProps) {
  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  const [selectedSprintFolderId, setSelectedSprintFolderId] = useState("");
  const [sprintFolders, setSprintFolders] = useState<SprintFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all sprint folders in the workspace
  useEffect(() => {
    if (open) {
      fetchSprintFolders();
    }
  }, [open]);

  const fetchSprintFolders = async () => {
    try {
      const { data: sprintFoldersData, error } = await supabase
        .from("sprint_folders")
        .select("*")
        .eq("space_id", sprint.space_id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching sprint folders:", error);
        return;
      }

      if (sprintFoldersData) {
        // Filter out the current sprint folder
        const availableFolders = sprintFoldersData.filter(
          (folder) => folder.id !== currentSprintFolder.id
        );
        setSprintFolders(availableFolders);

        // Set the first available folder as default
        if (availableFolders.length > 0) {
          setSelectedSprintFolderId(availableFolders[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching sprint folders:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSprintFolderId) {
      toast({
        title: "Error",
        description: "Please select a sprint folder.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: updatedSprint, error } = await supabase
        .from("sprints")
        .update({ sprint_folder_id: selectedSprintFolderId })
        .eq("id", sprint.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Sprint moved",
        description: `Sprint "${sprint.name}" has been moved successfully.`,
        browserNotificationTitle: "Sprint moved",
        browserNotificationBody: `Sprint "${sprint.name}" has been moved successfully.`,
      });

      onSuccess(updatedSprint);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error moving sprint:", error);
      toast({
        title: "Error moving sprint",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Move Sprint</DialogTitle>
          <DialogDescription>
            Move "{sprint.name}" to a different sprint folder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="sprint-folder">Sprint Folder</Label>
            <Select
              value={selectedSprintFolderId}
              onValueChange={setSelectedSprintFolderId}
            >
              <SelectTrigger className="mt-1">
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

          {sprintFolders.length === 0 && (
            <p className="text-sm text-gray-500">
              No other sprint folders available in this space.
            </p>
          )}

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
              disabled={
                isLoading ||
                !selectedSprintFolderId ||
                sprintFolders.length === 0
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Moving...
                </>
              ) : (
                "Move Sprint"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
