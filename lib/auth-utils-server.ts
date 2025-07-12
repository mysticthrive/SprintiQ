import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function isUserAllowedServer(email: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
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
