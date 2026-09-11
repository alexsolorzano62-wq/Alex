export default function CampoTexto({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">{ayuda}</span>}
    </label>
  );
}

export const claseInput =
  "w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
