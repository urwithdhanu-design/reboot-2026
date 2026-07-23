import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import {
  AssistantBar,
  AuthError,
  AuthLayout,
  AuthSuccess,
} from "../components";

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(identifier.trim());
      setSent(true);
      setEmailed(Boolean(res.emailed));
      setDevResetUrl(res.dev_reset_url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start password reset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
        eyebrow="Account recovery"
        title={sent ? "Check your inbox" : "Forgot password?"}
        lead={
          sent
            ? "We’ve processed your request. Follow the link in your email to choose a new password."
            : "Enter the email or phone number on your account. We’ll send secure reset instructions."
        }
        backTo="/login"
        backLabel="Back to sign in"
        footer={
          !sent ? (
            <p style={{ margin: 0 }}>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          ) : null
        }
        assistant={<AssistantBar screen="forgot" />}
      >
        {sent ? (
          <AuthSuccess title="Reset link sent">
            <p>
              {emailed
                ? "If an account exists for that email or number, you’ll receive an email shortly. The link expires after 30 minutes."
                : "If an account exists, use the demo link below (email is not configured in this environment)."}
            </p>
            {devResetUrl ? (
              <p style={{ margin: "0 0 16px", wordBreak: "break-all", fontSize: "0.85rem" }}>
                <Link
                  to={
                    devResetUrl.includes("/reset-password")
                      ? `/reset-password${devResetUrl.slice(devResetUrl.indexOf("?"))}`
                      : "/forgot-password"
                  }
                >
                  Open password reset page
                </Link>
              </p>
            ) : null}
            <Link to="/login" className="btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Return to sign in
            </Link>
          </AuthSuccess>
        ) : (
          <form className="stack" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="identifier">Email or mobile</label>
              <div className="input-shell">
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
              <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.78rem" }}>
                For your security, we won’t confirm whether this account exists.
              </p>
            </div>

            {error ? <AuthError message={error} /> : null}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </AuthLayout>
  );
}
