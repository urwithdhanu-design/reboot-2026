import { useEffect, useState } from "react";
import { KYC_DIGITISATION_CONSENT_POINTS } from "../kycConsentTerms";

type KycConsentModalProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  approvalMode?: string | null;
  onApprove: () => void;
  onClose?: () => void;
};

export function KycConsentModal({
  open,
  loading,
  error,
  approvalMode,
  onApprove,
  onClose,
}: KycConsentModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (open) setAcknowledged(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading && onClose) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  const approvalNote =
    approvalMode === "auto_agent"
      ? "Your identity check was auto-approved. Review and accept the terms below to complete verification."
      : approvalMode === "manual_admin"
        ? "Your identity check was approved by our team. Review and accept the terms below to complete verification."
        : "Your identity check is ready. Review and accept the terms below to complete verification.";

  return (
    <div
      className="cancel-wizard-backdrop"
      role="presentation"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="cancel-wizard kyc-consent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-consent-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cancel-wizard-header">
          <div>
            <p className="cancel-wizard-eyebrow">Identity verification</p>
            <h2 id="kyc-consent-title">Digitisation &amp; privacy consent</h2>
          </div>
          {onClose ? (
            <button
              type="button"
              className="cancel-wizard-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            >
              ×
            </button>
          ) : null}
        </header>

        <div className="kyc-consent-body">
          <p className="kyc-consent-lead">{approvalNote}</p>
          <p className="muted kyc-consent-sub">
            UK GDPR · Data Protection Act 2018 · Insurance digitisation
          </p>

          <ul className="kyc-consent-list">
            {KYC_DIGITISATION_CONSENT_POINTS.map((point) => (
              <li key={point}>
                <span className="kyc-consent-tick" aria-hidden>
                  ✓
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <label className="kyc-consent-ack">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={loading}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>
              I have read and agree to all of the above consent terms. I understand my KYC will
              only be marked verified after I approve.
            </span>
          </label>

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="kyc-consent-actions">
            {onClose ? (
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Not now
              </button>
            ) : null}
            <button
              type="button"
              className="btn-primary"
              disabled={loading || !acknowledged}
              onClick={onApprove}
            >
              {loading ? "Saving…" : "Approve & complete KYC"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
