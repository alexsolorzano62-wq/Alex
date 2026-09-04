import { cotizaciones, soloVisibles } from "@/lib/dolar";
import { formatearMoneda } from "@/lib/dinero";

function haceCuanto(iso: string): string {
  const cuando = new Date(iso).getTime();
  if (!Number.isFinite(cuando)) return "";

  const minutos = Math.round((Date.now() - cuando) / 60000);
  if (minutos < 2) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;

  const dias = Math.round(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

export async function Cotizaciones() {
  const visibles = soloVisibles(await cotizaciones());

  // Sin cotización la pantalla sigue funcionando: es un dato de referencia,
  // no algo de lo que dependa cobrar un alquiler.
  if (visibles.length === 0) return null;

  const masReciente = visibles
    .map((c) => c.actualizado)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <section className="tarjeta">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-titulo text-base font-bold">Dólar</h2>
        {masReciente && (
          <span className="text-xs text-stone-500">{haceCuanto(masReciente)}</span>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {visibles.map((c) => (
          <div key={c.casa}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {c.nombre}
            </dt>
            <dd className="tabular mt-0.5 text-lg font-bold leading-tight">
              {formatearMoneda(c.venta, "ARS")}
            </dd>
            <dd className="tabular text-xs text-stone-500">
              compra {formatearMoneda(c.compra, "ARS")}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-[11px] text-stone-400">
        Valores de venta, de dolarapi.com. Se actualizan cada diez minutos.
      </p>
    </section>
  );
}
