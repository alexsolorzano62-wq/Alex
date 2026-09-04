import { cotizaciones, soloVisibles } from "@/lib/dolar";

function haceCuanto(iso: string): string {
  const cuando = new Date(iso).getTime();
  if (!Number.isFinite(cuando)) return "";

  const minutos = Math.round((Date.now() - cuando) / 60000);
  if (minutos < 2) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.round(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

// Sin centavos: es un dato de referencia, no una liquidación. Los centavos
// del blue no le cambian la decisión a nadie y hacen la línea más larga.
const redondo = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

// Una línea al pie del panel, no una tarjeta. La cotización es una
// observación al costado del trabajo: si compite en tamaño con lo cobrado y
// lo que falta cobrar, le roba atención a los números que sí se miran.
export async function Cotizaciones() {
  const visibles = soloVisibles(await cotizaciones());

  // Sin cotización no se dibuja nada: es referencia, no algo de lo que
  // dependa cobrar un alquiler.
  if (visibles.length === 0) return null;

  const masReciente = visibles
    .map((c) => c.actualizado)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-stone-500">
      <span className="font-semibold uppercase tracking-wide">Dólar</span>
      {visibles.map((c) => (
        <span key={c.casa}>
          {c.nombre}{" "}
          <span className="tabular font-semibold text-stone-700">
            ${redondo.format(c.venta)}
          </span>
        </span>
      ))}
      {masReciente && <span className="text-stone-400">{haceCuanto(masReciente)}</span>}
    </p>
  );
}
