import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import AvisoSinConexion from "@/components/AvisoSinConexion";

export const metadata: Metadata = {
  title: "Préstamos",
  description: "Seguimiento de préstamos personales.",
  applicationName: "Préstamos",
  appleWebApp: {
    capable: true,
    title: "Préstamos",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4338ca",
  // Instalada, la app ocupa toda la pantalla, incluso detrás del notch.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AvisoSinConexion />
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
