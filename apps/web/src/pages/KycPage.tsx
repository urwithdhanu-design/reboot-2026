import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { AssistantBar, CustomerAppShell, StepHeader } from "../components";
import { IconDoc } from "../icons";
import { formatKycStatus, isKycVerified } from "../kycStatus";
import { useSession } from "../session";

const STEPS = ["Identity", "Verify", "Liveness", "Complete"] as const;

export function KycPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registrationNote =
    (location.state as { registrationNote?: string } | null)?.registrationNote ?? null;
  const { token, user, updateUser } = useSession();
  const [documentType, setDocumentType] = useState("passport");
  const [uploaded, setUploaded] = useState(true);
  const [selfie, setSelfie] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const kycStatus = user?.kyc_status ?? "not_started";

  useEffect(() => {
    if (!token) {
      setRefreshing(false);
      return;
    }
    let alive = true;
    void api
      .me(token)
      .then((res) => {
        if (!alive) return;
        updateUser(res);
        if (isKycVerified(res.kyc_status)) {
          navigate("/wallet", { replace: true });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setRefreshing(false);
      });
    return () => {
      alive = false;
    };
  }, [token, navigate, updateUser]);

  const progress = useMemo(
    () => ({
      Identity: kycStatus === "not_started" ? "pending" : "done",
      Verify: kycStatus === "in_progress" || isKycVerified(kycStatus) ? "done" : uploaded ? "done" : "pending",
      Liveness: kycStatus === "in_progress" || isKycVerified(kycStatus) ? "done" : selfie ? "pending" : "pending",
      Complete: isKycVerified(kycStatus) ? "done" : kycStatus === "in_progress" ? "submitted" : "pending",
    }),
    [uploaded, selfie, kycStatus],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.submitKyc(token, {
        document_type: documentType,
        document_uploaded: uploaded,
        selfie_captured: selfie,
      });
      if (user) {
        updateUser({ ...user, kyc_status: res.status });
      }
      if (res.status === "verified") {
        navigate("/wallet", { replace: true });
        return;
      }
      navigate("/", { state: { kycSubmitted: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC failed");
    } finally {
      setLoading(false);
    }
  }

  if (refreshing) {
    return (
      <CustomerAppShell active="profile">
        <StepHeader title="KYC Verification" />
        <p className="muted">Loading verification status…</p>
      </CustomerAppShell>
    );
  }

  if (kycStatus === "in_progress") {
    return (
      <CustomerAppShell active="profile" className="kyc-screen">
        <StepHeader title="KYC Verification" />
        <section className="kyc-pending-panel" aria-labelledby="kyc-pending-title">
          <p className="kyc-onboarding-eyebrow">Verification in progress</p>
          <h2 id="kyc-pending-title">Your documents are being reviewed</h2>
          <p>
            We have received your identity check and our team is reviewing it. Wallet setup will unlock
            once verification is approved.
          </p>
          <p className="kyc-onboarding-status">
            Current status: <strong>{formatKycStatus(kycStatus)}</strong>
          </p>
          <div className="progress-block">
            <h3>KYC Progress</h3>
            <div className="progress-track">
              {STEPS.map((label, index) => {
                const done = progress[label] === "done" || progress[label] === "submitted" || index < 3;
                return (
                  <div className="progress-step" key={label}>
                    <div className={`progress-dot${done ? " done" : ""}`}>
                      {done ? "✓" : index + 1}
                    </div>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="kyc-onboarding-actions">
            <Link to="/" className="kyc-onboarding-cta">
              Back to home
            </Link>
            <Link to="/wallet" className="kyc-onboarding-secondary">
              Go to wallet
            </Link>
          </div>
        </section>
        <AssistantBar screen="kyc" />
      </CustomerAppShell>
    );
  }

  return (
    <CustomerAppShell active="profile" className="kyc-screen">
      <StepHeader title="KYC Verification" />

      {registrationNote ? (
        <p className="muted" style={{ margin: "0 0 12px", fontSize: "0.9rem" }}>
          {registrationNote}
        </p>
      ) : null}

      {kycStatus === "rejected" ? (
        <div className="kyc-required-alert" role="alert">
          <p>Your previous verification was not approved. Please upload your documents again.</p>
        </div>
      ) : null}

      <div className="progress-block">
        <h3>KYC Progress</h3>
        <p className="kyc-onboarding-status" style={{ marginBottom: 12 }}>
          Current status: <strong>{formatKycStatus(kycStatus)}</strong>
        </p>
        <div className="progress-track">
          {STEPS.map((label, index) => {
            const done = progress[label] === "done" || index < 2;
            return (
              <div className="progress-step" key={label}>
                <div className={`progress-dot${done ? " done" : ""}`}>
                  {done ? "✓" : index === 2 ? "1" : "i"}
                </div>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <div>
          <h2 className="section-title">Verify Your Identity</h2>
          <p className="section-sub">Take a clear photo of your document</p>
        </div>

        <div className="field">
          <label htmlFor="docType">Document Type</label>
          <div className="input-shell">
            <select
              id="docType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="passport">Passport</option>
              <option value="driving_licence">Driving Licence</option>
              <option value="national_id">National ID</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="upload-card"
          onClick={() => setUploaded(true)}
        >
          <div className="upload-icon">
            <IconDoc />
          </div>
          <div>
            <strong>Passport</strong>
            <div className="muted" style={{ fontSize: "0.82rem" }}>
              {uploaded ? "Front page ready" : "Upload front page"}
            </div>
          </div>
        </button>

        <div className="selfie-row">
          <div>
            <h2 className="section-title">Selfie Verification</h2>
            <p className="section-sub">Take a selfie to match your document</p>
          </div>
          <button
            type="button"
            className="selfie-avatar"
            aria-label="Capture selfie"
            onClick={() => setSelfie(true)}
            style={{
              background:
                "linear-gradient(145deg, #c8ddd3, #8fb9a5)",
              border: "3px solid #e6f3ee",
            }}
          />
        </div>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Submitting…" : kycStatus === "rejected" ? "Resubmit verification" : "Continue"}
        </button>
      </form>

      <AssistantBar screen="kyc" />
    </CustomerAppShell>
  );
}
