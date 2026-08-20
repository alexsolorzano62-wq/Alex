import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Administración de alquileres — Lamelas & Chaumont",
  description:
    "Contratos, ajustes, cobranzas, gastos y liquidaciones a propietarios.",
};

export const viewport: Viewport = {
  themeColor: "#1a9b3e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
