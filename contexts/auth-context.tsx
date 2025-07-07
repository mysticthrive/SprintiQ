"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { isEmailAllowed } from "@/lib/auth-utils";

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
    // Check if email is allowed before proceeding with sign in
    const isAllowed = await isEmailAllowed(email);
    console.log(
      `Sign in attempt for ${email}: ${isAllowed ? "ALLOWED" : "DENIED"}`
    );

    if (!isAllowed) {
      console.log(
        `Access denied for ${email}, redirecting to access-denied page`
      );
      router.push("/access-denied");
      return {
        error: { message: "Access denied. Your email is not authorized." },
        data: null,
      };
    }

    console.log(`Email ${email} is allowed, proceeding with sign in`);
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
    // Check if email is allowed before proceeding with sign up
    const isAllowed = await isEmailAllowed(email);
    console.log(
      `Sign up attempt for ${email}: ${isAllowed ? "ALLOWED" : "DENIED"}`
    );

    if (!isAllowed) {
      console.log(
        `Access denied for ${email}, redirecting to access-denied page`
      );
      router.push("/access-denied");
      return {
        error: { message: "Access denied. Your email is not authorized." },
        data: null,
      };
    }

    console.log(`Email ${email} is allowed, proceeding with sign up`);
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (!result.error && result.data.user) {
      // Create profile in profiles table
      if (metadata) {
        await supabase.from("profiles").insert({
          id: result.data.user.id,
          email,
          full_name: metadata.full_name,
          company: metadata.company,
        });
      }

      router.push("/auth/verify");
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
