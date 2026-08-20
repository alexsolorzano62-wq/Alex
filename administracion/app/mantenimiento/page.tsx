import { Logo } from "@/components/Logo";

export default function Mantenimiento() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <Logo />
      <h1 className="titulo mt-8">Sistema en mantenimiento</h1>
      <p className="mt-2 max-w-sm text-sm text-stone-500">
        Estamos haciendo unos ajustes. Los datos están intactos: volvé a entrar
        en un rato.
      </p>
    </main>
  );
}
