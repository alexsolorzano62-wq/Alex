import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "@/components/ListingForm";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link
          href="/listings"
          className="rounded-lg px-2 py-1 text-xl text-slate-500 active:bg-slate-100"
          aria-label="Volver"
        >
          ←
        </Link>
        <h1 className="text-base font-bold text-slate-900">Nuevo alquiler</h1>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <ListingForm userId={user.id} />
      </main>
    </div>
  );
}
