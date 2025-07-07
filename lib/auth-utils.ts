import { createClientSupabaseClient } from "@/lib/supabase/client";

/**
 * Check if a user's email is in the allowed_users table
 * @param email The email to check
 * @returns Promise<boolean> True if email is allowed, false otherwise
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  try {
    const supabase = createClientSupabaseClient();

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
    const isAllowed = !!data;
    console.log(
      `Email authorization check for ${email}: ${
        isAllowed ? "ALLOWED" : "DENIED"
      }`
    );
    return isAllowed; // Return true if email exists in the table, false otherwise
  } catch (error) {
    console.error("Error checking email authorization:", error);
    return true; // Allow access if there's an error (fail open)
  }
}

/**
 * Check if the allowed_users table exists and is accessible
 */
export async function checkAllowedUsersTable(): Promise<boolean> {
  try {
    const supabase = createClientSupabaseClient();

    // Try to query the table
    const { data, error } = await supabase
      .from("allowed_users")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Allowed users table check failed:", error);
      return false;
    }

    console.log("Allowed users table is accessible");
    return true;
  } catch (error) {
    console.error("Error checking allowed_users table:", error);
    return false;
  }
}

/**
 * Debug function to test email authorization
 * @param email The email to test
 */
export async function debugEmailAuthorization(email: string): Promise<void> {
  try {
    const supabase = createClientSupabaseClient();

    console.log(`Testing email authorization for: ${email}`);

    // Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from("allowed_users")
      .select("count")
      .limit(1);

    if (tableError) {
      console.error("Table check error:", tableError);
      return;
    }

    console.log("Table exists, checking email...");

    // Check the specific email
    const { data, error } = await supabase
      .from("allowed_users")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error("Email check error:", error);
      return;
    }

    console.log("Email check result:", { data, exists: !!data });
  } catch (error) {
    console.error("Debug error:", error);
  }
}
