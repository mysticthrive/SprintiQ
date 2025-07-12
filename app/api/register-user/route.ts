import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, name, email, company, role } = body;

  const supabase = await createServerSupabaseClient();

  // Insert user info with allowed: false
  const { error } = await supabase.from("users").insert({
    id,
    name,
    email,
    company,
    role,
    allowed: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
