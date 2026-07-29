import { useEffect, useState, type CSSProperties } from 'react';
import {
  FOUR_LAYERS,
  HOME_PORTFOLIO_STATS,
  SECURITY_EXAMPLE,
  DAML_NOTE_FIELDS,
  DAML_NOTE_CHOICES,
  ELIGIBILITY_RULES,
  LIFECYCLE_STEPS,
  CANTON_VALUE_RANKS,
  CANTON_LIMITS,
  BUILD_SEQUENCE,
  PRIVACY_ROLES,
} from '../../data/cantonCapitalBlueprint';

function useCyclingIndex(length: number, intervalMs: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(t);
  }, [length, intervalMs]);
  return index;
}

export function FourLayerStack() {
  const active = useCyclingIndex(FOUR_LAYERS.length, 2800);
  return (
    <div className="blueprint-layer-stack" aria-label="Four implementation layers">
      {FOUR_LAYERS.map((layer, i) => (
        <div
          key={layer.id}
          className={`blueprint-layer${i === active ? ' blueprint-layer--active' : ''}${i < active ? ' blueprint-layer--done' : ''}`}
          style={{ '--layer-color': layer.color } as CSSProperties}
        >
          <div className="blueprint-layer-num">{layer.num}</div>
          <div className="blueprint-layer-body">
            <p className="blueprint-layer-title">{layer.title}</p>
            <p className="blueprint-layer-detail">{layer.detail}</p>
          </div>
          {i < FOUR_LAYERS.length - 1 ? (
            <div className={`blueprint-layer-connector${i < active ? ' blueprint-layer-connector--flow' : ''}`} aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function HomeProductFlow() {
  const steps = ['Insurer', 'Risk transfer', 'SPV', 'ILS notes', 'Investor A', 'Investor B'];
  const active = useCyclingIndex(steps.length, 2000);
  return (
    <div className="blueprint-product-viz">
      <div className="blueprint-stats-grid">
        {HOME_PORTFOLIO_STATS.map((s) => (
          <div key={s.label} className="blueprint-stat-card">
            <p className="blueprint-stat-label">{s.label}</p>
            <p className="blueprint-stat-value">{s.value}</p>
          </div>
        ))}
      </div>
      <p className="blueprint-product-name">UK Residential Property Catastrophe Note 2027-1</p>
      <div className="blueprint-pipeline" aria-label="Capital structure flow">
        {steps.map((step, i) => (
          <span key={step} className="contents">
            <span
              className={`blueprint-pipeline-node${i === active ? ' blueprint-pipeline-node--active' : ''}${i < active ? ' blueprint-pipeline-node--done' : ''}`}
            >
              {step}
            </span>
            {i < steps.length - 1 ? (
              <span className={`blueprint-pipeline-arrow${i < active ? ' blueprint-pipeline-arrow--flow' : ''}`} aria-hidden>→</span>
            ) : null}
          </span>
        ))}
      </div>
      <p className="blueprint-callout">
        Investors own <strong>securities</strong> linked to defined risk — not individual home policies.
      </p>
    </div>
  );
}

export function SecurityTokenCard() {
  const fields = Object.entries({
    'Security ID': SECURITY_EXAMPLE.securityId,
    Issuer: SECURITY_EXAMPLE.issuer,
    Holder: SECURITY_EXAMPLE.holder,
    Notional: SECURITY_EXAMPLE.notional,
    Coupon: SECURITY_EXAMPLE.coupon,
    Maturity: SECURITY_EXAMPLE.maturity,
    'Risk layer': SECURITY_EXAMPLE.riskLayer,
    Transferability: SECURITY_EXAMPLE.transferability,
    'Eligible investors': SECURITY_EXAMPLE.eligible,
    Status: SECURITY_EXAMPLE.status,
  });
  return (
    <div className="blueprint-token-card">
      <p className="blueprint-token-header">InsuranceLinkedSecurity · Canton view</p>
      <dl className="blueprint-token-fields">
        {fields.map(([k, v]) => (
          <div key={k} className="blueprint-token-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="blueprint-token-foot">
        Legal documents remain the source of truth — Canton is the synchronized operational representation.
      </p>
    </div>
  );
}

export function DamlModelViz() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 1), 2400);
    return () => clearInterval(t);
  }, []);
  const showTransfer = pulse % 2 === 0;
  return (
    <div className="blueprint-daml-grid">
      <div className="blueprint-daml-card">
        <p className="blueprint-daml-title">InsuranceLinkedNote</p>
        <div className="blueprint-chip-wrap">
          {DAML_NOTE_FIELDS.map((f) => (
            <span key={f} className="blueprint-chip">{f}</span>
          ))}
        </div>
        <p className="blueprint-daml-sub">Choices</p>
        <div className="blueprint-chip-wrap">
          {DAML_NOTE_CHOICES.map((c) => (
            <span key={c} className="blueprint-chip blueprint-chip--choice">{c}</span>
          ))}
        </div>
      </div>
      <div className={`blueprint-daml-card blueprint-daml-card--transfer${showTransfer ? ' blueprint-daml-card--pulse' : ''}`}>
        <p className="blueprint-daml-title">InvestorEligibility</p>
        <p className="blueprint-daml-desc">Transfer requires all conditions — programmable regulated asset.</p>
        <ul className="blueprint-check-list">
          {ELIGIBILITY_RULES.map((rule, i) => (
            <li key={rule} className={showTransfer && i <= 2 ? 'blueprint-check-list--on' : ''}>{rule}</li>
          ))}
        </ul>
        <div className="blueprint-archive-create">
          <span>Archive Security(A)</span>
          <span className="blueprint-pipeline-arrow">→</span>
          <span>Create Security(B)</span>
        </div>
      </div>
    </div>
  );
}

export function TradingVenueFlow() {
  const phases = ['Order / RFQ', 'Trade matched', 'Canton network', 'Security leg', 'Cash leg', 'DvP'];
  const active = useCyclingIndex(phases.length, 1800);
  return (
    <div className="blueprint-trading-viz">
      <p className="blueprint-trading-lead">
        Canton is not the entire exchange — it powers ownership, compliance, settlement, and lifecycle.
      </p>
      <div className="blueprint-lifecycle-rail">
        {phases.map((phase, i) => (
          <div key={phase} className="blueprint-lifecycle-step-wrap">
            <div
              className={`blueprint-lifecycle-node${i === active ? ' blueprint-lifecycle-node--active' : ''}${i < active ? ' blueprint-lifecycle-node--done' : ''}`}
            >
              {phase}
            </div>
            {i < phases.length - 1 ? (
              <div className={`blueprint-lifecycle-line${i < active ? ' blueprint-lifecycle-line--flow' : ''}`} />
            ) : null}
          </div>
        ))}
      </div>
      <div className="blueprint-venue-boxes">
        <span>Order book / RFQ</span>
        <span>Broker / ATS</span>
        <span>Custodian</span>
        <span className="blueprint-venue-boxes--canton">Canton DvP</span>
      </div>
    </div>
  );
}

export function DvpAnimation() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % 4), 2200);
    return () => clearInterval(t);
  }, []);
  const labels = ['Trade agreed', 'Check eligibility', 'Verify security + cash', 'Atomic settlement'];
  return (
    <div className="blueprint-dvp-viz">
      <div className="blueprint-dvp-phases">
        {labels.map((label, i) => (
          <span key={label} className={`blueprint-dvp-phase${phase === i ? ' blueprint-dvp-phase--active' : ''}${phase > i ? ' blueprint-dvp-phase--done' : ''}`}>
            {label}
          </span>
        ))}
      </div>
      <div className={`blueprint-dvp-split${phase >= 3 ? ' blueprint-dvp-split--settle' : ''}`}>
        <div className="blueprint-dvp-leg blueprint-dvp-leg--security">
          <p>Security</p>
          <div className="blueprint-dvp-packet blueprint-dvp-packet--sec" />
          <p className="blueprint-dvp-party">Seller → Buyer</p>
        </div>
        <div className="blueprint-dvp-core">
          <span className="blueprint-dvp-atom">DvP</span>
          {phase >= 3 ? <span className="blueprint-dvp-ok">Committed</span> : <span className="blueprint-dvp-wait">Pending…</span>}
        </div>
        <div className="blueprint-dvp-leg blueprint-dvp-leg--cash">
          <p>Cash</p>
          <div className="blueprint-dvp-packet blueprint-dvp-packet--cash" />
          <p className="blueprint-dvp-party">Buyer → Seller</p>
        </div>
      </div>
      <p className="blueprint-dvp-rule">
        IF buyer eligible AND seller owns security AND cash available → transfer both. ELSE transfer nothing.
      </p>
    </div>
  );
}

