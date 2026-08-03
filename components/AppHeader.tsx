"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import { BRAND_NAME } from "@/lib/brand";

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
      <div className="flex items-center gap-2">
        <LogoMark className="h-8 w-8 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-slate-900">
            {BRAND_NAME}
          </p>
          <p className="truncate text-xs text-slate-500">{userEmail}</p>
        </div>
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
