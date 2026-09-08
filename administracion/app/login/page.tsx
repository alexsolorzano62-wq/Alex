import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { FormularioLogin } from "@/components/FormularioLogin";

export default function Login() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="tarjeta">
          <h1 className="titulo mb-1 text-xl">Administración</h1>
          <p className="mb-6 text-sm text-stone-500">
            Entrá con el usuario que te dio la inmobiliaria.
          </p>

          <Suspense fallback={null}>
            <FormularioLogin />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          No hay registro público. Las cuentas las crea un administrador.
        </p>
      </div>
    </main>
  );
}
