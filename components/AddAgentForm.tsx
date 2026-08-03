"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddAgentForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"agent" | "admin">("agent");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, role }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el agente.");
      return;
    }

    setEmail("");
    setPassword("");
    setFullName("");
    setRole("agent");
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-700">Agregar agente</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre completo
        </label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Opcional"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Contraseña provisoria *
        </label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Rol
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "agent" | "admin")}
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
        >
          <option value="agent">Agente</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Agente creado correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Creando..." : "Crear agente"}
      </button>
    </form>
  );
}
