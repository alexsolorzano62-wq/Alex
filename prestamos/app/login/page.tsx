"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import { claseInput } from "@/components/CampoTexto";

function Formulario() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEntrando(true);

    const supabase = createClient();
    const { error: fallo } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: clave,
    });

    setEntrando(false);

    if (fallo) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.replace(parametros.get("volverA") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={claseInput}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Contraseña</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className={claseInput}
        />
      </label>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={entrando}
        className="w-full rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        {entrando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <LogoMark className="mx-auto h-16 w-16 text-brand-600" />
          <h1 className="mt-3 text-xl font-bold">Préstamos</h1>
          <p className="text-sm text-slate-500">Seguimiento de clientes</p>
        </div>
        <Suspense>
          <Formulario />
        </Suspense>
      </div>
    </div>
  );
}
