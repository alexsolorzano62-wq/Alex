import type { Metadata, Viewport } from "next";
import {
  Inter,
  JetBrains_Mono,
  Lato,
  Montserrat,
  Nunito,
  Open_Sans,
  Poppins,
  Raleway,
  Roboto,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import AvisoSinConexion from "@/components/AvisoSinConexion";
import { traerApariencia } from "@/lib/datos";
import { familiaDe } from "@/lib/apariencia";

// Cada tipografía deja su variable CSS declarada. El navegador solo descarga
// los archivos de la que termina usándose, así que tener diez no pesa.
const inter = Inter({ subsets: ["latin"], variable: "--fuente-inter", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], variable: "--fuente-roboto", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--fuente-opensans", display: "swap" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--fuente-lato", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--fuente-montserrat", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--fuente-poppins", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--fuente-nunito", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], variable: "--fuente-raleway", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--fuente-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fuente-mono", display: "swap" });

const VARIABLES = [inter, roboto, openSans, lato, montserrat, poppins, nunito, raleway, serif, mono]
  .map((fuente) => fuente.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "Préstamos",
  description: "Seguimiento de préstamos personales.",
  applicationName: "Préstamos",
  appleWebApp: { capable: true, title: "Préstamos", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1877f2",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El tema se decide en el servidor y viaja en el HTML: así la pantalla nunca
  // aparece en blanco un instante antes de ponerse oscura.
  const { tema, fuente } = await traerApariencia();

  return (
    <html
      lang="es-AR"
      className={`${VARIABLES} ${tema === "oscuro" ? "dark" : ""}`}
      style={{ fontFamily: familiaDe(fuente) }}
    >
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <AvisoSinConexion />
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
