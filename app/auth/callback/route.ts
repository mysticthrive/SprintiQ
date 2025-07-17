import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isUserAllowedServer } from "@/lib/auth-utils-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const mcpToken = requestUrl.searchParams.get("mcp_token");
  const redirectUrl = requestUrl.searchParams.get("redirect");
  const origin = requestUrl.origin;

  console.log(`[Auth Callback] Received request with params:`, {
    code: !!code,
    mcpToken,
    redirectUrl,
    origin,
  });

  if (code) {
    const supabase = await createServerSupabaseClient();

    console.log(`[Auth Callback] Exchanging code for session...`);
    const { data: sessionData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);

      // If this is an MCP flow, redirect to MCP callback with error
      if (mcpToken && redirectUrl) {
        console.log(
          `[Auth Callback] MCP flow detected, redirecting to MCP callback with error`
        );
        const mcpCallbackUrl = new URL(redirectUrl);
        mcpCallbackUrl.searchParams.set("mcp_token", mcpToken);
        mcpCallbackUrl.searchParams.set("error", "auth_failed");
        mcpCallbackUrl.searchParams.set("error_description", error.message);
        return NextResponse.redirect(mcpCallbackUrl.toString());
      }

      return NextResponse.redirect(new URL("/signin?error=auth_error", origin));
    }

    console.log(`[Auth Callback] Session exchange successful`);

    // After successful authentication, check if user's email is authorized
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      console.log(`[Auth Callback] User authenticated:`, user.email);

      // Check if user row exists
      const { data: userRow } = await supabase
        .from("users")
        .select("id, allowed")
        .eq("id", user.id)
        .maybeSingle();

      if (!userRow) {
        console.log(
          `[Auth Callback] Creating new user record for:`,
          user.email
        );
        await supabase.from("users").insert({
          id: user.id,
          name: user.user_metadata?.full_name || "",
          email: user.email,
          allowed: false,
          role: "user",
          company: user.user_metadata?.company || "",
        });
      }

      // If MCP token is provided, redirect to MCP callback
      if (mcpToken && redirectUrl && user.email) {
        console.log(
          `[Auth Callback] MCP flow detected, redirecting to MCP callback`
        );
        const mcpCallbackUrl = new URL(redirectUrl);
        mcpCallbackUrl.searchParams.set("mcp_token", mcpToken);
        mcpCallbackUrl.searchParams.set("email", user.email);
        // Don't pass the code since it was already exchanged

        return NextResponse.redirect(mcpCallbackUrl.toString());
      }

      // For regular sign-in, check if user is allowed
      if (userRow && userRow.allowed === false) {
        console.log(
          `[Auth Callback] User not allowed, redirecting to access-denied`
        );
        return NextResponse.redirect(new URL("/access-denied", origin));
      }
    }
  }

  // URL to redirect to after sign in process completes
  console.log(`[Auth Callback] Redirecting to dashboard`);
  return NextResponse.redirect(new URL("/dashboard", origin));
}
