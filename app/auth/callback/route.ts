import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isUserAllowedServer } from "@/lib/auth-utils-server";

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
    if (user) {
      // Check if user row exists
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!userRow) {
        await supabase.from("users").insert({
          id: user.id,
          name: user.user_metadata?.full_name || "",
          email: user.email,
          allowed: false,
          role: "user",
          company: user.user_metadata?.company || "",
        });
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", origin));
}
