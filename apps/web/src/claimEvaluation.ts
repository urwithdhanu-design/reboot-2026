import type { InsuranceClaim } from "../api";

export type ClaimEvaluationStep = {
  id: string;
  label: string;
  status: "passed" | "failed" | "pending" | "action_required" | "skipped" | string;
  detail?: string;
  at?: string | null;
};

export type ClaimSubmitError = Error & {
  evaluationStep?: string;
  evaluationLabel?: string;
  evaluationSteps?: ClaimEvaluationStep[];
};

export function parseClaimSubmitError(err: unknown): ClaimSubmitError {
  if (err instanceof Error && "evaluationSteps" in err) {
    return err as ClaimSubmitError;
  }
  const message = err instanceof Error ? err.message : "Could not submit claim";
  return Object.assign(new Error(message), {});
}

export function failedEvaluationStep(claim: InsuranceClaim): ClaimEvaluationStep | undefined {
  const steps = claim.evaluation_steps ?? [];
  return steps.find((s) => s.status === "failed");
}

export function evaluationProgress(steps: ClaimEvaluationStep[]): {
  passed: number;
  total: number;
  failed: boolean;
} {
  const actionable = steps.filter((s) => s.status !== "skipped");
  const passed = actionable.filter((s) => s.status === "passed").length;
  const failed = steps.some((s) => s.status === "failed");
  return { passed, total: actionable.length, failed };
}
