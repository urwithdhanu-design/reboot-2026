import type { ReactNode } from "react";

export type CustomerMetric = {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "danger";
};

const metricTone: Record<NonNullable<CustomerMetric["tone"]>, string> = {
  default: "customer-metric-value",
  success: "customer-metric-value customer-metric-value--success",
  warning: "customer-metric-value customer-metric-value--warning",
  danger: "customer-metric-value customer-metric-value--danger",
};

export function CustomerPageHeader({
  title,
  subtitle,
  eyebrow = "Insure360 · Your cover",
  icon,
  metrics,
  actions,
  accent = "green",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: ReactNode;
  metrics?: CustomerMetric[];
  actions?: ReactNode;
  accent?: "green" | "teal" | "slate";
}) {
  return (
    <header className={`customer-hero customer-hero--${accent}`}>
      <div className="customer-hero-orbs" aria-hidden>
        <span className="customer-hero-orb customer-hero-orb-a" />
        <span className="customer-hero-orb customer-hero-orb-b" />
        <span className="customer-hero-orb customer-hero-orb-c" />
      </div>
      <div className="customer-hero-shine" aria-hidden />

      <div className="customer-hero-body">
        <div className="customer-hero-top">
          <div className="customer-hero-icon-wrap">{icon}</div>
          <div className="customer-hero-copy">
            <p className="customer-hero-eyebrow">{eyebrow}</p>
            <h1 className="customer-hero-title">{title}</h1>
            {subtitle ? <p className="customer-hero-sub">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="customer-hero-actions">{actions}</div> : null}
      </div>

      {metrics && metrics.length > 0 ? (
        <div className="customer-hero-metrics">
          <dl className="customer-hero-metrics-grid">
            {metrics.map((m) => (
              <div key={m.label} className="customer-metric-tile">
                <dt>{m.label}</dt>
                <dd className={metricTone[m.tone ?? "default"]}>{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </header>
  );
}

export function CustomerTabs<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={`customer-tabs ${className}`} role="tablist">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`customer-tab${active ? " active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function CustomerPanel({
  title,
  description,
  toolbar,
  children,
  padding = true,
  className = "",
}: {
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  padding?: boolean;
  className?: string;
}) {
  return (
    <section className={`customer-panel ${className}`}>
      <div className="customer-panel-edge" aria-hidden />
      {(title || toolbar) && (
        <div className="customer-panel-head">
          <div>
            {title ? <h2 className="customer-panel-title">{title}</h2> : null}
            {description ? <p className="customer-panel-desc">{description}</p> : null}
          </div>
          {toolbar ? <div className="customer-panel-toolbar">{toolbar}</div> : null}
        </div>
      )}
      <div className={padding ? "customer-panel-body" : "customer-panel-body customer-panel-body--flush"}>
        {children}
      </div>
    </section>
  );
}

export function HeaderIconHome() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="m4 11 8-7 8 7" />
      <path d="M6.5 10.5V19h11v-8.5" />
    </svg>
  );
}

export function HeaderIconPolicies() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
    </svg>
  );
}

export function HeaderIconClaims() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="m8.5 12 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

export function HeaderIconWallet() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="6.5" width="17" height="12" rx="2.5" />
      <path d="M3.5 10h17" />
    </svg>
  );
}

export function HeaderIconProfile() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.8-3.2 4-4.8 7-4.8S17.2 15.8 19 19" />
    </svg>
  );
}
