import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND_FULL } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Alquileres | ${BRAND_FULL}`,
  description: `Carga y consulta de alquileres disponibles - ${BRAND_FULL}`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
