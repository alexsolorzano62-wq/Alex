import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requerirPerfil } from "@/lib/supabase/perfil";
import { Titulo } from "@/components/Ui";

export const dynamic = "force-dynamic";

const SECCIONES = [
  { href: "/unidades", texto: "Unidades", detalle: "Toda la cartera, con buscador y filtros" },
  { href: "/contratos", texto: "Contratos", detalle: "Alta, ajustes y vencimientos" },
  { href: "/propiedades", texto: "Propiedades", detalle: "Alta y edición de inmuebles" },
  { href: "/propietarios", texto: "Propietarios", detalle: "Dueños y cómo se les rinde" },
  { href: "/inquilinos", texto: "Inquilinos", detalle: "Quiénes ocupan cada unidad" },
  { href: "/gastos", texto: "Gastos", detalle: "Expensas, impuestos y reparaciones" },
  { href: "/avisos", texto: "Avisos", detalle: "Mensajes de WhatsApp listos para enviar" },
  { href: "/ajustes", texto: "Aumentos", detalle: "Contratos que cumplieron período" },
  { href: "/indices", texto: "Índices", detalle: "Series de ICL, IPC y demás" },
  { href: "/feriados", texto: "Feriados", detalle: "Cuándo se corre el vencimiento" },
  { href: "/tareas", texto: "Tareas", detalle: "Lo que hay que hacer" },
];

export default async function Mas() {
  const supabase = await createClient();
  const perfil = await requerirPerfil(supabase);

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Más</Titulo>

      <ul className="space-y-2">
        {SECCIONES.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="tarjeta block hover:border-marca-300">
              <div className="font-titulo text-base font-bold">{s.texto}</div>
              <div className="text-xs text-stone-500">{s.detalle}</div>
            </Link>
          </li>
        ))}
      </ul>

      {perfil && (
        <p className="mt-6 text-center text-xs text-stone-400">
          Entraste como {perfil.nombre} ({perfil.email})
          {perfil.rol === "admin" ? " · administrador" : ""}
        </p>
      )}
    </div>
  );
}
