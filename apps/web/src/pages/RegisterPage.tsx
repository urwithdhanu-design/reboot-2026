import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { AssistantBar, StepHeader } from "../components";
import { IconLock, IconMail, IconPhone, IconShield, IconUser } from "../icons";
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
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <StepHeader title="Register" />
      <div className="hero-row">
        <div className="hero-copy">
          <h1>Register</h1>
          <p>Your trusted insurance partner, always with you.</p>
        </div>
        <div className="hero-art" aria-hidden>
          <IconShield size={52} />
        </div>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="fullName">Full Name</label>
          <div className="input-shell">
            <span className="icon">
              <IconUser />
            </span>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">Email Address</label>
          <div className="input-shell">
            <span className="icon">
              <IconMail />
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="mobile">Mobile Number</label>
          <div className="input-shell">
            <span className="icon">
              <IconPhone />
            </span>
            <input
              id="mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="input-shell">
            <span className="icon">
              <IconLock />
            </span>
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
          <label htmlFor="confirmPassword">Confirm password</label>
          <div className="input-shell">
            <span className="icon">
              <IconLock />
            </span>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />
          I agree to Terms &amp; Conditions
        </label>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="btn-primary"
          type="submit"
          disabled={loading || !terms || password.length < 8 || password !== confirmPassword}
        >
          {loading ? "Creating…" : "Create Account"}
        </button>
      </form>

      <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
        Already registered? <Link to="/login">Login</Link>
        {" · "}
        <Link to="/">Browse products</Link>
      </p>

      <AssistantBar screen="register" />
    </div>
  );
}