export function SharedTruthViz() {
  const nodes = ['Insurer', 'SPV', 'Investor A', 'Investor B', 'Regulator', 'Claims'];
  const active = useCyclingIndex(nodes.length, 2000);
  return (
    <div className="blueprint-orbit-viz">
      <div className="blueprint-orbit-center">
        <span>Canton</span>
        <small>shared workflow</small>
      </div>
      {nodes.map((node, i) => {
        const angle = (i / nodes.length) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const x = 50 + 42 * Math.cos(rad);
        const y = 50 + 42 * Math.sin(rad);
        return (
          <div
            key={node}
            className={`blueprint-orbit-node${i === active ? ' blueprint-orbit-node--active' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {node}
          </div>
        );
      })}
      <svg className="blueprint-orbit-lines" viewBox="0 0 100 100" aria-hidden>
        {nodes.map((_, i) => {
          const angle = (i / nodes.length) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 38 * Math.cos(rad);
          const y = 50 + 38 * Math.sin(rad);
          return (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              className={i === active ? 'blueprint-orbit-line--active' : ''}
            />
          );
        })}
      </svg>
      <div className="blueprint-privacy-grid">
        {PRIVACY_ROLES.map((row) => (
          <div key={row.role} className="blueprint-privacy-row">
            <span className="blueprint-privacy-role">{row.role}</span>
            <span className="blueprint-privacy-sees">{row.sees}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LifecycleRail() {
  const active = useCyclingIndex(LIFECYCLE_STEPS.length, 1600);
  return (
    <div className="blueprint-lifecycle-full">
      {LIFECYCLE_STEPS.map((step, i) => (
        <div key={step} className="blueprint-lifecycle-step-wrap blueprint-lifecycle-step-wrap--full">
          <div
            className={`blueprint-lifecycle-node blueprint-lifecycle-node--sm${i === active ? ' blueprint-lifecycle-node--active' : ''}${i < active ? ' blueprint-lifecycle-node--done' : ''}`}
          >
            {step}
          </div>
          {i < LIFECYCLE_STEPS.length - 1 ? (
            <div className={`blueprint-lifecycle-line blueprint-lifecycle-line--sm${i < active ? ' blueprint-lifecycle-line--flow' : ''}`} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function OracleFlowViz() {
  const sources = ['Data A', 'Data B', 'Data C'];
  const phases = ['Actuarial calc', 'Verification', 'Oracle committee', 'Trigger', 'Loss waterfall'];
  const active = useCyclingIndex(phases.length + 1, 2000);
  return (
    <div className="blueprint-oracle-viz">
      <div className="blueprint-oracle-sources">
        {sources.map((s, i) => (
          <div key={s} className={`blueprint-oracle-source${active > i ? ' blueprint-oracle-source--on' : ''}`}>{s}</div>
        ))}
      </div>
      <div className="blueprint-oracle-merge">┴</div>
      <div className="blueprint-lifecycle-rail blueprint-lifecycle-rail--oracle">
        {phases.map((phase, i) => (
          <div key={phase} className="blueprint-lifecycle-step-wrap">
            <div className={`blueprint-lifecycle-node blueprint-lifecycle-node--sm${active === i + 1 ? ' blueprint-lifecycle-node--active' : ''}${active > i + 1 ? ' blueprint-lifecycle-node--done' : ''}`}>
              {phase}
            </div>
            {i < phases.length - 1 ? (
              <div className={`blueprint-lifecycle-line blueprint-lifecycle-line--sm${active > i + 1 ? ' blueprint-lifecycle-line--flow' : ''}`} />
            ) : null}
          </div>
        ))}
      </div>
      <div className="blueprint-waterfall-mini">
        <span>Layer 1 · Insurer</span>
        <span>Layer 2 · Investors</span>
        <span>Layer 3 · Reinsurer</span>
      </div>
    </div>
  );
}

export function ValueRankList() {
  return (
    <div className="blueprint-value-list">
      {CANTON_VALUE_RANKS.map((item) => (
        <div key={item.rank} className="blueprint-value-row">
          <span className="blueprint-value-rank">#{item.rank}</span>
          <div>
            <p className="blueprint-value-title">{item.title} <BadgeLevel level={item.level} /></p>
            <p className="blueprint-value-detail">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BadgeLevel({ level }: { level: string }) {
  return <span className="blueprint-value-badge">{level}</span>;
}

export function LimitsGrid() {
  return (
    <div className="blueprint-limits-grid">
      {CANTON_LIMITS.map((item) => (
        <div key={item} className="blueprint-limit-item">
          <span className="blueprint-limit-x" aria-hidden>✕</span>
          {item}
        </div>
      ))}
      <div className="blueprint-limits-foot">
        Canton is the <strong>technology layer</strong> — legal, regulatory, actuarial, capital markets, and insurance expertise still required.
      </div>
    </div>
  );
}

export function BuildSequenceViz() {
  const active = useCyclingIndex(BUILD_SEQUENCE.length, 2500);
  return (
    <div className="blueprint-build-sequence">
      {BUILD_SEQUENCE.map((item, i) => (
        <div
          key={item.step}
          className={`blueprint-build-step${i === active ? ' blueprint-build-step--active' : ''}${i < active ? ' blueprint-build-step--done' : ''}`}
        >
          <span className="blueprint-build-num">{item.step}</span>
          <div>
            <p className="blueprint-build-title">{item.title}</p>
            <p className="blueprint-build-detail">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScaleMarketViz() {
  const products = ['HOME-ILS', 'MOTOR-ILS', 'HEALTH-ILS', 'Reinsurance'];
  const active = useCyclingIndex(products.length, 2200);
  return (
    <div className="blueprint-scale-viz">
      <div className="blueprint-scale-products">
        {products.map((p, i) => (
          <div key={p} className={`blueprint-scale-product${i === active ? ' blueprint-scale-product--active' : ''}`}>{p}</div>
        ))}
      </div>
      <div className="blueprint-scale-hub">
        <span>Canton insurance market</span>
        <div className="blueprint-scale-investors">
          <span>Investor A</span>
          <span>Investor B</span>
          <span>Investor C</span>
        </div>
      </div>
      <p className="blueprint-scale-portfolio">
        Example portfolio: 40% home cat · 30% motor · 20% health · 10% reinsurance — tradable insurance risk securities.
      </p>
    </div>
  );
}
