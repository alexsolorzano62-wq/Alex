import Link from "next/link";

// Los cuatro altas que se hacen seguido, al alcance desde el panel. Van en el
// orden en que hay que cargarlas: un contrato necesita una unidad, y una
// unidad necesita un propietario. Puesto al revés, el formulario no tiene
// nada para ofrecer y hay que volver sobre los pasos.
const ACCESOS = [
  {
    href: "/contratos/nuevo",
    texto: "Nuevo alquiler",
    detalle: "Contrato",
    icono: "M9 12h6m-6 4h6M9 8h2M6 3h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z",
    destacado: true,
  },
  {
    href: "/propiedades/nuevo",
    texto: "Nueva unidad",
    detalle: "Inmueble",
    icono: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5",
  },
  {
    href: "/propietarios/nuevo",
    texto: "Nuevo propietario",
    detalle: "Dueño",
    icono: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 108 0 4 4 0 00-8 0M22 21v-2a4 4 0 00-3-3.87",
  },
  {
    href: "/inquilinos/nuevo",
    texto: "Nuevo inquilino",
    detalle: "Ocupante",
    icono: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z",
  },
];

export function AccesosRapidos() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ACCESOS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className={`flex items-center gap-2.5 rounded-xl border p-3 transition-colors ${
            a.destacado
              ? "border-marca-500 bg-marca-50 hover:bg-marca-100"
              : "border-stone-200 bg-white hover:border-marca-300 hover:bg-stone-50"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              a.destacado ? "bg-marca-600 text-white" : "bg-stone-100 text-stone-600"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none"
                 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <path d={a.icono} />
            </svg>
          </span>
          <span className="min-w-0">
            <span
              className={`block truncate text-sm font-bold leading-tight ${
                a.destacado ? "text-marca-800" : "text-stone-800"
              }`}
            >
              {a.texto}
            </span>
            <span className="block text-[11px] text-stone-500">{a.detalle}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
