import {
  HEATMAP_SCORE_LABELS,
  scoreFor,
  UK_MARKET_CAPABILITIES,
  UK_MARKET_PLATFORMS,
  type HeatmapScore,
} from '../data/ukMarketHeatmap';

function scoreClass(score: HeatmapScore): string {
  return `uk-heatmap-cell--${score}`;
}

export function UkMarketHeatmap({ compact = false }: { compact?: boolean }) {
  const capabilities = compact ? UK_MARKET_CAPABILITIES.slice(0, 8) : UK_MARKET_CAPABILITIES;

  return (
    <section
      className={`uk-heatmap${compact ? ' uk-heatmap--compact' : ''}`}
      aria-labelledby="uk-heatmap-title"
    >
      <div className="uk-heatmap-header">
        <p className="uk-heatmap-eyebrow">UK market · indicative</p>
        <h2 id="uk-heatmap-title" className="uk-heatmap-title">
          {compact ? 'UK capability heatmap' : 'Solution vs UK insurance platforms'}
        </h2>
        {!compact ? (
          <p className="uk-heatmap-subtitle">
            Capability intensity across leading UK insurers and digital challengers — Canton minting,
            wallet payouts, and parametric claims highlighted.
          </p>
        ) : null}
      </div>

      <div className="uk-heatmap-scroll" role="region" aria-label="UK market capability heatmap table">
        <table className="uk-heatmap-table">
          <thead>
            <tr>
              <th scope="col" className="uk-heatmap-th uk-heatmap-th--cap">Capability</th>
              {UK_MARKET_PLATFORMS.map((platform) => (
                <th
                  key={platform.id}
                  scope="col"
                  className={`uk-heatmap-th uk-heatmap-th--platform${platform.type === 'ours' ? ' uk-heatmap-th--ours' : ''}`}
                >
                  <span className="uk-heatmap-platform-name">{platform.shortName}</span>
                  {!compact ? (
                    <span className="uk-heatmap-platform-full">{platform.name}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capabilities.map((cap) => (
              <tr key={cap.id}>
                <th scope="row" className="uk-heatmap-cap-label">
                  <span className="uk-heatmap-cap-short">{cap.shortLabel}</span>
                  {!compact ? (
                    <span className="uk-heatmap-cap-full">{cap.label}</span>
                  ) : null}
                </th>
                {UK_MARKET_PLATFORMS.map((platform) => {
                  const score = scoreFor(platform.id, cap.id);
                  return (
                    <td
                      key={platform.id}
                      className={`uk-heatmap-cell ${scoreClass(score)}${platform.type === 'ours' ? ' uk-heatmap-cell--ours-col' : ''}`}
                      title={`${platform.name} · ${cap.label}: ${HEATMAP_SCORE_LABELS[score]}`}
                    >
                      <span className="uk-heatmap-score" aria-label={`${HEATMAP_SCORE_LABELS[score]}`}>
                        {score}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="uk-heatmap-legend" aria-label="Score legend">
        <span className="uk-heatmap-legend-label">Intensity</span>
        {( [0, 1, 2, 3, 4] as HeatmapScore[]).map((level) => (
          <span key={level} className="uk-heatmap-legend-item">
            <span className={`uk-heatmap-legend-swatch ${scoreClass(level)}`} aria-hidden />
            <span className="uk-heatmap-legend-text">{HEATMAP_SCORE_LABELS[level]}</span>
          </span>
        ))}
      </div>

      <p className="uk-heatmap-footnote">
        Scores are indicative for platform positioning (0 = none, 4 = leading). Not a formal benchmark.
      </p>
    </section>
  );
}
