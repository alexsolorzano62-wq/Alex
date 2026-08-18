/**
 * Service worker de la app.
 *
 * A propósito NO guarda datos de préstamos ni de clientes: son datos privados y,
 * peor todavía, mostrarlos desactualizados llevaría a decidir sobre saldos que
 * ya cambiaron. Solo se cachea el cascarón (JS, CSS, íconos) para que la app
 * abra rápido, y una pantalla de aviso para cuando no hay señal.
 */
const VERSION = "v1";
const CACHE = `prestamos-${VERSION}`;
const SIN_CONEXION = "/sin-conexion";

const PRECARGA = [
  SIN_CONEXION,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECARGA))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres.filter((nombre) => nombre !== CACHE).map((nombre) => caches.delete(nombre))
        )
      )
      .then(() => self.clients.claim())
  );
});

/** Los archivos con hash en el nombre nunca cambian de contenido. */
function esEstatico(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;

  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  if (esEstatico(url)) {
    evento.respondWith(
      caches.match(pedido).then(
        (guardado) =>
          guardado ||
          fetch(pedido).then((respuesta) => {
            if (respuesta.ok) {
              const copia = respuesta.clone();
              caches.open(CACHE).then((cache) => cache.put(pedido, copia));
            }
            return respuesta;
          })
      )
    );
    return;
  }

  // Navegar siempre va a la red: los saldos tienen que ser los de verdad.
  // Si no hay señal, se muestra el aviso en vez del error del navegador.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido).catch(() => caches.match(SIN_CONEXION).then((r) => r || Response.error()))
    );
  }
});
