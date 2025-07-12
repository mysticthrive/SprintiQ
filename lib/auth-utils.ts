import { createClientSupabaseClient } from "@/lib/supabase/client";

export async function isUserAllowed(email: string): Promise<boolean> {
  try {
    const supabase = createClientSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("allowed")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    if (error || !data) return false;
    return !!data.allowed;
  } catch (error) {
    console.error("Error checking user allowed status:", error);
    return false;
  }
}
