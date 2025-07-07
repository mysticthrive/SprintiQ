import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isEmailAllowedServer } from "@/lib/auth-utils-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL("/signin?error=auth_error", origin));
    }

    // After successful authentication, check if user's email is authorized
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      const isAllowed = await isEmailAllowedServer(user.email);
      if (!isAllowed) {
        // Sign out the user and redirect to access denied
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/access-denied", origin));
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", origin));
}
