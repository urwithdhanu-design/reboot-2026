import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Ban,
  CheckCircle2,
  Circle,
  ExternalLink,
  Hammer,
  Layers,
  Map,
  Package,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, Badge, PageHeader, AlertBanner } from '../components/ui';
import { PhaseTestModal } from '../components/PhaseTestModal';
import { KIT_START_HERE } from '../data/cantonKitLive';
import { CantonKitTestRunner } from '../components/cantonKit/CantonKitTestRunner';
import {
  CHALLENGE_FIT,
  FIRST_UTILITY_RECOMMENDATION,
  HYBRID_FLOW_STEPS,
  isKitBlueprintTabId,
  KIT_BLUEPRINT_TABS,
  KIT_DELIVERABLES,
  KIT_LAYERS,
  KIT_MODULE_TREE,
  KIT_OVERVIEW,
  KIT_THESIS,
  PHASE_A_LOCAL_TEST,
  PHASE_B_LOCAL_TEST,
  PHASE_C_LOCAL_TEST,
  PHASE_D_LOCAL_TEST,
  PHASE_TITLES,
  SHARED_INTERFACES,
  type ChallengeFit,
  type ImplementationStatus,
  type KitBlueprintTabId,
  type KitDeliverable,
} from '../data/cantonKitBlueprint';

const FIT_LABEL: Record<ChallengeFit['fit'], { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  strong: { label: 'Strong fit', variant: 'success' },
  partial: { label: 'Partial', variant: 'warning' },
  none: { label: 'Out of scope', variant: 'neutral' },
};

function StatusIcon({ status }: { status: ImplementationStatus }) {
  if (status === 'done') {
    return <CheckCircle2 className="w-4 h-4 text-lbg-green shrink-0" aria-hidden />;
  }
  if (status === 'in_progress') {
    return <Hammer className="w-4 h-4 text-amber-600 shrink-0" aria-hidden />;
  }
  return <Circle className="w-4 h-4 text-lbg-gray-300 shrink-0" aria-hidden />;
}

function statusLabel(status: ImplementationStatus): string {
  if (status === 'done') return 'Done';
  if (status === 'in_progress') return 'In progress';
  return 'Not started';
}

function DeliverableCard({ item }: { item: KitDeliverable }) {
  return (
    <Card className="p-4 kit-deliverable-card">
      <div className="flex flex-wrap items-start gap-2 mb-2">
        <Badge variant="neutral">Phase {item.phase}</Badge>
        <code className="text-xs bg-lbg-gray-50 px-1.5 py-0.5 rounded text-lbg-gray-600">{item.id}</code>
        <div className="flex items-center gap-1.5 text-xs text-lbg-gray-500 ml-auto">
          <StatusIcon status={item.status} />
          <span>{statusLabel(item.status)}</span>
        </div>
      </div>
      <h4 className="font-bold text-lbg-black">{item.title}</h4>
      <p className="text-sm text-lbg-gray-600 mt-1">{item.description}</p>
      <p className="text-xs text-lbg-gray-400 mt-2">
        <span className="font-semibold text-lbg-gray-500">Challenge:</span> {item.enterpriseChallenge}
      </p>
      <p className="text-xs text-lbg-green-dark mt-1 rounded-lg bg-lbg-green-light/40 px-2 py-1.5">
        <span className="font-semibold">Test:</span> {item.testHint}
      </p>
    </Card>
  );
}

