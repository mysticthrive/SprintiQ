import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/layout";
import AdminEmailsTable from "@/components/admin/emails";
import { ContactMessage } from "@/components/admin/emails";

export default async function AdminEmailsPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const messages = (data ?? []) as ContactMessage[];

  return (
    <AdminLayout>
      <AdminEmailsTable
        messages={messages}
        error={error ? "Failed to load messages" : null}
      />
    </AdminLayout>
  );
}
