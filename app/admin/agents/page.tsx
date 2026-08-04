import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/supabase/profile";
import { getPendingSuggestionsCount } from "@/lib/supabase/suggestions";
import { createAdminClient } from "@/lib/supabase/admin";
import AddAgentForm from "@/components/AddAgentForm";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getRole(supabase, user.id);
  if (role !== "admin") redirect("/listings");

  const pendingSuggestions = await getPendingSuggestionsCount(
    supabase,
    user.id,
    role
  );

  const adminClient = createAdminClient();

  const [{ data: usersData }, { data: profiles }] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    adminClient.from("profiles").select("id, full_name, role, created_at"),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const agents = (usersData?.users ?? [])
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      fullName: profileMap.get(u.id)?.full_name ?? null,
      role: profileMap.get(u.id)?.role ?? "agent",
    }))
    .sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader userEmail={user.email ?? ""} />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <h1 className="mb-4 text-lg font-bold text-slate-900">Agentes</h1>
        <AddAgentForm />

        <h2 className="mb-2 mt-8 text-sm font-semibold text-slate-700">
          Equipo ({agents.length})
        </h2>
        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {agent.fullName || agent.email}
                </p>
                <p className="truncate text-xs text-slate-500">{agent.email}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  agent.role === "admin"
                    ? "bg-brand-100 text-brand-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {agent.role === "admin" ? "Administrador" : "Agente"}
              </span>
            </div>
          ))}
        </div>
      </main>

      <BottomNav role={role} pendingSuggestions={pendingSuggestions} />
    </div>
  );
}
