import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/server";

// List of public routes that don't require authentication
const publicRoutes = [
  "/",
  "/signin",
  "/signup",
  "/about",
  "/pricing",
  "/features",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/auth/callback",
  "/auth/verify",
  "/auth/reset-password",
  "/auth/update-password",
  "/access-denied",
  "/test-auth",
];

// Update the pattern to match short workspace IDs (w + 12 digits)
const workspaceRoutePattern = /^\/w\d{12}\/.*$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith("/api/")
    )
  ) {
    return NextResponse.next();
  }

  // Create response for cookie handling
  const response = NextResponse.next();

  // Create supabase client for middleware
  const supabase = createMiddlewareSupabaseClient(request, response);

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to login if not authenticated
    const redirectUrl = new URL("/signin", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if user's email is authorized
  if (session.user?.email) {
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("allowed")
      .eq("email", session.user.email.toLowerCase().trim())
      .maybeSingle();
    if (userError || !userRecord || userRecord.allowed === false) {
      // Sign out the user and redirect to access denied
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }
  }

  // If user is authenticated and trying to access setup-workspace, allow it
  if (pathname.startsWith("/setup-workspace")) {
    return response;
  }

  // Check if it's a workspace route (short ID pattern)
  if (workspaceRoutePattern.test(pathname)) {
    // Extract workspace short ID from path
    const workspaceShortId = pathname.split("/")[1];

    if (!session) {
      const redirectUrl = new URL("/signin", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Verify user has access to this workspace using short ID
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceShortId)
      .single();

    if (error || !workspace) {
      return NextResponse.redirect(new URL("/setup-workspace", request.url));
    }

    return response;
  }

  // Check if user has a workspace (only for non-workspace routes)
  if (
    !pathname.startsWith("/setup-workspace") &&
    !workspaceRoutePattern.test(pathname)
  ) {
    const { data: workspaces, error } = await supabase
      .from("workspaces")
      .select("workspace_id")
      .eq("owner_id", session.user.id)
      .limit(1);

    // If there's an error or no workspace, redirect to setup-workspace
    if (error || !workspaces || workspaces.length === 0) {
      return NextResponse.redirect(new URL("/setup-workspace", request.url));
    }

    // If user has workspace but trying to access old routes, redirect to workspace
    if (pathname === "/dashboard" || pathname === "/workspace") {
      return NextResponse.redirect(
        new URL(`/${workspaces[0].workspace_id}/home`, request.url)
      );
    }
  }

  // Allow access to protected routes
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
