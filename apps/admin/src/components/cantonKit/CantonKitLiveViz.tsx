import { useEffect, useState, type CSSProperties } from 'react';
import {
  CANTON_SIMULATION_STEPS,
  CAPITAL_MARKET_UPGRADE_STEPS,
  GCUL_IMPLEMENTATION_PHASES,
} from '../../data/cantonKitLive';
import { DvpAnimation, OracleFlowViz } from '../capitalMarket/CantonBlueprintViz';

function useCyclingIndex(length: number, intervalMs: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(t);
  }, [length, intervalMs]);
  return index;
}

export function CantonSimulationViz() {
  const active = useCyclingIndex(CANTON_SIMULATION_STEPS.length, 2600);
  const step = CANTON_SIMULATION_STEPS[active];

  return (
    <div className="kit-live-sim">
      <div className="kit-live-sim-grid" aria-label="Canton ledger simulation">
        <div className={`kit-live-node${active >= 1 ? ' kit-live-node--on' : ''}`}>
          <span className="kit-live-node-label">GCUL services</span>
          <small>policy · claims · orchestrator</small>
        </div>
        <div className={`kit-live-arrow${active >= 1 ? ' kit-live-arrow--flow' : ''}`} aria-hidden>→</div>
        <div className={`kit-live-node kit-live-node--api${active === 1 || active === 2 ? ' kit-live-node--pulse' : ''}${active > 2 ? ' kit-live-node--on' : ''}`}>
          <span className="kit-live-node-label">JSON Ledger API</span>
          <small>:7575 create / exercise</small>
        </div>
        <div className={`kit-live-arrow${active >= 2 ? ' kit-live-arrow--flow' : ''}`} aria-hidden>→</div>
        <div className={`kit-live-node kit-live-node--ledger${active >= 2 ? ' kit-live-node--on' : ''}${active === 3 ? ' kit-live-node--pulse' : ''}`}>
          <span className="kit-live-node-label">Canton sandbox</span>
          <small>Daml validation + commit</small>
        </div>
        <div className={`kit-live-arrow${active >= 4 ? ' kit-live-arrow--flow' : ''}`} aria-hidden>→</div>
        <div className={`kit-live-node${active >= 4 ? ' kit-live-node--on' : ''}`}>
          <span className="kit-live-node-label">Parties</span>
          <small>signatories · observers</small>
        </div>
      </div>

      <div className="kit-live-step-rail">
        {CANTON_SIMULATION_STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`kit-live-step-chip${i === active ? ' kit-live-step-chip--active' : ''}${i < active ? ' kit-live-step-chip--done' : ''}`}
          >
            {s.title}
          </span>
        ))}
      </div>

      <div className="kit-live-step-detail">
        <p className="font-semibold text-lbg-black">{step.title}</p>
        <p className="text-sm text-lbg-gray-600 mt-1">{step.detail}</p>
      </div>

      <p className="text-xs text-lbg-gray-400 mt-3">
        Canton is a privacy-aware ledger: contracts are visible only to parties on the signatory and observer lists.
        GCUL never puts claim PII on-ledger — portfolio IDs, hashes, and settlement state only.
      </p>
    </div>
  );
}

export function GculImplementationViz() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhaseIndex((i) => (i + 1) % GCUL_IMPLEMENTATION_PHASES.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="kit-live-phases">
      {GCUL_IMPLEMENTATION_PHASES.map((phase, i) => (
        <div
          key={phase.phase}
          className={`kit-live-phase-card${i === phaseIndex ? ' kit-live-phase-card--active' : ''}${i < phaseIndex ? ' kit-live-phase-card--done' : ''}`}
          style={{ '--phase-color': phase.color } as CSSProperties}
        >
          <div className="kit-live-phase-head">
            <span className="kit-live-phase-badge">Phase {phase.phase}</span>
            <span className="kit-live-phase-title">{phase.title}</span>
          </div>
          <ul className="kit-live-phase-list">
            {phase.items.map((item) => (
              <li key={item} className={i <= phaseIndex ? 'kit-live-phase-list--on' : ''}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      <div className="kit-live-hybrid-flow">
        <span>Core DB</span>
        <span className="kit-live-arrow kit-live-arrow--flow">↔</span>
        <span className="kit-live-hybrid-canton">Orchestrator + Canton</span>
        <span className="kit-live-arrow kit-live-arrow--flow">↔</span>
        <span>Admin attestations</span>
      </div>
    </div>
  );
}

export function CapitalMarketUpgradeViz() {
  const active = useCyclingIndex(CAPITAL_MARKET_UPGRADE_STEPS.length, 2400);
  const step = CAPITAL_MARKET_UPGRADE_STEPS[active];

  return (
    <div className="kit-live-capital">
      <div className="kit-live-capital-rail">
        {CAPITAL_MARKET_UPGRADE_STEPS.map((s, i) => (
          <div key={s.id} className="kit-live-capital-step-wrap">
            <div
              className={`blueprint-lifecycle-node blueprint-lifecycle-node--sm${i === active ? ' blueprint-lifecycle-node--active' : ''}${i < active ? ' blueprint-lifecycle-node--done' : ''}`}
            >
              {s.title}
            </div>
            {i < CAPITAL_MARKET_UPGRADE_STEPS.length - 1 ? (
              <div className={`blueprint-lifecycle-line blueprint-lifecycle-line--sm${i < active ? ' blueprint-lifecycle-line--flow' : ''}`} />
            ) : null}
          </div>
        ))}
      </div>

      <div className="kit-live-step-detail mt-4">
        <p className="font-semibold text-lbg-black">{step.title}</p>
        <p className="text-sm text-lbg-gray-600 mt-1">{step.detail}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="kit-live-viz-panel">
          <p className="text-xs font-bold uppercase tracking-wide text-lbg-gray-500 mb-3">DvP settlement</p>
          <DvpAnimation />
        </div>
        <div className="kit-live-viz-panel">
          <p className="text-xs font-bold uppercase tracking-wide text-lbg-gray-500 mb-3">Oracle → note trigger</p>
          <OracleFlowViz />
        </div>
      </div>

      <div className="kit-live-template-tree mt-4">
        <div className="kit-live-tree-branch">
          <span className="kit-live-tree-root">Gcul.Common</span>
          <span>DvP · Eligibility · OracleAttestation</span>
        </div>
        <div className="kit-live-tree-forks">
          <div className="kit-live-tree-fork">
            <span>InsurancePolicy</span>
            <small>policy mint (A–C)</small>
          </div>
          <div className="kit-live-tree-fork kit-live-tree-fork--cap">
            <span>InsuranceLinkedNote</span>
            <small>capital market (D)</small>
          </div>
        </div>
      </div>
    </div>
  );
}
