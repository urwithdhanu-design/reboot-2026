import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import {
  AssistantBar,
  AuthError,
  AuthLayout,
  PasswordStrength,
} from "../components";
import { IconLock, IconMail, IconPhone, IconUser } from "../icons";
import { useSession } from "../session";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setSession } = useSession();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    terms &&
    fullName.trim().length > 1 &&
    password.length >= 8 &&
    password === confirmPassword;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await api.register({
        full_name: fullName,
        email,
        mobile_number: mobile,
        terms_accepted: terms,
        password,
      });
      setSession(res.access_token, res.user);
      navigate("/kyc");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
        eyebrow="Get started"
        title="Create your account"
        lead="Join in minutes. We’ll guide you through secure identity verification before you buy cover."
        backLabel="Back"
        footer={
          <p style={{ margin: 0 }}>
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        }
        assistant={<AssistantBar screen="register" />}
      >
        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <div className="input-shell">
              <span className="icon" aria-hidden>
                <IconUser />
              </span>
              <input
                id="fullName"
                autoComplete="name"
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <div className="input-shell">
              <span className="icon" aria-hidden>
                <IconMail />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="mobile">Mobile number</label>
            <div className="input-shell">
              <span className="icon" aria-hidden>
                <IconPhone />
              </span>
              <input
                id="mobile"
                type="tel"
                autoComplete="tel"
                placeholder="+44 7700 900000"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
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
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
            <PasswordStrength password={password} />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="input-shell">
              <span className="icon" aria-hidden>
                <IconLock />
              </span>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {confirmPassword && password !== confirmPassword ? (
              <p className="error" style={{ margin: "4px 0 0", fontSize: "0.8rem" }}>
                Passwords do not match
              </p>
            ) : null}
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            I agree to the Terms &amp; Conditions and Privacy Policy
          </label>

          {error ? <AuthError message={error} /> : null}

          <button className="btn-primary" type="submit" disabled={loading || !canSubmit}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </AuthLayout>
  );
}
