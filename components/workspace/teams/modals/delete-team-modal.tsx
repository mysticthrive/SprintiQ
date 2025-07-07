"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { Team } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

interface DeleteTeamModalProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteTeamModal({
  team,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTeamModalProps) {
  const { toast } = useEnhancedToast();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const supabase = createClientSupabaseClient();

  const handleDelete = async () => {
    if (!team) {
      toast({
        title: "Error",
        description: "No team selected",
        variant: "destructive",
      });
      return;
    }

    if (confirmText !== team.name) {
      toast({
        title: "Error",
        description: "Please type the team name exactly to confirm deletion",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First, delete all team members
      const { error: membersError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", team.id);

      if (membersError) throw membersError;

      // Then delete the team
      const { error: teamError } = await supabase
        .from("teams")
        .delete()
        .eq("id", team.id);

      if (teamError) throw teamError;

      toast({
        title: "Success",
        description: "Team deleted successfully",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setConfirmText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-red-600">Delete Team</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                team and remove all team members.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">
                  Are you sure you want to delete "{team?.name}"?
                </h4>
                <p className="text-sm text-red-700">
                  This will permanently delete the team and remove all
                  associated team members. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              To confirm, type the team name:{" "}
              <span className="font-bold">{team?.name}</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter team name to confirm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmText !== team?.name}
          >
            {loading ? "Deleting..." : "Delete Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
