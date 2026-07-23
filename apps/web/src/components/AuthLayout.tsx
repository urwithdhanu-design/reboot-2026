import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { IconShield } from "../icons";

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  footer?: ReactNode;
  backTo?: string;
  backLabel?: string;
  assistant?: ReactNode;
};

export function AuthLayout({
  eyebrow,
  title,
  lead,
  children,
  footer,
  backTo = "/",
  backLabel = "Back to home",
  assistant,
}: AuthLayoutProps) {
  return (
    <div className="screen screen-auth">
      <header className="auth-top">
        <Link to={backTo} className="auth-back">
          <span aria-hidden>←</span>
          {backLabel}
        </Link>
        <div className="auth-brand" aria-label="Reboot 2026 Insurance">
          <span className="auth-brand-mark" aria-hidden>
            <IconShield size={22} />
          </span>
          <span className="auth-brand-text">
            <strong>Reboot 2026</strong>
            <span>Insurance</span>
          </span>
        </div>
      </header>

      <div className="auth-hero">
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-lead">{lead}</p>
      </div>

      <div className="auth-card">{children}</div>

      <ul className="auth-trust" aria-label="Security and compliance">
        <li>
          <span className="auth-trust-icon" aria-hidden>
            🔒
          </span>
          Bank-grade encryption
        </li>
        <li>
          <span className="auth-trust-icon" aria-hidden>
            ✓
          </span>
          Verified KYC onboarding
        </li>
        <li>
          <span className="auth-trust-icon" aria-hidden>
            24/7
          </span>
          Support when you need it
        </li>
      </ul>

      {footer ? <footer className="auth-footer">{footer}</footer> : null}
      {assistant}
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="auth-alert auth-alert-error" role="alert">
      <span className="auth-alert-icon" aria-hidden>
        !
      </span>
      <p>{message}</p>
    </div>
  );
}

export function AuthSuccess({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth-success" role="status">
      <div className="auth-success-icon" aria-hidden>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 12.5l2.5 2.5L16 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="auth-success-title">{title}</h2>
      <div className="auth-success-body">{children}</div>
    </div>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ["Too weak", "Fair", "Good", "Strong"];
  const idx = Math.min(score, 3);

  return (
    <div className="auth-pw-strength" aria-live="polite">
      <div className="auth-pw-bars" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i <= idx ? "on" : ""} style={i <= idx ? { flex: 1 } : undefined} />
        ))}
      </div>
      <p className="auth-pw-label">
        Password strength: <strong>{labels[idx]}</strong>
      </p>
    </div>
  );
}
