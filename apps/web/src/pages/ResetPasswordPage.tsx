import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { AssistantBar, StepHeader } from "../components";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is missing a token. Request a new one from Forgot password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <StepHeader title="Reset password" />
      <div className="hero-copy">
        <h1>Choose a new password</h1>
        <p>Use at least 8 characters. You&apos;ll sign in with this next time.</p>
      </div>

      {done ? (
        <div className="stack">
          <p className="manage-notice" role="status">
            Your password has been updated. You can sign in now.
          </p>
          <button className="btn-primary" type="button" onClick={() => navigate("/login")}>
            Go to login
          </button>
        </div>
      ) : (
        <form className="stack" onSubmit={onSubmit}>
          {!token ? (
            <p className="error" role="alert">
              Invalid reset link. Please request a new one.
            </p>
          ) : null}

          <div className="field">
            <label htmlFor="password">New password</label>
            <div className="input-shell">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="link-quiet"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <div className="input-shell">
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="btn-primary" type="submit" disabled={loading || !token}>
            {loading ? "Updating…" : "Update password"}
          </button>

          <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
            <Link to="/forgot-password">Request a new link</Link>
            {" · "}
            <Link to="/login">Back to login</Link>
          </p>
        </form>
      )}

      <AssistantBar screen="reset" />
    </div>
  );
}
