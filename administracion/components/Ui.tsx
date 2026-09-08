import Link from "next/link";
import { etiqueta } from "@/lib/types";

export function Titulo({
  children, accion,
}: {
  children: React.ReactNode;
  accion?: { href: string; texto: string };
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h1 className="titulo">{children}</h1>
      {accion && (
        <Link href={accion.href} className="boton shrink-0">{accion.texto}</Link>
      )}
    </div>
  );
}

const TONOS: Record<string, string> = {
  activo: "bg-marca-50 text-marca-800 border-marca-200",
  alquilado: "bg-marca-50 text-marca-800 border-marca-200",
  pagada: "bg-marca-50 text-marca-800 border-marca-200",
  emitida: "bg-sky-50 text-sky-800 border-sky-200",
  borrador: "bg-stone-100 text-stone-700 border-stone-200",
  disponible: "bg-amber-50 text-amber-800 border-amber-200",
  en_refaccion: "bg-amber-50 text-amber-800 border-amber-200",
  finalizado: "bg-stone-100 text-stone-600 border-stone-200",
  rescindido: "bg-red-50 text-red-700 border-red-200",
  anulada: "bg-red-50 text-red-700 border-red-200",
  retirado: "bg-stone-100 text-stone-600 border-stone-200",
};

export function Estado({ valor }: { valor: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        TONOS[valor] ?? "bg-stone-100 text-stone-700 border-stone-200"
      }`}
    >
      {etiqueta(valor)}
    </span>
  );
}

export function Vacio({
  texto, accion,
}: {
  texto: string;
  accion?: { href: string; texto: string };
}) {
  return (
    <div className="tarjeta flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-sm text-stone-500">{texto}</p>
      {accion && <Link href={accion.href} className="boton">{accion.texto}</Link>}
    </div>
  );
}

export function Dato({
  rotulo, children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-stone-500">{rotulo}</dt>
      <dd className="mt-0.5 text-sm text-stone-900">{children ?? "—"}</dd>
    </div>
  );
}

// Los formularios usan Server Actions: si algo sale mal, la acción tira un
// error y Next muestra el error.tsx de la sección.
export function Campo({
  rotulo, nombre, tipo = "text", valor, requerido, ayuda, ...resto
}: {
  rotulo: string;
  nombre: string;
  tipo?: string;
  valor?: string | number | null;
  requerido?: boolean;
  ayuda?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="etiqueta" htmlFor={nombre}>
        {rotulo}
        {requerido && <span className="text-marca-600"> *</span>}
      </label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        className="campo"
        defaultValue={valor ?? undefined}
        required={requerido}
        {...resto}
      />
      {ayuda && <p className="mt-1 text-xs text-stone-500">{ayuda}</p>}
    </div>
  );
}

export function Selector({
  rotulo, nombre, valor, opciones, ayuda, requerido,
}: {
  rotulo: string;
  nombre: string;
  valor?: string | null;
  opciones: { valor: string; texto: string }[];
  ayuda?: string;
  requerido?: boolean;
}) {
  return (
    <div>
      <label className="etiqueta" htmlFor={nombre}>
        {rotulo}
        {requerido && <span className="text-marca-600"> *</span>}
      </label>
      <select
        id={nombre}
        name={nombre}
        className="campo"
        defaultValue={valor ?? undefined}
        required={requerido}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.texto}</option>
        ))}
      </select>
      {ayuda && <p className="mt-1 text-xs text-stone-500">{ayuda}</p>}
    </div>
  );
}

export function Area({
  rotulo, nombre, valor, filas = 3,
}: {
  rotulo: string;
  nombre: string;
  valor?: string | null;
  filas?: number;
}) {
  return (
    <div>
      <label className="etiqueta" htmlFor={nombre}>{rotulo}</label>
      <textarea
        id={nombre}
        name={nombre}
        rows={filas}
        className="campo"
        defaultValue={valor ?? undefined}
      />
    </div>
  );
}
