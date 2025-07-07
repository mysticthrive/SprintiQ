import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Server-side version of isEmailAllowed
 * @param email The email to check
 * @returns Promise<boolean> True if email is allowed, false otherwise
 */
export async function isEmailAllowedServer(email: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("allowed_users")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      // If the table doesn't exist or there's an error, log it but don't block access
      console.warn("Error checking allowed_users table:", error);
      return true; // Allow access if there's an error (fail open)
    }

    // If data is null, the email doesn't exist in the table
    return !!data; // Return true if email exists in the table, false otherwise
  } catch (error) {
    console.error("Error checking email authorization:", error);
    return true; // Allow access if there's an error (fail open)
  }
}
