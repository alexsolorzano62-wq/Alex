// Mapa con marcador usando OpenStreetMap embebido: no necesita clave de API
// ni librerías extra. El botón abre la app de mapas del celular para navegar.
export default function LocationMap({
  latitude,
  longitude,
  address,
}: {
  latitude: number;
  longitude: number;
  address: string;
}) {
  const delta = 0.004;
  const bbox = [
    longitude - delta,
    latitude - delta / 2,
    longitude + delta,
    latitude + delta / 2,
  ].join(",");

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="mb-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-700">Ubicación</h3>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <iframe
          src={embedUrl}
          title={`Mapa de ${address}`}
          loading="lazy"
          className="h-48 w-full border-0"
        />
      </div>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white active:bg-slate-700"
      >
        🧭 Cómo llegar
      </a>
    </div>
  );
}
