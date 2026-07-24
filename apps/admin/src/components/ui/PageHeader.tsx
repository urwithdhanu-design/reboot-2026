import { type LucideIcon, LayoutGrid } from 'lucide-react';
import { type ReactNode } from 'react';

export type PageMetric = {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

const metricTone: Record<NonNullable<PageMetric['tone']>, string> = {
  default: 'text-white',
  success: 'text-lbg-green-muted',
  warning: 'text-amber-200',
  danger: 'text-red-200',
};

export function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon = LayoutGrid,
  eyebrow = 'Reboot 2026 · Insurance Admin',
  metrics,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  eyebrow?: string;
  metrics?: PageMetric[];
}) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-lbg-sidebar via-lbg-green-dark to-lbg-green shadow-md">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-white/5" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-white/25" aria-hidden />

      <div className="relative px-5 py-5 sm:px-7 sm:py-6 lg:flex lg:items-start lg:justify-between lg:gap-6">
        <div className="flex gap-4 min-w-0 flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
            <Icon className="h-6 w-6 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/80">{subtitle}</p> : null}
          </div>
        </div>

        {actions ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 lg:mt-0 lg:shrink-0 lg:justify-end [&_button]:border-white/30 [&_button]:text-white [&_button:hover]:bg-white/10 [&_.bg-lbg-green-light]:bg-white/20 [&_.text-lbg-green-dark]:text-white">
            {actions}
          </div>
        ) : null}
      </div>

      {metrics && metrics.length > 0 ? (
        <div className="relative border-t border-white/10 bg-black/10 px-5 py-4 sm:px-7">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-none lg:flex lg:flex-wrap lg:gap-6">
            {metrics.map((m) => (
              <div key={m.label} className="min-w-[7rem]">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/55">{m.label}</dt>
                <dd className={`mt-0.5 text-xl font-bold tabular-nums sm:text-2xl ${metricTone[m.tone ?? 'default']}`}>
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </header>
  );
}

export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  className = '',
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div
      className={`mb-4 flex flex-wrap gap-1 rounded-xl border border-lbg-gray-100 bg-white p-1 shadow-sm ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              active
                ? 'bg-lbg-green text-white shadow-sm'
                : 'text-lbg-gray-600 hover:bg-lbg-gray-50 hover:text-lbg-black'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ContentPanel({
  title,
  description,
  toolbar,
  children,
  padding = false,
  className = '',
}: {
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  padding?: boolean;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-lbg-gray-100 bg-white shadow-sm ring-1 ring-black/[0.02] ${className}`}
    >
      <div className="h-1 bg-gradient-to-r from-lbg-sidebar via-lbg-green to-lbg-green-muted" aria-hidden />
      {(title || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-lbg-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            {title ? <h2 className="text-sm font-bold text-lbg-black">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs text-lbg-gray-400">{description}</p> : null}
          </div>
          {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      )}
      <div className={padding ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function AlertBanner({
  children,
  variant = 'error',
}: {
  children: ReactNode;
  variant?: 'error' | 'info' | 'success';
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    success: 'border-lbg-green-muted bg-lbg-green-light text-lbg-green-dark',
  };
  return (
    <p className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${styles[variant]}`} role="alert">
      {children}
    </p>
  );
}
