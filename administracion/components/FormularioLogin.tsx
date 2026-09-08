"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setEntrando(true);
    setError(null);
    setDetalle(null);

    const { error } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError("Email o contraseña incorrectos.");
      // El mensaje de arriba tapa por igual la clave mal escrita, el correo sin
      // confirmar y el corte por intentos repetidos. Mostramos abajo lo que
      // devuelve Supabase para no tener que adivinar cuál de los tres fue.
      setDetalle(
        [error.status, error.code, error.message].filter(Boolean).join(" · ")
      );
      setEntrando(false);
      return;
    }

    router.replace(params.get("redirectTo") ?? "/panel");
    router.refresh();
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <div>
        <label className="etiqueta" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="campo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          className="campo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2">
          <p className="text-sm text-red-700">{error}</p>
          {detalle && (
            <p className="mt-1 break-words font-mono text-[11px] text-red-500">
              {detalle}
            </p>
          )}
        </div>
      )}

      <button type="submit" className="boton w-full" disabled={entrando}>
        {entrando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
