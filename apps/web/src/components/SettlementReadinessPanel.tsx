import type { SettlementReadinessCheck } from "../api";
import { settlementChecksAllPassed } from "../settlementReadiness";

function statusLabel(status: string) {
  switch (status) {
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    case "review":
      return "Review";
    default:
      return status;
  }
}

export function SettlementReadinessPanel({
  checks,
  title = "Policy & consent checks",
  description = "Steps completed on your policy before a claim can settle.",
}: {
  checks: SettlementReadinessCheck[];
  title?: string;
  description?: string;
}) {
  if (!checks.length) return null;

  const allPassed = settlementChecksAllPassed(checks);

  return (
    <section className="settlement-readiness" aria-labelledby="settlement-readiness-title">
      <div className="settlement-readiness-header">
        <h3 id="settlement-readiness-title" className="settlement-readiness-title">{title}</h3>
        <p className="settlement-readiness-desc">{description}</p>
      </div>
      <ul className="settlement-readiness-list">
        {checks.map((check) => (
          <li
            key={check.name}
            className={`settlement-readiness-item settlement-readiness-item--${check.status}`}
          >
            <div className="settlement-readiness-marker" aria-hidden />
            <div className="settlement-readiness-body">
              <div className="settlement-readiness-row">
                <p className="settlement-readiness-name">{check.name}</p>
                <span className={`settlement-readiness-badge settlement-readiness-badge--${check.status}`}>
                  {statusLabel(check.status)}
                </span>
              </div>
              <p className="settlement-readiness-detail">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      {allPassed ? (
        <p className="settlement-readiness-foot settlement-readiness-foot--ok" role="status">
          All policy readiness checks passed — your policy was eligible for claim settlement.
        </p>
      ) : (
        <p className="settlement-readiness-foot settlement-readiness-foot--warn" role="status">
          Some readiness checks did not pass — settlement may be blocked until resolved.
        </p>
      )}
    </section>
  );
}
