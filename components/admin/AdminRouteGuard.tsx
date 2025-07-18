"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { LoadingOverlay } from "@/components/ui/loading-page";

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const { data: userRecord, error } = await supabase
          .from("users")
          .select("role")
          .eq("email", user.email.toLowerCase().trim())
          .maybeSingle();

        if (error || !userRecord) {
          setIsAdmin(false);
        } else {
          setIsAdmin(userRecord.role === "admin");
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    if (!isLoading) {
      checkAdminRole();
    }
  }, [user, isLoading, supabase]);

  useEffect(() => {
    if (!checking && !isAdmin) {
      router.push("/access-denied");
    }
  }, [isAdmin, checking, router]);

  if (isLoading || checking) {
    return <LoadingOverlay />;
  }

  if (!isAdmin) {
    return null; // Will redirect to access-denied
  }

  return <>{children}</>;
}
