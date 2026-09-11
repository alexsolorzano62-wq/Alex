import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Préstamos — seguimiento de clientes",
    short_name: "Préstamos",
    description:
      "Seguimiento de préstamos personales: clientes, planes, vencimientos y cobranzas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#edf4fd",
    theme_color: "#1877f2",
    lang: "es-AR",
    icons: [
      // El de 96 es el dibujo simplificado: a ese tamaño la carta no se lee.
      { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nuevo préstamo", url: "/prestamos/nuevo" },
      { name: "Nuevo cliente", url: "/clientes/nuevo" },
    ],
  };
}
