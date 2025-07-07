import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendTestEmailNotification } from "@/lib/email-service-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    // Verify that the user is requesting to send a test email to their own account
    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's email notification settings
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email_notifications, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if email notifications are enabled
    if (profile.email_notifications === "None") {
      return NextResponse.json(
        { error: "Email notifications are disabled" },
        { status: 400 }
      );
    }

    // Check if user has an email address
    if (!profile.email) {
      return NextResponse.json(
        { error: "No email address found for user" },
        { status: 400 }
      );
    }

    // Send test email
    const success = await sendTestEmailNotification(userId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Failed to send test email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending test email notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
