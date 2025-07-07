"use client";

import React, { useState } from "react";
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
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import type { Sprint } from "@/lib/database.types";

interface RenameSprintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedSprint: Sprint) => void;
  sprint: Sprint;
}

export default function RenameSprintModal({
  open,
  onOpenChange,
  onSuccess,
  sprint,
}: RenameSprintModalProps) {
  const { toast } = useEnhancedToast();
  const supabase = createClientSupabaseClient();

  const [name, setName] = useState(sprint.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === sprint.name) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data: updatedSprint, error } = await supabase
        .from("sprints")
        .update({ name: name.trim() })
        .eq("id", sprint.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Sprint renamed",
        description: `Sprint has been renamed to "${name.trim()}".`,
        browserNotificationTitle: "Sprint renamed",
        browserNotificationBody: `Sprint has been renamed to "${name.trim()}".`,
      });

      onSuccess(updatedSprint);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error renaming sprint:", error);
      toast({
        title: "Error renaming sprint",
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
          <DialogTitle>Rename Sprint</DialogTitle>
          <DialogDescription>
            Enter a new name for the sprint "{sprint.name}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="sprint-name">Sprint name</Label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sprint name"
              className="mt-1"
              required
            />
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
              disabled={
                isLoading || !name.trim() || name.trim() === sprint.name
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renaming...
                </>
              ) : (
                "Rename Sprint"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
