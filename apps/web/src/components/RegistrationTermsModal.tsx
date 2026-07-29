import { useEffect, useRef } from "react";
import {
  REGISTRATION_TERMS_SECTIONS,
  type RegistrationTermsSectionId,
} from "../registrationTerms";

type RegistrationTermsModalProps = {
  open: boolean;
  focusSection?: RegistrationTermsSectionId | null;
  onClose: () => void;
};

export function RegistrationTermsModal({
  open,
  focusSection,
  onClose,
}: RegistrationTermsModalProps) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !focusSection) return;
    const node = sectionRefs.current[focusSection];
    if (!node) return;
    const timer = window.setTimeout(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      node.classList.add("register-terms-section-focus");
      window.setTimeout(() => node.classList.remove("register-terms-section-focus"), 1200);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [open, focusSection]);

  if (!open) return null;

  return (
    <div
      className="cancel-wizard-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="cancel-wizard kyc-consent-modal register-terms-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-terms-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cancel-wizard-header">
          <div>
            <p className="cancel-wizard-eyebrow">Account registration</p>
            <h2 id="register-terms-title">Terms, privacy &amp; risk governance</h2>
          </div>
          <button
            type="button"
            className="cancel-wizard-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="kyc-consent-body register-terms-body">
          <p className="kyc-consent-lead">
            Please review the following before creating your account. These summaries apply to
            customers in the United Kingdom.
          </p>
          <p className="muted kyc-consent-sub">
            UK GDPR · Data Protection Act 2018 · FCA conduct · Digitised insurance contracts
          </p>

          {REGISTRATION_TERMS_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={`register-terms-${section.id}`}
              ref={(node) => {
                sectionRefs.current[section.id] = node;
              }}
              className="register-terms-section"
              aria-labelledby={`register-terms-heading-${section.id}`}
            >
              <h3 id={`register-terms-heading-${section.id}`} className="register-terms-heading">
                {section.title}
              </h3>
              <p className="muted register-terms-eyebrow">{section.eyebrow}</p>
              <ul className="kyc-consent-list">
                {section.points.map((point) => (
                  <li key={point}>
                    <span className="kyc-consent-tick" aria-hidden>
                      ✓
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className="kyc-consent-actions">
            <button type="button" className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
