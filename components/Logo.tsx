import { BRAND_NAME, BRAND_SUFFIX } from "@/lib/brand";

export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
      <polygon
        points="5,70 60,90 115,70 60,50"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="27" y="30" width="10" height="40" rx="5" fill="currentColor" />
      <rect x="41" y="15" width="10" height="55" rx="5" fill="currentColor" />
      <rect x="55" y="2" width="10" height="68" rx="5" fill="currentColor" />
      <rect x="69" y="15" width="10" height="55" rx="5" fill="currentColor" />
      <rect x="83" y="30" width="10" height="40" rx="5" fill="currentColor" />
    </svg>
  );
}

export default function Logo({
  markClassName = "h-12 w-12 text-brand-600",
  align = "center",
}: {
  markClassName?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`flex flex-col ${align === "center" ? "items-center text-center" : "items-start text-left"}`}
    >
      <LogoMark className={markClassName} />
      <p className="mt-2 font-serif text-xl font-bold tracking-wide text-slate-900">
        {BRAND_NAME.toUpperCase()}
      </p>
      <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-500">
        {BRAND_SUFFIX}
      </p>
    </div>
  );
}