function OverviewTab() {
  return (
    <>
      <Card className="p-5 mb-4 border-lbg-green/20 bg-lbg-green-light/25">
        <p className="text-xs font-bold uppercase tracking-wide text-lbg-green">{KIT_OVERVIEW.name}</p>
        <p className="text-sm text-lbg-gray-700 mt-2">{KIT_OVERVIEW.lead}</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <h3 className="font-bold text-lbg-black mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-lbg-green" aria-hidden />
            What the kit solves
          </h3>
          <ul className="text-sm text-lbg-gray-600 space-y-2 list-disc pl-5">
            {KIT_OVERVIEW.solves.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-lbg-black mb-3 flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-500" aria-hidden />
            What the kit does not solve
          </h3>
          <ul className="text-sm text-lbg-gray-600 space-y-2 list-disc pl-5">
            {KIT_OVERVIEW.doesNotSolve.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-lbg-black mb-3">Hybrid ledger flow (target)</h3>
        <div className="enterprise-flow-pipeline">
          {HYBRID_FLOW_STEPS.map((step, i) => (
            <span key={step} className="contents">
              <span className="enterprise-flow-node">{step}</span>
              {i < HYBRID_FLOW_STEPS.length - 1 ? (
                <span className="enterprise-flow-arrow" aria-hidden>↔</span>
              ) : null}
            </span>
          ))}
        </div>
        <p className="text-xs text-lbg-gray-400 mt-3">
          Orchestrator becomes thin; policy, claims, and KYC keep business rules. Canton kit owns ledger truthfulness.
        </p>
      </Card>
    </>
  );
}

function ArchitectureTab() {
  return (
    <div className="space-y-4">
      {KIT_LAYERS.map((layer, index) => (
        <Card key={layer.id} className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="neutral">Layer {index + 1}</Badge>
            <h3 className="font-bold text-lbg-black">{layer.name}</h3>
          </div>
          <p className="text-xs font-mono text-lbg-gray-500 mb-2">{layer.path}</p>
          <p className="text-sm text-lbg-gray-600">{layer.purpose}</p>
          <p className="text-xs text-lbg-gray-400 mt-2">
            <span className="font-semibold">Consumers:</span> {layer.consumers.join(', ')}
          </p>
        </Card>
      ))}

      <Card className="p-5">
        <h3 className="font-bold text-lbg-black mb-3">Shared Daml interfaces (banking ↔ insurance)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm enterprise-mapping-table">
            <thead>
              <tr>
                <th>Interface</th>
                <th>Banking (LBG)</th>
                <th>Insurance (platform)</th>
              </tr>
            </thead>
            <tbody>
              {SHARED_INTERFACES.map((row) => (
                <tr key={row.interface}>
                  <td>
                    <code className="text-xs">{row.interface}</code>
                  </td>
                  <td>{row.banking}</td>
                  <td>{row.insurance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MappingTab() {
  return (
    <div className="space-y-3">
      {CHALLENGE_FIT.map((row) => {
        const fit = FIT_LABEL[row.fit];
        return (
          <Card key={row.challengeId} className="p-4">
            <div className="flex flex-wrap items-start gap-2 mb-2">
              <Badge variant={fit.variant}>{fit.label}</Badge>
              <h3 className="font-semibold text-lbg-black text-sm">{row.challenge}</h3>
            </div>
            {row.utilityComponent !== '—' ? (
              <p className="text-sm text-lbg-gray-600">
                <span className="font-semibold text-lbg-gray-700">Utility:</span> {row.utilityComponent}
              </p>
            ) : null}
            <p className="text-sm text-lbg-gray-500 mt-1">{row.notes}</p>
          </Card>
        );
      })}
    </div>
  );
}

function ModulesTab() {
  return (
    <Card className="p-5">
      <h3 className="font-bold text-lbg-black mb-2">Suggested repository layout</h3>
      <p className="text-sm text-lbg-gray-600 mb-4">
        Extract <code className="text-xs">CantonJsonApiClient</code> from blockchain-orchestrator into shared libs.
        Current references:{' '}
        <code className="text-xs">apps/services/blockchain-orchestrator-service/.../canton/</code>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm enterprise-mapping-table kit-module-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>Artifact</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {KIT_MODULE_TREE.map((row) => (
              <tr key={`${row.path}-${row.artifact}`}>
                <td>
                  <code className="text-xs">{row.path}</code>
                </td>
                <td>
                  <code className="text-xs font-semibold">{row.artifact}</code>
                </td>
                <td>{row.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PhasesTab() {
  const [phaseATestOpen, setPhaseATestOpen] = useState(false);
  const [phaseBTestOpen, setPhaseBTestOpen] = useState(false);
  const [phaseCTestOpen, setPhaseCTestOpen] = useState(false);
  const [phaseDTestOpen, setPhaseDTestOpen] = useState(false);
  const phases: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      <AlertBanner variant="info">
        Phases A–D shipped ({KIT_DELIVERABLES.filter((d) => d.status === 'done').length}/{KIT_DELIVERABLES.length} done).
        Use &ldquo;How to test locally&rdquo; per phase or the Start here tab test runner.
      </AlertBanner>
      {phases.map((phase) => {
        const items = KIT_DELIVERABLES.filter((d) => d.phase === phase);
        const done = items.filter((d) => d.status === 'done').length;
        return (
          <section key={phase}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h3 className="font-bold text-lbg-black">Phase {phase}</h3>
              <span className="text-sm text-lbg-gray-500">{PHASE_TITLES[phase]}</span>
              {phase === 'A' ? (
                <button
                  type="button"
                  onClick={() => setPhaseATestOpen(true)}
                  className="text-sm font-semibold text-lbg-green hover:underline"
                >
                  How to test locally →
                </button>
              ) : null}
              {phase === 'B' ? (
                <button
                  type="button"
                  onClick={() => setPhaseBTestOpen(true)}
                  className="text-sm font-semibold text-lbg-green hover:underline"
                >
                  How to test locally →
                </button>
              ) : null}
              {phase === 'C' ? (
                <button
                  type="button"
                  onClick={() => setPhaseCTestOpen(true)}
                  className="text-sm font-semibold text-lbg-green hover:underline"
                >
                  How to test locally →
                </button>
              ) : null}
              {phase === 'D' ? (
                <button
                  type="button"
                  onClick={() => setPhaseDTestOpen(true)}
                  className="text-sm font-semibold text-lbg-green hover:underline"
                >
                  How to test locally →
                </button>
              ) : null}
              <Badge variant="neutral">{done}/{items.length} done</Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {items.map((item) => (
                <DeliverableCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
      <PhaseTestModal
        open={phaseATestOpen}
        onClose={() => setPhaseATestOpen(false)}
        phaseLabel="Phase A"
        subtitle="Trust and honesty — ledger attestation, strict mode, verify bypass removal, Canton probe."
        steps={PHASE_A_LOCAL_TEST}
      />
      <PhaseTestModal
        open={phaseBTestOpen}
        onClose={() => setPhaseBTestOpen(false)}
        phaseLabel="Phase B"
        subtitle="Correct Daml integration — MintPolicy exercise, type encoding, package resolution, single mint path."
        steps={PHASE_B_LOCAL_TEST}
      />
      <PhaseTestModal
        open={phaseCTestOpen}
        onClose={() => setPhaseCTestOpen(false)}
        phaseLabel="Phase C"
        subtitle="Security and reconciliation — idempotent mint, drift report, internal API auth."
        steps={PHASE_C_LOCAL_TEST}
      />
      <PhaseTestModal
        open={phaseDTestOpen}
        onClose={() => setPhaseDTestOpen(false)}
        phaseLabel="Phase D"
        subtitle="Capital market Daml kit — DvP, investor eligibility, oracle attestation, insurance-linked note."
        steps={PHASE_D_LOCAL_TEST}
      />
    </div>
  );
}

function RecommendationTab() {
  const done = KIT_DELIVERABLES.filter((d) => d.status === 'done').length;

  return (
    <>
      <Card className="p-5 mb-4 border-lbg-green/30 bg-lbg-green-light/30">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-lbg-green" aria-hidden />
          <h2 className="text-lg font-bold text-lbg-black">{KIT_START_HERE.headline}</h2>
          <Badge variant="success">{done}/{KIT_DELIVERABLES.length} done</Badge>
        </div>
        <p className="text-sm text-lbg-gray-700">{KIT_START_HERE.summary}</p>
        <Link
          to={KIT_START_HERE.liveGuidePath}
          className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-lbg-green hover:underline"
        >
          Open Canton live guide (simulation + animations) →
        </Link>
      </Card>

      <Card className="p-5 mb-4 border-lbg-green/30 bg-lbg-green-light/30">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-lbg-green" aria-hidden />
          <h2 className="text-lg font-bold text-lbg-black">{FIRST_UTILITY_RECOMMENDATION.package}</h2>
        </div>
        <p className="text-sm font-semibold text-lbg-green-dark">{FIRST_UTILITY_RECOMMENDATION.title}</p>
        <ul className="text-sm text-lbg-gray-700 mt-3 space-y-2 list-disc pl-5">
          {FIRST_UTILITY_RECOMMENDATION.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 mb-4">
        <h3 className="font-bold text-lbg-black mb-3">Addresses these enterprise challenges</h3>
        <div className="flex flex-wrap gap-2">
          {FIRST_UTILITY_RECOMMENDATION.addresses.map((a) => (
            <Badge key={a} variant="success">{a}</Badge>
          ))}
        </div>
      </Card>

      <CantonKitTestRunner compact />

      <Card className="p-5 mt-4">
        <h3 className="font-bold text-lbg-black mb-3">Next steps</h3>
        <ol className="space-y-2 list-decimal pl-5 text-sm text-lbg-gray-700">
          {FIRST_UTILITY_RECOMMENDATION.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>

      <Card className="p-5 mt-4">
        <h3 className="font-bold text-lbg-black mb-3">Phase A deliverables (reference)</h3>
        <ol className="space-y-2">
          {KIT_DELIVERABLES.filter((d) => d.phase === 'A').map((item) => (
            <li key={item.id} className="flex gap-3 text-sm rounded-lg border border-lbg-gray-100 p-3">
              <StatusIcon status={item.status} />
              <div>
                <p className="font-semibold text-lbg-black">
                  <code className="text-xs mr-1">{item.id}</code>
                  {item.title}
                </p>
                <p className="text-lbg-gray-500 text-xs mt-0.5">{item.testHint}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}

function LimitsTab() {
  return (
    <>
      <Card className="p-5 mb-4">
        <h3 className="font-bold text-lbg-black mb-3">Kit cannot replace</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {KIT_OVERVIEW.doesNotSolve.map((item) => (
            <div key={item} className="enterprise-limit-item">
              <Ban className="w-4 h-4 shrink-0 text-red-500" aria-hidden />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>
      <AlertBanner variant="info">
        Pair with{' '}
        <Link to="/capital-market/canton-live" className="underline font-semibold">Canton live guide</Link>,{' '}
        <Link to="/capital-market/enterprise" className="underline font-semibold">Canton enterprise challenges</Link>,{' '}
        <Link to="/capital-market/blueprint" className="underline font-semibold">Canton blueprint</Link>, and the{' '}
        <Link to="/capital-market" className="underline font-semibold">insurance capital market</Link> reference.
        Technical assessment: <code className="text-xs">docs/CANTON-LAYER-ASSESSMENT.docx</code>
      </AlertBanner>
    </>
  );
}

const TAB_CONTENT: Record<KitBlueprintTabId, () => ReactElement> = {
  overview: OverviewTab,
  architecture: ArchitectureTab,
  mapping: MappingTab,
  modules: ModulesTab,
  phases: PhasesTab,
  recommendation: RecommendationTab,
  limits: LimitsTab,
};

const TAB_ICONS: Record<KitBlueprintTabId, typeof Boxes> = {
  overview: Boxes,
  architecture: Layers,
  mapping: Map,
  modules: Package,
  phases: Hammer,
  recommendation: Sparkles,
  limits: TriangleAlert,
};

export function CantonKitBlueprintPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const activeView: KitBlueprintTabId = isKitBlueprintTabId(viewParam) ? viewParam : 'overview';

  const selectView = (id: KitBlueprintTabId) => setSearchParams({ view: id });
  const Content = TAB_CONTENT[activeView];
  const notStarted = KIT_DELIVERABLES.filter((d) => d.status === 'not_started').length;

  return (
    <AdminLayout>
      <PageHeader
        icon={Boxes}
        title="Canton kit blueprint"
        subtitle="Reusable Canton coordination kit — honest hybrid ledger, shared Daml patterns, phased implementation backlog"
        metrics={[
          { label: 'Deliverables', value: String(KIT_DELIVERABLES.length) },
          { label: 'Not started', value: String(notStarted) },
          { label: 'Layers', value: '3' },
        ]}
        actions={
          <Link
            to="/capital-market/enterprise"
            className="text-sm font-semibold text-lbg-green hover:underline inline-flex items-center gap-1"
          >
            Enterprise challenges
            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
          </Link>
        }
      />

      <AlertBanner variant="info">{KIT_THESIS}</AlertBanner>

      <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-lbg-gray-100 shadow-sm overflow-x-auto">
        {KIT_BLUEPRINT_TABS.map(({ id, label }) => {
          const Icon = TAB_ICONS[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectView(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeView === id ? 'bg-lbg-green text-white shadow-sm' : 'text-lbg-gray-600 hover:bg-lbg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <Content />
    </AdminLayout>
  );
}
