"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Create a singleton to prevent multiple instances
let supabase: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClientSupabaseClient() {
  if (supabase) return supabase;

  supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabase;
}
