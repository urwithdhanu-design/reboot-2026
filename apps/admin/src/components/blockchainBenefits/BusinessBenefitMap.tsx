import { ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '../ui';

const BENEFIT_MAP_ROWS = [
  {
    challenge: 'Fraudulent claims',
    solution: 'Immutable transaction history',
    value: 'Lower fraud losses',
  },
  {
    challenge: 'Manual claim processing',
    solution: 'Smart contracts automate claims',
    value: 'Faster settlements',
  },
  {
    challenge: 'Policy disputes',
    solution: 'Tamper-proof policy records',
    value: 'Increased customer trust',
  },
  {
    challenge: 'Multiple intermediaries',
    solution: 'Shared ledger',
    value: 'Lower operating costs',
  },
  {
    challenge: 'Cross-border insurance',
    solution: 'Global blockchain network',
    value: 'Faster international processing',
  },
  {
    challenge: 'Slow payments',
    solution: 'Tokenized payments or stablecoins',
    value: 'Near real-time settlement',
  },
  {
    challenge: 'Compliance audits',
    solution: 'Immutable audit trail',
    value: 'Easier regulatory reporting',
  },
];

export function BusinessBenefitMap() {
  return (
    <section className="mb-6 bb-reveal bb-reveal--delay-5" aria-labelledby="bb-benefit-map-heading">
      <Card className="bb-benefit-map p-5 sm:p-6">
        <div className="bb-benefit-map-header">
          <div className="bb-benefit-map-title-wrap">
            <Sparkles className="w-5 h-5 text-lbg-green shrink-0" aria-hidden />
            <div>
              <h2 id="bb-benefit-map-heading" className="text-lg font-bold text-lbg-black">
                Business benefit map
              </h2>
              <p className="mt-0.5 text-sm text-lbg-gray-600">
                Connect each insurance challenge to its blockchain-enabled outcome.
              </p>
            </div>
          </div>
          <div className="bb-benefit-map-flow-hint" aria-hidden>
            <span>Challenge</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Solution</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Value</span>
          </div>
        </div>

        <div className="bb-benefit-map-scroll" role="region" aria-label="Business benefit map table">
          <table className="bb-benefit-map-table">
            <thead>
              <tr>
                <th scope="col" className="bb-benefit-map-th">Business challenge</th>
                <th scope="col" className="bb-benefit-map-th bb-benefit-map-th--solution">Blockchain solution</th>
                <th scope="col" className="bb-benefit-map-th bb-benefit-map-th--value">Business value</th>
              </tr>
            </thead>
            <tbody>
              {BENEFIT_MAP_ROWS.map((row, index) => (
                <tr
                  key={row.challenge}
                  className="bb-benefit-map-row bb-canton-item"
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <td className="bb-benefit-map-cell bb-benefit-map-cell--challenge">
                    <span className="bb-benefit-map-challenge">{row.challenge}</span>
                  </td>
                  <td className="bb-benefit-map-cell bb-benefit-map-cell--solution">
                    <span className="bb-benefit-map-solution">{row.solution}</span>
                  </td>
                  <td className="bb-benefit-map-cell bb-benefit-map-cell--value">
                    <span className="bb-benefit-map-value-pill">{row.value}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bb-benefit-map-mobile" aria-label="Business benefit map">
          {BENEFIT_MAP_ROWS.map((row, index) => (
            <div
              key={row.challenge}
              className="bb-benefit-map-card bb-canton-item"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <p className="bb-benefit-map-card-label">Business challenge</p>
              <p className="bb-benefit-map-challenge">{row.challenge}</p>
              <p className="bb-benefit-map-card-label mt-3">Blockchain solution</p>
              <p className="bb-benefit-map-solution">{row.solution}</p>
              <p className="bb-benefit-map-card-label mt-3">Business value</p>
              <span className="bb-benefit-map-value-pill">{row.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
