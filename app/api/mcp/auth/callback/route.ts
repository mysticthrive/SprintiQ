import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enhancedMCPService } from "@/lib/mcp/enhanced-service";

/**
 * MCP Authentication Callback Handler
 *
 * This endpoint handles the callback after users authenticate with SprintIQ
 * and want to use MCP features.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const userEmail = searchParams.get("email");

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/auth/error?message=Invalid%20authorization%20code",
          request.url
        )
      );
    }

    // Handle Supabase auth callback
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !session) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL("/auth/error?message=Authentication%20failed", request.url)
      );
    }

    // Get user email from session
    const email = session.user.email;

    if (!email) {
      return NextResponse.redirect(
        new URL("/auth/error?message=Email%20not%20found", request.url)
      );
    }

    // Try to establish MCP connection
    const connectionResult = await enhancedMCPService.establishConnection(
      email
    );

    if (!connectionResult.success) {
      console.error("MCP connection failed:", connectionResult.error);
      return NextResponse.redirect(
        new URL(
          `/auth/error?message=${encodeURIComponent(
            connectionResult.error || "MCP connection failed"
          )}`,
          request.url
        )
      );
    }

    // Success! Redirect to MCP success page or client app
    const successUrl = new URL("/mcp/auth/success", request.url);
    successUrl.searchParams.set(
      "connectionId",
      connectionResult.connectionId || ""
    );
    successUrl.searchParams.set("email", email);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("MCP auth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?message=Internal%20server%20error", request.url)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, action } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "checkAuth":
        const authInfo = await enhancedMCPService.getAuthorizationInfo(
          userEmail
        );
        return NextResponse.json({
          success: true,
          authInfo,
        });

      case "establishConnection":
        const connectionResult = await enhancedMCPService.establishConnection(
          userEmail
        );
        return NextResponse.json({
          success: connectionResult.success,
          connectionId: connectionResult.connectionId,
          user: connectionResult.user,
          error: connectionResult.error,
          requiresAuthorization: connectionResult.requiresAuthorization,
          authorizationUrl: connectionResult.authorizationUrl,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("MCP auth callback POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
