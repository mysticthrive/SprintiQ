"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

interface InviteMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: {
    id: string;
    name: string;
  };
}

export default function InviteMembersModal({
  open,
  onOpenChange,
  workspace,
}: InviteMembersModalProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("member");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();

  const roles = [
    {
      value: "member",
      label: "Member",
      description: "Can access all public items in your workspace.",
    },
    {
      value: "limited_member",
      label: "Limited Member",
      description: "Can only access items shared with them.",
    },
    {
      value: "guest",
      label: "Guest",
      description:
        "Can't use all features or be added to Spaces. Can only access items shared with them.",
    },
    {
      value: "admin",
      label: "Admin",
      description:
        "Can manage spaces, People, Billing and other workspace settings.",
    },
  ];

  const handleInvite = async () => {
    setError(null);
    setSuccess(null);
    if (!email || !role) {
      setError("Please enter an email and select a role.");
      return;
    }

    setIsLoading(true);
    try {
      if (!user) {
        throw new Error("User not authenticated.");
      }

      const response = await fetch("/api/workspace/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          userId: user.id,
          email,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setSuccess(`Invitation sent to ${email} with role '${role}'.`);
      setEmail("");
      setRole("member");
    } catch (error: any) {
      console.error("Error inviting member:", error);
      setError(
        error.message || "An unexpected error occurred during invitation."
      );
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setEmail("");
      setRole("member");
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Invite new users to your workspace. They will receive an email
            invitation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select value={role} onValueChange={setRole} disabled={isLoading}>
              <SelectTrigger className="col-span-3">
                <SelectValue>
                  {roles.find((r) => r.value === role)?.label ||
                    "Select a role"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{r.label}</span>
                      <span className="text-xs text-gray-500">
                        {r.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleInvite}
            disabled={isLoading}
            variant="workspace"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
