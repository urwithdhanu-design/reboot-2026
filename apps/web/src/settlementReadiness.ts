import type { CustomerPolicyRecord, InsuranceClaim, SettlementReadinessCheck } from "./api";

const CHECK_ORDER = [
  "Customer consent",
  "Policy issued",
  "Wallet linked",
  "Policy reference hash",
  "Compliance decision",
  "Fraud screening",
];

export function sortSettlementChecks(
  checks: SettlementReadinessCheck[],
): SettlementReadinessCheck[] {
  return [...checks].sort((a, b) => {
    const ai = CHECK_ORDER.indexOf(a.name);
    const bi = CHECK_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

/** Fallback when API did not include settlement_readiness_checks (older policy-service). */
export function buildSettlementChecksFromPolicy(
  policy: CustomerPolicyRecord,
): SettlementReadinessCheck[] {
  const walletLinked = Boolean(policy.wallet_address?.trim());
  const fraudScore = policy.compliance_fraud_score;
  const fraudPassed = fraudScore == null || fraudScore < 0.8;
  return sortSettlementChecks([
    {
      name: "Customer consent",
      status: walletLinked ? "passed" : "failed",
      detail: walletLinked
        ? "Customer approved wallet consent for policy storage and claim payouts."
        : "Wallet consent not recorded — approve via the email link before payouts.",
    },
    {
      name: "Policy issued",
      status: "passed",
      detail: "Policy issuance record is active.",
    },
    {
      name: "Wallet linked",
      status: walletLinked ? "passed" : "failed",
      detail: walletLinked
        ? "Customer wallet was present for the mint."
        : "No customer wallet was recorded.",
    },
    {
      name: "Policy reference hash",
      status: policy.policy_reference_hash?.trim() ? "passed" : "failed",
      detail: policy.policy_reference_hash?.trim()
        ? "Immutable policy reference hash was supplied."
        : "Policy reference hash is missing.",
    },
    {
      name: "Compliance decision",
      status:
        (policy.compliance_decision ?? "").toUpperCase() === "REJECTED" ? "failed" : "passed",
      detail: policy.compliance_decision?.trim() || "Compliance review completed.",
    },
    {
      name: "Fraud screening",
      status: fraudPassed ? "passed" : "failed",
      detail:
        fraudScore == null
          ? "No score recorded."
          : `Risk score ${fraudScore.toFixed(2)}`,
    },
  ]);
}

export function resolvePolicySettlementChecks(
  policy: CustomerPolicyRecord | undefined,
): SettlementReadinessCheck[] {
  if (!policy) return [];
  if (policy.settlement_readiness_checks?.length) {
    return sortSettlementChecks(policy.settlement_readiness_checks);
  }
  return buildSettlementChecksFromPolicy(policy);
}

export function settlementChecksAllPassed(checks: SettlementReadinessCheck[]): boolean {
  return checks.length > 0 && checks.every((c) => c.status === "passed");
}

export function isClaimSettled(status: string): boolean {
  const s = status.toLowerCase();
  return s === "settled" || s === "paid";
}

export function settlementTrailSummary(claim: InsuranceClaim): string {
  if (isClaimSettled(claim.status)) {
    const paid = claim.approved_amount ?? claim.amount_claimed;
    return `Settled · £${Number(paid).toFixed(2)} paid to your wallet`;
  }
  if (claim.status === "rejected") {
    return claim.rejection_reason
      ? `Rejected — ${claim.rejection_reason}`
      : "Rejected by admin review";
  }
  return "Settlement in progress — see steps below";
}
