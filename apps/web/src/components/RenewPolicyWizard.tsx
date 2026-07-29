import { useEffect, useMemo, useState } from "react";
import {
  api,
  type CustomerPolicyRecord,
  type PolicyRenewalPreview,
  type QuoteEstimate,
} from "../api";
import { isRenewablePolicy } from "../customerPolicies";
import { CustomerPanel } from "../components";
import { PayQuoteButton } from "./PayQuoteButton";

type RenewPolicyWizardProps = {
  open: boolean;
  token: string;
  policies: CustomerPolicyRecord[];
  onClose: () => void;
  onRenewed: (policies: CustomerPolicyRecord[]) => void;
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

export function RenewPolicyWizard({
  open,
  token,
  policies,
  onClose,
  onRenewed,
}: RenewPolicyWizardProps) {
  const renewable = useMemo(() => policies.filter(isRenewablePolicy), [policies]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [preview, setPreview] = useState<PolicyRenewalPreview | null>(null);
  const [renewalQuote, setRenewalQuote] = useState<QuoteEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPolicy = renewable.find((p) => p.policy_id === selectedPolicyId);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPreview(null);
    setRenewalQuote(null);
    setError(null);
    const first = renewable[0]?.policy_id ?? "";
    setSelectedPolicyId(first);
  }, [open, renewable]);

  if (!open) return null;

  async function loadPreview(policyId: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.previewPolicyRenewal(token, policyId);
      setPreview(result);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load renewal preview");
    } finally {
      setLoading(false);
    }
  }

  async function createQuote() {
    if (!selectedPolicyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.createPolicyRenewalQuote(token, selectedPolicyId);
      setRenewalQuote(result.quote);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create renewal quote");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaid() {
    try {
      const refreshed = await api.getMyPolicies(token);
      onRenewed(refreshed.policies);
      onClose();
    } catch {
      onClose();
    }
  }

  return (
    <div className="cancel-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cancel-wizard"
        role="dialog"
        aria-labelledby="renew-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <CustomerPanel>
          <h2 id="renew-wizard-title" className="text-xl font-semibold text-lbg-green-dark">
            Renew policy
          </h2>
          <p className="text-sm text-lbg-muted mt-1">
            Extend your cover for the next term. A new Canton certificate is minted after payment.
          </p>

          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

          {step === 1 && (
            <div className="mt-4 space-y-4">
              {renewable.length === 0 ? (
                <p className="text-sm text-lbg-muted">No policies are due for renewal right now.</p>
              ) : (
                <>
                  <label className="block text-sm font-medium text-lbg-ink">
                    Select policy
                    <select
                      className="mt-1 w-full rounded-lg border border-lbg-border px-3 py-2"
                      value={selectedPolicyId}
                      onChange={(e) => setSelectedPolicyId(e.target.value)}
                    >
                      {renewable.map((p) => (
                        <option key={p.policy_id} value={p.policy_id}>
                          {p.product_title ?? p.policy_number} · expires {formatDate(p.cover_expires_at)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={loading || !selectedPolicyId}
                      onClick={() => loadPreview(selectedPolicyId)}
                    >
                      {loading ? "Loading…" : "Preview renewal"}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && preview && (
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <strong>{preview.product_title}</strong> · {preview.policy_number}
              </p>
              <p>
                Current cover ends: <strong>{formatDate(preview.current_cover_expires_at)}</strong>
              </p>
              <p>
                New cover starts: <strong>{formatDate(preview.proposed_cover_start_at)}</strong>
              </p>
              {preview.estimated_premium != null && (
                <p className="text-lg font-semibold text-lbg-green-dark">
                  Renewal premium: £{preview.estimated_premium.toFixed(2)}
                  {preview.price_unit ? ` ${preview.price_unit}` : ""}
                </p>
              )}
              <p className="text-lbg-muted">{preview.message}</p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={loading}
                  onClick={() => createQuote()}
                >
                  {loading ? "Creating quote…" : "Continue to payment"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
              </div>
            </div>
          )}

          {step === 3 && renewalQuote && (
            <div className="mt-4 space-y-4">
              <p className="text-sm">
                Quote <strong>{renewalQuote.quote_id}</strong> · £
                {renewalQuote.estimated_premium.toFixed(2)} {renewalQuote.price_unit}
              </p>
              <PayQuoteButton quote={renewalQuote} />
              <button type="button" className="btn btn-secondary" onClick={handlePaid}>
                Done
              </button>
            </div>
          )}

          {selectedPolicy && step === 1 && (
            <p className="mt-3 text-xs text-lbg-muted">
              Renewing {selectedPolicy.product_title ?? "policy"} ({selectedPolicy.policy_number})
            </p>
          )}
        </CustomerPanel>
      </div>
    </div>
  );
}
