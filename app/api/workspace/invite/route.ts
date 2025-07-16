import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { Database } from "@/lib/database.types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { workspaceId, email, role, userId } = await request.json();

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single();

    if (workspaceError) {
      throw workspaceError;
    }

    // Get inviter's profile
    const { data: inviterProfile, error: inviterError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (inviterError) {
      throw inviterError;
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id, status")
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member or has a pending invitation" },
        { status: 400 }
      );
    }

    // Generate invite token
    const inviteToken = crypto.randomUUID();

    // Create workspace member invitation
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        email: email,
        role: role,
        status: "pending",
        invite_token: inviteToken,
        invited_by: userId,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${inviteToken}`;

    const emailHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Workspace Invitation</title>
  </head>
  <body
    style="
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      color: #374151;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    "
  >
    <div
      style="
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      "
    >
      <!-- Logo Section -->
      <div style="text-align: center; margin-bottom: 32px">
        <img
          src="https://vttwakzntflxuylenszu.supabase.co/storage/v1/object/public/images/SprintiQ/logo1.png"
          alt="SprintiQ Logo"
          style="height: 60px; width: auto"
        />
      </div>

      <h2
        style="
          color: #111827;
          margin-bottom: 24px;
          font-size: 24px;
          font-weight: 600;
        "
      >
        You've been invited to join ${workspace.name}
      </h2>

      <p style="margin-bottom: 20px; font-size: 16px">
        ${inviterProfile.full_name} (${inviterProfile.email}) has invited you to join their
        workspace on SprintiQ.
      </p>

      <p style="margin-bottom: 24px; font-size: 16px">
        You've been invited as a <strong>${role}</strong>.
      </p>

      <div style="margin: 32px 0; text-align: center">
        <a
          href="${inviteUrl}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #10b981;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 16px;
            transition: background-color 0.2s;
          "
        >
          Accept Invitation
        </a>
      </div>

      <div
        style="
          margin: 32px 0;
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 6px;
        "
      >
        <p style="margin-bottom: 8px; color: #6b7280; font-size: 14px">
          Or copy and paste this URL into your browser:
        </p>
        <p
          style="
            margin: 0;
            color: #6b7280;
            font-size: 14px;
            word-break: break-all;
          "
        >
          ${inviteUrl}
        </p>
      </div>

      <div
        style="
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        "
      >
        <p style="color: #6b7280; font-size: 14px; margin: 0">
          This invitation will expire in 7 days.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0">
          If you didn't request this invitation, you can safely ignore this
          email.
        </p>
      </div>
    </div>
  </body>
</html>
`;

    await resend.emails.send({
      from: "SprintiQ <support@sprintiq.ai>",
      to: email,
      subject: `Invitation to join ${workspace.name} on SprintiQ`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, data: invite });
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send invitation" },
      { status: 500 }
    );
  }
}
