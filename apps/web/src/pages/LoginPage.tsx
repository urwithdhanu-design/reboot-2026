import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import {
  AssistantBar,
  AuthError,
  AuthLayout,
} from "../components";
import { IconLock, IconMail } from "../icons";
import { useSession } from "../session";

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setSession } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ identifier, password });
      setSession(res.access_token, res.user);
      const next = params.get("next");
      navigate(next && next.startsWith("/") ? next : "/kyc");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
        eyebrow="Customer account"
        title="Welcome back"
        lead="Sign in to manage policies, complete verification, and access your digital wallet."
        footer={
          <p style={{ margin: 0 }}>
            New to Reboot 2026? <Link to="/register">Create an account</Link>
            {" · "}
            <Link to="/">Explore products</Link>
          </p>
        }
        assistant={<AssistantBar screen="login" />}
      >
        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="identifier">Email or mobile</label>
            <div className="input-shell">
              <span className="icon" aria-hidden>
                <IconMail />
              </span>
              <input
                id="identifier"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="you@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-shell">
              <span className="icon" aria-hidden>
                <IconLock />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="link-quiet"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="row-between">
            <label className="auth-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="link-quiet">
              Forgot password?
            </Link>
          </div>

          {error ? <AuthError message={error} /> : null}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="auth-divider">or continue with</div>
          <div className="auth-social-row" role="group" aria-label="Social sign-in (coming soon)">
            <button type="button" className="auth-social-btn" disabled title="Coming soon" aria-label="Google">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.8 14.5 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
                />
              </svg>
            </button>
            <button type="button" className="auth-social-btn" disabled title="Coming soon" aria-label="Apple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#111" aria-hidden>
                <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 3 2.3 1.2-.1 1.6-.7 3.1-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.7-3.1zM14.2 5.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z" />
              </svg>
            </button>
            <button type="button" className="auth-social-btn" disabled title="Coming soon" aria-label="Microsoft">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
                <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
                <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
                <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
              </svg>
            </button>
          </div>
        </form>
      </AuthLayout>
  );
}
