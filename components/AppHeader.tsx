"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AppHeader({ userEmail }: { userEmail: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div>
        <p className="text-base font-bold leading-tight text-slate-900">
          Alquileres
        </p>
        <p className="truncate text-xs text-slate-500">{userEmail}</p>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 active:bg-slate-100"
      >
        Salir
      </button>
    </header>
  );
}
