"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    const verifyInvite = async () => {
      try {
        if (!token) {
          setError("Invalid invitation link");
          return;
        }

        // Get invite details
        const { data: invite, error: inviteError } = await supabase
          .from("workspace_members")
          .select("*, workspaces(*)")
          .eq("invite_token", token)
          .eq("status", "pending")
          .single();

        if (inviteError || !invite) {
          setError("This invitation is no longer valid");
          return;
        }

        setInviteData(invite);

        // If user is logged in, check if it matches the invite
        if (user) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", user.id)
            .single();

          if (userProfile?.email === invite.email) {
            // Accept the invitation automatically
            await acceptInvitation(invite);
          } else {
            setError("This invitation was sent to a different email address");
          }
        }
      } catch (err: any) {
        console.error("Error verifying invite:", err);
        setError("Failed to verify invitation");
      } finally {
        setIsLoading(false);
      }
    };

    verifyInvite();
  }, [token, user]);

  const acceptInvitation = async (invite: any) => {
    try {
      // Update the workspace member record
      const { error: updateError } = await supabase
        .from("workspace_members")
        .update({
          status: "active",
          joined_at: new Date().toISOString(),
          user_id: user?.id,
        })
        .eq("id", invite.id);

      if (updateError) throw updateError;

      // Redirect to the workspace
      router.push(`/${invite.workspaces.workspace_id}/home`);
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      setError("Failed to accept invitation");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invitation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button
              className="mt-4 w-full"
              onClick={() => router.push("/workspaces")}
            >
              Go to Workspaces
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join {inviteData?.workspaces?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Sign in or create an account to accept this invitation.
            </p>
            <Button
              className="w-full"
              onClick={() =>
                router.push(`/auth/signin?redirect=/join?token=${token}`)
              }
            >
              Sign In or Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Joining Workspace...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Please wait while we process your invitation...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
