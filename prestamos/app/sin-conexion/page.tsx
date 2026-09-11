import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Sin conexión" };

export default function SinConexionPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark variante="carta" className="h-16 w-16" />
      <h1 className="mt-4 text-lg font-bold">Te quedaste sin conexión</h1>
      <p className="mt-2 max-w-xs text-sm text-slate-600 dark:text-slate-400">
        Los saldos se leen del servidor para que siempre veas los números de verdad.
        Volvé a intentar cuando tengas señal.
      </p>
    </div>
  );
}
