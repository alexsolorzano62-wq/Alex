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
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        {/*
          Corre antes de que se pinte nada: sin esto, quien eligió tema oscuro
          ve un destello blanco en cada carga. Es la única razón por la que hay
          un script suelto acá.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tema')||'sistema';var o=t==='oscuro'||(t==='sistema'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',o)}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
