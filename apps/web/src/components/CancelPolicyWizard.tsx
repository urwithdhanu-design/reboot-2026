import { useEffect, useMemo, useState } from "react";
import {
  api,
  type CustomerPolicyRecord,
  type PolicyCancelPreview,
} from "../api";
import { isCancelledPolicy, isCancellablePolicy } from "../customerPolicies";
import { CustomerPanel } from "../components";

const CANCEL_REASONS = [
  { value: "no_longer_needed", label: "No longer need cover" },
  { value: "found_alternative", label: "Found alternative cover" },
  { value: "too_expensive", label: "Premium too high" },
  { value: "moving_abroad", label: "Moving abroad" },
  { value: "other", label: "Other" },
] as const;

type CancelReason = (typeof CANCEL_REASONS)[number]["value"];

type CancelPolicyWizardProps = {
  open: boolean;
  token: string;
  policies: CustomerPolicyRecord[];
  onClose: () => void;
  onCancelled: (policies: CustomerPolicyRecord[]) => void;
};

export function CancelPolicyWizard({
  open,
  token,
  policies,
  onClose,
  onCancelled,
}: CancelPolicyWizardProps) {
  const cancellable = useMemo(
    () => policies.filter(isCancellablePolicy),
    [policies],
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [preview, setPreview] = useState<PolicyCancelPreview | null>(null);
  const [reason, setReason] = useState<CancelReason>(CANCEL_REASONS[0].value);
  const [customerNote, setCustomerNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedPolicy = cancellable.find((p) => p.policy_id === selectedPolicyId);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPreview(null);
    setError(null);
    setSuccessMessage(null);
    setCustomerNote("");
    setReason(CANCEL_REASONS[0].value);
    const first = cancellable[0]?.policy_id ?? "";
    setSelectedPolicyId(first);
  }, [open, cancellable]);

  if (!open) return null;

  async function loadPreview(policyId: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.previewPolicyCancel(token, policyId);
      setPreview(result);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load cancellation preview");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCancel() {
    if (!selectedPolicyId || !preview) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.cancelPolicy(token, selectedPolicyId, {
        reason,
        customer_note: customerNote.trim() || undefined,
        confirm_refund_amount_gbp: preview.refund_estimate_gbp,
      });
      setSuccessMessage(result.message);
      setStep(3);
      const refreshed = await api.getMyPolicies(token);
      onCancelled(refreshed.policies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cancel-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cancel-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cancel-wizard-header">
          <div>
            <p className="cancel-wizard-eyebrow">Cancel policy</p>
            <h2 id="cancel-wizard-title">Cancel your cover</h2>
          </div>
          <button type="button" className="cancel-wizard-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <ol className="cancel-wizard-steps" aria-label="Cancellation steps">
          <li className={step >= 1 ? "active" : ""}>Select policy</li>
          <li className={step >= 2 ? "active" : ""}>Review refund</li>
          <li className={step >= 3 ? "active" : ""}>Confirm</li>
        </ol>

        {error ? (
          <p className="error cancel-wizard-error" role="alert">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <CustomerPanel title="Choose a policy" description="Select the policy you want to cancel" padding>
            {cancellable.length === 0 ? (
              <p className="muted">
                You have no policies eligible for online cancellation. Cancelled policies and
                policies with open claims cannot be cancelled here.
              </p>
            ) : (
              <div className="cancel-policy-picker">
                {cancellable.map((policy) => (
                  <button
                    key={policy.policy_id}
                    type="button"
                    className={`cancel-policy-option${
                      selectedPolicyId === policy.policy_id ? " cancel-policy-option--selected" : ""
                    }`}
                    onClick={() => setSelectedPolicyId(policy.policy_id)}
                  >
                    <strong>{policy.product_title ?? policy.policy_number}</strong>
                    <span>{policy.policy_number}</span>
                    {isCancelledPolicy(policy) ? (
                      <span className="policy-status-badge policy-status-badge--expired">Cancelled</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
            <div className="cancel-wizard-actions">
              <button type="button" className="btn-link" onClick={onClose}>
                Keep my policy
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!selectedPolicyId || loading || cancellable.length === 0}
                onClick={() => void loadPreview(selectedPolicyId)}
              >
                {loading ? "Loading…" : "Continue"}
              </button>
            </div>
          </CustomerPanel>
        ) : null}

        {step === 2 && preview ? (
          <CustomerPanel title="Refund preview" description="Review before you confirm cancellation" padding>
            <div className="cancel-preview-box">
              <p>
                <strong>{preview.product_title ?? selectedPolicy?.product_title}</strong>
                <span className="muted"> · {preview.policy_number}</span>
              </p>
              {preview.eligible ? (
                <>
                  <p className="cancel-refund-amount">
                    Estimated refund:{" "}
                    <strong>£{preview.refund_estimate_gbp.toFixed(2)}</strong>
                  </p>
                  {preview.refund_message ? <p className="muted">{preview.refund_message}</p> : null}
                  {preview.cooling_off ? (
                    <p className="muted">
                      Cooling-off: {preview.cooling_off_days_remaining ?? 0} day(s) remaining
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="error" role="alert">
                  {preview.ineligible_reason ?? "This policy cannot be cancelled online."}
                </p>
              )}
            </div>

            {preview.eligible ? (
              <div className="cancel-confirm-form">
                <label>
                  Reason for cancellation
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as CancelReason)}
                    disabled={loading}
                  >
                    {CANCEL_REASONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Additional notes (optional)
                  <textarea
                    rows={3}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Tell us anything else we should know"
                    disabled={loading}
                  />
                </label>
              </div>
            ) : null}

            <div className="cancel-wizard-actions">
              <button type="button" className="btn-link" onClick={() => setStep(1)} disabled={loading}>
                Back
              </button>
              {preview.eligible ? (
                <button
                  type="button"
                  className="btn-primary btn-danger"
                  disabled={loading}
                  onClick={() => void confirmCancel()}
                >
                  {loading ? "Cancelling…" : "Confirm cancellation"}
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={onClose}>
                  Close
                </button>
              )}
            </div>
          </CustomerPanel>
        ) : null}

        {step === 3 ? (
          <CustomerPanel title="Cancellation confirmed" description="Your policy has been cancelled" padding>
            <p className="manage-notice" role="status">
              {successMessage ?? "Your policy has been cancelled."}
            </p>
            {preview && preview.refund_estimate_gbp > 0 ? (
              <p className="muted">
                Refund of £{preview.refund_estimate_gbp.toFixed(2)} is being processed. You will receive
                a confirmation email shortly.
              </p>
            ) : null}
            <div className="cancel-wizard-actions">
              <button type="button" className="btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </CustomerPanel>
        ) : null}
      </div>
    </div>
  );
}
