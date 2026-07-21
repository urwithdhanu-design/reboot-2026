import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { AssistantBar, StepHeader } from "../components";

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
    <div className="screen">
      <StepHeader title="Forgot password" />
      <div className="hero-copy">
        <h1>Reset your password</h1>
        <p>Enter the email or phone on your account and we&apos;ll send a reset link.</p>
      </div>

      {sent ? (
        <div className="stack">
          <p className="manage-notice" role="status">
            {emailed
              ? "If an account exists, reset instructions are on their way. Check your inbox."
              : "If an account exists, a reset link is ready below (email is not configured in this environment)."}
          </p>
          {devResetUrl ? (
            <p className="muted" style={{ margin: 0, wordBreak: "break-all" }}>
              Demo reset link:{" "}
              <Link to={devResetUrl.includes("/reset-password")
                ? `/reset-password${devResetUrl.slice(devResetUrl.indexOf("?"))}`
                : "/forgot-password"}>
                Open reset page
              </Link>
            </p>
          ) : null}
          <Link to="/login" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
            Back to login
          </Link>
        </div>
      ) : (
        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="identifier">Email / Phone</label>
            <div className="input-shell">
              <input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>

          <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
            Remembered it? <Link to="/login">Back to login</Link>
          </p>
        </form>
      )}

      <AssistantBar screen="forgot" />
    </div>
  );
}
