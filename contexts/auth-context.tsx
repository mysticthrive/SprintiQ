"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
// REMOVE: import { isEmailAllowed } from "@/lib/auth-utils";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signUp: (
    email: string,
    password: string,
    metadata?: { full_name?: string; company?: string }
  ) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  const signIn = async (email: string, password: string) => {
    // Check if user is allowed in users table
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("allowed")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    if (userError || !userRecord || userRecord.allowed === false) {
      router.push("/access-denied");
      return {
        error: { message: "Access denied. Your account is not yet allowed." },
        data: null,
      };
    }
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!result.error && result.data.session) {
      router.push("/dashboard");
    }
    return result;
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; company?: string }
  ) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (!result.error && result.data.user) {
      // Insert into users table with allowed: false
      await supabase.from("users").insert({
        id: result.data.user.id, // <-- set to Supabase Auth user id
        name: metadata?.full_name || "",
        email: email.toLowerCase().trim(),
        allowed: false,
        company: metadata?.company || "",
      });
      // Optionally, also create profile in profiles table if needed
      if (metadata) {
        await supabase.from("profiles").insert({
          id: result.data.user.id,
          email,
          full_name: metadata.full_name,
          company: metadata.company,
        });
      }
      // Always redirect to access denied after signup
      router.push("/access-denied");
    }
    return result;
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Google OAuth error:", error);
      throw new Error(
        "Google sign-in is not available. Please contact support or use email sign-in."
      );
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
