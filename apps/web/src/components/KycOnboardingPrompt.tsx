import { Link } from "react-router-dom";
import { IconId, IconShield } from "../icons";
import { formatKycStatus, isKycVerified, kycPromptCopy, type KycStatus } from "../kycStatus";

type KycOnboardingPromptProps = {
  status: KycStatus | null | undefined;
  variant?: "banner" | "card" | "inline";
  className?: string;
};

export function KycOnboardingPrompt({
  status,
  variant = "card",
  className = "",
}: KycOnboardingPromptProps) {
  if (isKycVerified(status)) {
    return null;
  }

  const copy = kycPromptCopy(status);
  const kycPath = "/kyc";
  const walletPath = "/wallet";
  const ctaTo = status === "verified" ? walletPath : kycPath;

  if (variant === "inline") {
    return (
      <div className={`kyc-inline-prompt ${className}`.trim()} role="status">
        <p>{copy.body}</p>
        <Link to={kycPath} className="kyc-inline-link">
          {copy.cta}
        </Link>
      </div>
    );
  }

  const steps = [
    { label: "Upload ID", done: status === "in_progress" || status === "rejected" },
    { label: "Selfie check", done: status === "in_progress" },
    { label: "Wallet setup", done: false },
  ];

  return (
    <section
      className={`kyc-onboarding kyc-onboarding--${variant} kyc-onboarding--${copy.tone} ${className}`.trim()}
      aria-labelledby="kyc-onboarding-title"
    >
      <div className="kyc-onboarding-icon" aria-hidden>
        {status === "in_progress" ? <IconShield size={24} /> : <IconId />}
      </div>
      <div className="kyc-onboarding-copy">
        <p className="kyc-onboarding-eyebrow">{copy.eyebrow}</p>
        <h2 id="kyc-onboarding-title">{copy.title}</h2>
        <p>{copy.body}</p>
        <p className="kyc-onboarding-status">
          Current status: <strong>{formatKycStatus(status)}</strong>
        </p>
        {variant === "card" ? (
          <ol className="kyc-onboarding-steps" aria-label="Verification steps">
            {steps.map((step) => (
              <li key={step.label} className={step.done ? "done" : undefined}>
                <span aria-hidden>{step.done ? "✓" : "○"}</span>
                {step.label}
              </li>
            ))}
          </ol>
        ) : null}
        <div className="kyc-onboarding-actions">
          <Link to={ctaTo} className="kyc-onboarding-cta">
            {copy.cta}
          </Link>
          {status === "in_progress" ? (
            <Link to={walletPath} className="kyc-onboarding-secondary">
              Go to wallet
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function KycRequiredAlert({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="kyc-required-alert" role="alert">
      <p>{message}</p>
      <Link to="/kyc">Complete KYC verification</Link>
    </div>
  );
}
