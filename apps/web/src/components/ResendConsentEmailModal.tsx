import { useEffect, useState } from "react";

type ResendConsentEmailModalProps = {
  open: boolean;
  initialEmail: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (email: string) => void;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ResendConsentEmailModal({
  open,
  initialEmail,
  loading,
  error,
  onClose,
  onSubmit,
}: ResendConsentEmailModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail(initialEmail);
    setValidationError(null);
  }, [open, initialEmail]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  function handleSubmit() {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setValidationError("Enter a valid email address");
      return;
    }
    setValidationError(null);
    onSubmit(trimmed);
  }

  return (
    <div className="cancel-wizard-backdrop" role="presentation" onClick={loading ? undefined : onClose}>
      <div
        className="cancel-wizard resend-consent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resend-consent-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cancel-wizard-header">
          <div>
            <p className="cancel-wizard-eyebrow">Wallet approval</p>
            <h2 id="resend-consent-title">Resend approval email</h2>
          </div>
          <button
            type="button"
            className="cancel-wizard-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="resend-consent-body">
          <p className="muted resend-consent-lead">
            Enter the email address where we should send the wallet approval link. The subject line
            will be <strong>Approve your wallet · Reboot 2026 Insurance</strong>.
          </p>

          <label className="resend-consent-field">
            <span className="resend-consent-label">Email address</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              disabled={loading}
              onChange={(event) => {
                setEmail(event.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </label>

          {validationError ? (
            <p className="error" role="alert">
              {validationError}
            </p>
          ) : null}
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="resend-consent-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Sending…" : "Send approval email"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
