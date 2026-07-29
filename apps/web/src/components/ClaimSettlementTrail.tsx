import type { CustomerPolicyRecord, InsuranceClaim } from "../api";
import { ClaimEvaluationTimeline } from "./ClaimEvaluationTimeline";
import { SettlementReadinessPanel } from "./SettlementReadinessPanel";
import {
  resolvePolicySettlementChecks,
  settlementTrailSummary,
} from "../settlementReadiness";

function formatClaimStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ClaimSettlementTrail({
  claim,
  policy,
}: {
  claim: InsuranceClaim;
  policy?: CustomerPolicyRecord;
}) {
  const readinessChecks = resolvePolicySettlementChecks(policy);
  const evaluationSteps = claim.evaluation_steps ?? [];

  return (
    <div className="claim-settlement-trail">
      <header className="claim-settlement-trail-header">
        <div>
          <p className="claim-settlement-trail-id">{claim.id}</p>
          <p className="claim-settlement-trail-meta">
            {claim.policy_ref} · {formatClaimStatus(claim.status)} · £
            {Number(claim.amount_claimed).toFixed(2)}
          </p>
        </div>
        <p className="claim-settlement-trail-summary">{settlementTrailSummary(claim)}</p>
      </header>

      <SettlementReadinessPanel checks={readinessChecks} />

      {evaluationSteps.length > 0 ? (
        <section className="claim-settlement-eval" aria-labelledby="claim-settlement-eval-title">
          <h3 id="claim-settlement-eval-title" className="claim-settlement-eval-title">
            Claim processing & settlement
          </h3>
          <p className="claim-settlement-eval-desc">
            How your claim was validated, reviewed, and paid after submission.
          </p>
          <ClaimEvaluationTimeline steps={evaluationSteps} />
        </section>
      ) : (
        <p className="muted claim-settlement-eval-empty">
          Claim processing steps will appear here once evaluation begins.
        </p>
      )}

      {claim.payout_transaction_id ? (
        <p className="claim-settlement-payout" role="status">
          Wallet payout reference: <strong>{claim.payout_transaction_id}</strong>
        </p>
      ) : null}
      {claim.settlement_transaction_id ? (
        <p className="claim-settlement-payout" role="status">
          Ledger settlement: <strong>{claim.settlement_transaction_id}</strong>
        </p>
      ) : null}
    </div>
  );
}
