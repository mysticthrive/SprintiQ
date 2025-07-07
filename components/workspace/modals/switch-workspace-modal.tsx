"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { Workspace } from "@/lib/database.types";
import { Loader2, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SwitchWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWorkspaceId: string;
}

export default function SwitchWorkspaceModal({
  open,
  onOpenChange,
  currentWorkspaceId,
}: SwitchWorkspaceModalProps) {
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();
  const router = useRouter();

  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [switchingWorkspace, setSwitchingWorkspace] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!user) {
        setError("User not authenticated.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("workspace_members")
        .select("workspaces(*)")
        .eq("user_id", user.id)
        .order("created_at", { foreignTable: "workspaces", ascending: true });

      if (error) {
        console.error("Error fetching workspaces:", error);
        setError("Failed to load workspaces.");
      } else if (data) {
        // Filter out null workspaces and map to Workspace type
        const userWorkspaces = data
          .flatMap((item) => item.workspaces)
          .filter((ws): ws is Workspace => ws !== null);
        setWorkspaces(userWorkspaces);
      }
      setIsLoading(false);
    };

    if (open) {
      fetchWorkspaces();
    }
  }, [open, user, supabase]);

  const handleSwitch = (workspaceShortId: string) => {
    if (workspaceShortId === currentWorkspaceId) {
      onOpenChange(false); // Close modal if already on this workspace
      return;
    }
    setSwitchingWorkspace(workspaceShortId);
    router.push(`/${workspaceShortId}/home`);
    onOpenChange(false); // Close modal after initiating switch
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Switch Workspace</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-600">Loading workspaces...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : workspaces.length === 0 ? (
          <div className="text-gray-600 text-center py-4">
            No other workspaces found.
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <Button
                  key={ws.id}
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left py-2 h-auto",
                    ws.workspace_id === currentWorkspaceId &&
                      "border-emerald-500 bg-emerald-50 text-emerald-700"
                  )}
                  onClick={() => handleSwitch(ws.workspace_id)}
                  disabled={switchingWorkspace === ws.workspace_id}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{ws.name}</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {ws.purpose}
                      </span>
                    </div>
                    {ws.workspace_id === currentWorkspaceId && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}
                    {switchingWorkspace === ws.workspace_id && (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
