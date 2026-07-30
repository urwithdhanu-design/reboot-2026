import type { ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Ban, ExternalLink } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, Badge, PageHeader, AlertBanner } from '../components/ui';
import {
  CANTON_CANNOT_FIX,
  ENTERPRISE_CHALLENGE_TABS,
  ENTERPRISE_CHALLENGES,
  ENTERPRISE_THESIS,
  BANKING_INSURANCE_MAPPING,
  isEnterpriseChallengeTabId,
  LBG_CANTON_CONTEXT,
  SOLVE_ORDER,
  type EnterpriseChallengeTabId,
} from '../data/cantonEnterpriseChallenges';

function LbgTab() {
  return (
    <>
      <Card className="p-5 mb-4 border-lbg-green/20 bg-lbg-green-light/25">
        <p className="text-xs font-bold uppercase tracking-wide text-lbg-green">Commercial banking context</p>
        <h2 className="text-lg font-bold text-lbg-black mt-1">{LBG_CANTON_CONTEXT.title}</h2>
        <p className="text-sm text-lbg-gray-600 mt-2">{LBG_CANTON_CONTEXT.lead}</p>
      </Card>

      <Card className="p-5 mb-4">
        <h3 className="font-bold text-lbg-black mb-3">What LBG demonstrated</h3>
        <ul className="text-sm text-lbg-gray-600 space-y-2 list-disc pl-5">
          {LBG_CANTON_CONTEXT.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 mb-4">
        <h3 className="font-bold text-lbg-black mb-3">End-to-end flow</h3>
        <div className="enterprise-flow-pipeline">
          {LBG_CANTON_CONTEXT.flow.map((step, i) => (
            <span key={step} className="contents">
              <span className="enterprise-flow-node">{step}</span>
              {i < LBG_CANTON_CONTEXT.flow.length - 1 ? (
                <span className="enterprise-flow-arrow" aria-hidden>→</span>
              ) : null}
            </span>
          ))}
        </div>
        <p className="text-xs text-lbg-gray-400 mt-3">
          Public reports: Lloyds, Archax, and Canton Network — tokenised sterling deposits and UK Gilt, Jan 2026.
        </p>
      </Card>
    </>
  );
}

function ChallengesTab() {
  return (
    <div className="space-y-4">
      {ENTERPRISE_CHALLENGES.map((ch, index) => (
        <Card key={ch.id} className="p-5 enterprise-challenge-card">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <Badge variant="neutral">#{index + 1}</Badge>
            <h3 className="font-bold text-lbg-black text-base">{ch.title}</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
            <div className="rounded-lg border border-red-100 bg-red-50/60 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-red-800 mb-1">Problem</p>
              <p className="text-sm text-red-900/90">{ch.problem}</p>
            </div>
            <div className="rounded-lg border border-lbg-green/20 bg-lbg-green-light/40 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-lbg-green-dark mb-1">How to solve</p>
              <ul className="text-sm text-lbg-gray-700 space-y-1.5 list-disc pl-4">
                {ch.solutions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MappingTab() {
  return (
    <Card className="p-5">
      <h3 className="font-bold text-lbg-black mb-2">LBG commercial banking → insurance capital market</h3>
      <p className="text-sm text-lbg-gray-600 mb-4">
        Same Canton patterns: tokenised settlement rail, DvP, validator controls, regulated counterparties, and legacy
        reconciliation.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm enterprise-mapping-table">
          <thead>
            <tr>
              <th>LBG / commercial banking</th>
              <th>Insurance platform analogue</th>
            </tr>
          </thead>
          <tbody>
            {BANKING_INSURANCE_MAPPING.map((row) => (
              <tr key={row.banking}>
                <td>{row.banking}</td>
                <td>{row.insurance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SolveOrderTab() {
  return (
    <Card className="p-5">
      <h3 className="font-bold text-lbg-black mb-4">Practical solve order for enterprises</h3>
      <ol className="space-y-3">
        {SOLVE_ORDER.map((item) => (
          <li key={item.step} className="flex gap-3 rounded-xl border border-lbg-gray-100 p-4 bg-white">
            <span className="enterprise-solve-num">{item.step}</span>
            <div>
              <p className="font-semibold text-lbg-black">{item.title}</p>
              <p className="text-sm text-lbg-gray-500 mt-0.5">{item.example}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function LimitsTab() {
  return (
    <>
      <Card className="p-5 mb-4">
        <h3 className="font-bold text-lbg-black mb-3">Canton does not automatically fix</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CANTON_CANNOT_FIX.map((item) => (
            <div key={item} className="enterprise-limit-item">
              <Ban className="w-4 h-4 shrink-0 text-red-500" aria-hidden />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>
      <AlertBanner variant="info">
        Canton is the <strong>technology layer</strong>. Legal, regulatory, actuarial, capital markets, and insurance
        expertise remain mandatory. Pair with{' '}
        <Link to="/capital-market/kit" className="underline font-semibold">Canton kit blueprint</Link>,{' '}
        <Link to="/capital-market/blueprint" className="underline font-semibold">Canton blueprint</Link>, and{' '}
        <Link to="/capital-market" className="underline font-semibold">insurance capital market</Link> reference pages.
      </AlertBanner>
    </>
  );
}

const TAB_CONTENT: Record<EnterpriseChallengeTabId, () => ReactElement> = {
  lbg: LbgTab,
  challenges: ChallengesTab,
  mapping: MappingTab,
  'solve-order': SolveOrderTab,
  limits: LimitsTab,
};

export function CantonEnterpriseChallengesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const activeView: EnterpriseChallengeTabId = isEnterpriseChallengeTabId(viewParam) ? viewParam : 'lbg';

  const selectView = (id: EnterpriseChallengeTabId) => setSearchParams({ view: id });
  const Content = TAB_CONTENT[activeView];

  return (
    <AdminLayout>
      <PageHeader
        icon={AlertTriangle}
        title="Canton enterprise challenges"
        subtitle="Adoption barriers, LBG commercial banking context, and how to solve them"
        metrics={[
          { label: 'Challenge areas', value: String(ENTERPRISE_CHALLENGES.length) },
          { label: 'Reference', value: 'LBG 2026' },
          { label: 'Focus', value: 'Production DLT' },
        ]}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-sm font-semibold text-lbg-green">
            <Link to="/capital-market/kit" className="hover:underline inline-flex items-center gap-1">
              Canton kit blueprint
              <ExternalLink className="w-3.5 h-3.5" aria-hidden />
            </Link>
            <Link to="/capital-market/blueprint" className="hover:underline">
              Canton blueprint
            </Link>
          </div>
        }
      />

      <AlertBanner variant="info">{ENTERPRISE_THESIS}</AlertBanner>

      <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-lbg-gray-100 shadow-sm overflow-x-auto">
        {ENTERPRISE_CHALLENGE_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectView(id)}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeView === id ? 'bg-lbg-green text-white shadow-sm' : 'text-lbg-gray-600 hover:bg-lbg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Content />
    </AdminLayout>
  );
}
