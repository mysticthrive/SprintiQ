import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, company, subject, message } =
      await request.json();
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Save to Supabase
    const supabase = await createServerSupabaseClient();
    const { error: dbError } = await supabase.from("contact_messages").insert([
      {
        first_name: firstName,
        last_name: lastName,
        email,
        company,
        subject,
        message,
      },
    ]);
    if (dbError) {
      return NextResponse.json(
        { error: "Failed to save message to database." },
        { status: 500 }
      );
    }

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: "SprintiQ Contact <no-reply@sprintiq.ai>",
      to: ["support@sprintiq.ai"],
      subject: `[Contact Form] ${subject}`,
      replyTo: email,
      text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nCompany: ${company}\n\nMessage:\n${message}`,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to send message." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}
