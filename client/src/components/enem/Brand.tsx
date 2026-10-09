import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export function EliteMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="ENEM ELITE">
      <span className="elite-mark" aria-hidden="true"><i /><b /></span>
      {!compact && (
        <span className="leading-none">
          <strong className="block text-sm tracking-[0.19em] text-white">ENEM</strong>
          <span className="block mt-1 text-[10px] font-bold tracking-[0.38em] text-cyan-300">ELITE</span>
        </span>
      )}
    </div>
  );
}

export function Pill({ children, tone = "violet" }: { children: ReactNode; tone?: "violet" | "cyan" | "green" | "amber" | "slate" }) {
  return <span className={`elite-pill elite-pill-${tone}`}>{children}</span>;
}

export function Metric({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: string; icon?: ReactNode }) {
  return (
    <article className="metric-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
        {icon ? <span className="text-violet-300">{icon}</span> : null}
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-white">{value}</p>
      {detail ? <p className="mt-2 text-xs text-slate-400">{detail}</p> : null}
    </article>
  );
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="section-title">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SuccessLine({ children }: { children: ReactNode }) {
  return <p className="flex items-start gap-2 text-sm leading-6 text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{children}</p>;
}
