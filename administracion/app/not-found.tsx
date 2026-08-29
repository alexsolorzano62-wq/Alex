import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <h1 className="titulo">No encontramos eso</h1>
      <p className="mt-2 text-sm text-stone-500">
        Puede que se haya archivado o que el enlace esté mal.
      </p>
      <Link href="/panel" className="boton mt-5">Ir al panel</Link>
    </main>
  );
}
