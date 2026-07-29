import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { AssistantBar, CustomerAppShell, StepHeader } from "../components";
import { KycConsentModal } from "../components/KycConsentModal";
import { SelfieCapture } from "../components/SelfieCapture";
import { IconDoc } from "../icons";
import { runKycDemoFill } from "../kycDemoFill";
import {
  formatKycStatus,
  isKycPendingConsent,
  isKycVerified,
  kycStatusPillVariant,
  type KycStatus,
} from "../kycStatus";
import { useSession } from "../session";

const STEPS = ["Identity", "Verify", "Liveness", "Complete"] as const;
type StepLabel = (typeof STEPS)[number];
type StepState = "done" | "active" | "pending" | "submitted";

const DOC_LABELS: Record<string, string> = {
  passport: "Passport",
  driving_licence: "Driving Licence",
  national_id: "National ID",
};

function KycStatusPill({ status }: { status: KycStatus | null | undefined }) {
  const variant = kycStatusPillVariant(status);
  return (
    <span className={`kyc-status-pill kyc-status-pill--${variant}`}>
      <span className="kyc-status-pill-dot" aria-hidden />
      {formatKycStatus(status)}
    </span>
  );
}

function KycProgressCard({
  status,
  stepStates,
}: {
  status: KycStatus | null | undefined;
  stepStates: Record<StepLabel, StepState>;
}) {
  return (
    <section className="kyc-page-progress" aria-label="KYC progress">
      <div className="kyc-page-progress-edge" aria-hidden />
      <div className="kyc-page-progress-inner">
        <div className="kyc-page-progress-header">
          <h3>KYC Progress</h3>
          <KycStatusPill status={status} />
        </div>
        <ol className="kyc-page-stepper">
          {STEPS.map((label, index) => {
            const state = stepStates[label];
            return (
              <li key={label} className={state}>
                <span className="kyc-page-step-marker" aria-hidden>
                  {state === "done" || state === "submitted" ? "✓" : index + 1}
                </span>
                <span className="kyc-page-step-label">{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function useKycStepStates(
  kycStatus: KycStatus,
  uploaded: boolean,
  selfie: boolean,
): Record<StepLabel, StepState> {
  return useMemo(() => {
    if (isKycVerified(kycStatus)) {
      return {
        Identity: "done",
        Verify: "done",
        Liveness: "done",
        Complete: "done",
      };
    }

    if (kycStatus === "pending_consent") {
      return {
        Identity: "done",
        Verify: "done",
        Liveness: "done",
        Complete: "active",
      };
    }

    if (kycStatus === "in_progress") {
      return {
        Identity: "done",
        Verify: "done",
        Liveness: "done",
        Complete: "submitted",
      };
    }

    const completed: boolean[] = [true, uploaded, selfie, false];
    const firstOpen = completed.findIndex((step) => !step);
    const activeIndex = firstOpen === -1 ? STEPS.length - 1 : firstOpen;

    return STEPS.reduce(
      (acc, label, index) => {
        if (completed[index]) {
          acc[label] = "done";
        } else if (index === activeIndex) {
          acc[label] = "active";
        } else {
          acc[label] = "pending";
        }
        return acc;
      },
      {} as Record<StepLabel, StepState>,
    );
  }, [kycStatus, uploaded, selfie]);
}

export function KycPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registrationNote =
    (location.state as { registrationNote?: string } | null)?.registrationNote ?? null;
  const { token, user, updateUser } = useSession();
  const [documentType, setDocumentType] = useState("passport");
  const [uploaded, setUploaded] = useState(false);
  const [selfie, setSelfie] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoFilling, setDemoFilling] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const kycStatus = user?.kyc_status ?? "not_started";
  const stepStates = useKycStepStates(kycStatus, uploaded, selfie);
  const docLabel = DOC_LABELS[documentType] ?? "Document";

  useEffect(() => {
    if (isKycPendingConsent(kycStatus)) {
      setConsentOpen(true);
    }
  }, [kycStatus]);

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
          return;
        }
        if (isKycPendingConsent(res.kyc_status)) {
          setConsentOpen(true);
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

  useEffect(() => {
    if (!token || kycStatus !== "in_progress") return;
    const timer = window.setInterval(() => {
      void api
        .me(token)
        .then((res) => {
          updateUser(res);
          if (isKycPendingConsent(res.kyc_status)) {
            setConsentOpen(true);
          }
        })
        .catch(() => undefined);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [token, kycStatus, updateUser]);

  async function onDocumentSelected(file: File | null) {
    if (!file || !token) return;
    setDocUploading(true);
    setError(null);
    try {
      await api.uploadKycDocument(token, file);
      setUploaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document upload failed");
    } finally {
      setDocUploading(false);
    }
  }

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
      if (res.status === "pending_consent" || res.requires_consent) {
        setConsentOpen(true);
        return;
      }
      navigate("/", { state: { kycSubmitted: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC failed");
    } finally {
      setLoading(false);
    }
  }

  async function runDemoFill() {
    if (!token || demoFilling) return;
    setDemoFilling(true);
    setError(null);
    try {
      const result = await runKycDemoFill(token);
      setUploaded(result.uploaded);
      setSelfie(result.selfie);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo fill failed");
    } finally {
      setDemoFilling(false);
    }
  }

  async function approveConsent() {
    if (!token) return;
    setConsentLoading(true);
    setConsentError(null);
    try {
      const res = await api.acceptKycConsent(token);
      if (user) {
        updateUser({ ...user, kyc_status: res.status });
      }
      setConsentOpen(false);
      navigate("/wallet", { replace: true });
    } catch (err) {
      setConsentError(err instanceof Error ? err.message : "Could not save consent");
    } finally {
      setConsentLoading(false);
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
            We have received your identity check and our team is reviewing it. Wallet setup will
            unlock once you approve the digitisation consent after approval.
          </p>
          <KycProgressCard status={kycStatus} stepStates={stepStates} />
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

  if (kycStatus === "pending_consent") {
    return (
      <CustomerAppShell active="profile" className="kyc-screen">
        <StepHeader title="KYC Verification" />
        <section className="kyc-pending-panel" aria-labelledby="kyc-consent-pending-title">
          <p className="kyc-onboarding-eyebrow">Approval received</p>
          <h2 id="kyc-consent-pending-title">One more step — review consent terms</h2>
          <p>
            Your identity check has been approved. Review the UK digitisation and privacy consent
            terms, then approve to complete verification and unlock your wallet.
          </p>
          <KycProgressCard status={kycStatus} stepStates={stepStates} />
          <div className="kyc-onboarding-actions">
            <button type="button" className="kyc-onboarding-cta" onClick={() => setConsentOpen(true)}>
              Review consent terms
            </button>
          </div>
        </section>
        <KycConsentModal
          open={consentOpen}
          loading={consentLoading}
          error={consentError}
          approvalMode={user?.kyc_approval_mode}
          onApprove={() => void approveConsent()}
          onClose={() => setConsentOpen(false)}
        />
        <AssistantBar screen="kyc" />
      </CustomerAppShell>
    );
  }

  return (
    <CustomerAppShell active="profile" className="kyc-screen">
      <StepHeader title="KYC Verification" />

      {registrationNote ? <p className="kyc-page-note">{registrationNote}</p> : null}

      {kycStatus === "rejected" ? (
        <div className="kyc-required-alert" role="alert">
          <p>Your previous verification was not approved. Please upload your documents again.</p>
        </div>
      ) : null}

      <div className="kyc-page-toolbar">
        <button
          type="button"
          className="demo-fill-btn"
          disabled={demoFilling || loading || !token}
          onClick={() => void runDemoFill()}
        >
          {demoFilling ? "Filling…" : "Demo fill"}
        </button>
      </div>

      {demoFilling ? (
        <p className="demo-fill-banner" role="status">
          Uploading demo ID and selfie…
        </p>
      ) : null}

      <KycProgressCard status={kycStatus} stepStates={stepStates} />

      <form className="kyc-page-form" onSubmit={onSubmit}>
        <section className="kyc-page-card" aria-labelledby="kyc-doc-title">
          <div className="kyc-page-card-head">
            <h2 className="section-title" id="kyc-doc-title">
              Verify Your Identity
            </h2>
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
            className={`kyc-upload-zone${uploaded ? " ready" : ""}`}
            disabled={docUploading}
            onClick={() => docInputRef.current?.click()}
          >
            <div className="kyc-upload-zone-icon" aria-hidden>
              <IconDoc />
            </div>
            <div className="kyc-upload-zone-copy">
              <strong>{docLabel}</strong>
              <div className="kyc-upload-zone-hint">
                {docUploading ? "Uploading…" : uploaded ? "Front page ready" : "Tap to upload front page"}
              </div>
            </div>
            {uploaded ? <span className="kyc-upload-zone-badge">Ready</span> : null}
          </button>
          <input
            ref={docInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="kyc-selfie-file-input"
            onChange={(e) => {
              void onDocumentSelected(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </section>

        <section className="kyc-page-card kyc-page-card--selfie" aria-labelledby="kyc-selfie-title">
          <div className="kyc-page-card-head">
            <h2 className="section-title" id="kyc-selfie-title">
              Selfie Verification
            </h2>
            <p className="section-sub">Take a selfie to match your document</p>
          </div>
          {token ? (
            <SelfieCapture
              token={token}
              uploaded={selfie}
              onUploaded={() => setSelfie(true)}
              onClear={() => setSelfie(false)}
            />
          ) : (
            <p className="muted">Sign in to capture your selfie.</p>
          )}
        </section>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="btn-primary kyc-page-submit"
          type="submit"
          disabled={loading || demoFilling || !uploaded || !selfie}
        >
          {loading ? "Submitting…" : kycStatus === "rejected" ? "Resubmit verification" : "Continue"}
        </button>
      </form>

      <KycConsentModal
        open={consentOpen}
        loading={consentLoading}
        error={consentError}
        approvalMode={user?.kyc_approval_mode}
        onApprove={() => void approveConsent()}
        onClose={() => setConsentOpen(false)}
      />

      <AssistantBar screen="kyc" />
    </CustomerAppShell>
  );
}
