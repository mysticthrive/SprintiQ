import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("users")
    .select("id, name, email, company, created_at, allowed, role", {
      count: "exact",
    });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (filter === "allowed") {
    query = query.eq("allowed", true);
  } else if (filter === "not_allowed") {
    query = query.eq("allowed", false);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch avatar_url for each user from profiles table
  let usersWithAvatars = [];
  if (data && data.length > 0) {
    // Get all emails
    const emails = data.map((u: any) => u.email);
    // Fetch all profiles in one query
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, avatar_url")
      .in("email", emails);
    usersWithAvatars = data.map((user: any) => {
      const profile = profiles?.find((p: any) => p.email === user.email);
      return { ...user, avatar_url: profile?.avatar_url || null };
    });
  }

  return NextResponse.json({ users: usersWithAvatars, total: count || 0 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await req.json();
  const { id, allowed, role } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Handle allowed status update
  if (typeof allowed === "boolean") {
    const { error } = await supabase
      .from("users")
      .update({ allowed })
      .eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Handle role update
  if (role && ["admin", "user", "investor"].includes(role)) {
    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
