import Logo from "@/components/Logo";

export const metadata = {
  title: "Sistema pausado",
};

export default function MantenimientoPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm text-center">
        <Logo markClassName="h-16 w-16 text-brand-600 mx-auto" />

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6">
          <p className="text-3xl">🔧</p>
          <h1 className="mt-2 text-lg font-bold text-amber-900">
            Sistema pausado temporalmente
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            Estamos haciendo tareas de mantenimiento. En un rato vas a poder
            volver a entrar con tu usuario de siempre.
          </p>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          La información cargada está a salvo. Ante cualquier duda, consultá con
          la administración.
        </p>
      </div>
    </div>
  );
}
