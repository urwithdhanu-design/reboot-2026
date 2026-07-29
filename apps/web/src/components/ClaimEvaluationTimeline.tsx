import type { ClaimEvaluationStep } from "../claimEvaluation";

function statusLabel(status: string) {
  switch (status) {
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    case "pending":
      return "Pending";
    case "action_required":
      return "Action required";
    case "skipped":
      return "Skipped";
    default:
      return status;
  }
}

export function ClaimEvaluationTimeline({
  steps,
  compact = false,
}: {
  steps: ClaimEvaluationStep[];
  compact?: boolean;
}) {
  if (!steps.length) return null;

  return (
    <div className={`claim-eval${compact ? " claim-eval--compact" : ""}`}>
      <p className="claim-eval-title">Claim evaluation</p>
      <ol className="claim-eval-list">
        {steps.map((step, index) => (
          <li
            key={`${step.id}-${index}`}
            className={`claim-eval-step claim-eval-step--${step.status}`}
          >
            <div className="claim-eval-marker" aria-hidden />
            <div className="claim-eval-body">
              <div className="claim-eval-row">
                <p className="claim-eval-label">{step.label}</p>
                <span className={`claim-eval-badge claim-eval-badge--${step.status}`}>
                  {statusLabel(step.status)}
                </span>
              </div>
              {step.detail ? <p className="claim-eval-detail">{step.detail}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
