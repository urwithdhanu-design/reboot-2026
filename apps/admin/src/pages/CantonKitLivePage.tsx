import type { ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Boxes,
  FileCode2,
  Landmark,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, AlertBanner } from '../components/ui';
import { CantonKitTestRunner } from '../components/cantonKit/CantonKitTestRunner';
import {
  CantonSimulationViz,
  CapitalMarketUpgradeViz,
  GculImplementationViz,
} from '../components/cantonKit/CantonKitLiveViz';
import {
  CANTON_LIVE_TABS,
  isCantonLiveTabId,
  KIT_START_HERE,
  type CantonLiveTabId,
} from '../data/cantonKitLive';

const TAB_ICONS: Record<CantonLiveTabId, LucideIcon> = {
  simulation: PlayCircle,
  implementation: Activity,
  'capital-market': Landmark,
};

function SimulationTab() {
  return (
    <Card className="p-6 blueprint-card">
      <p className="text-sm text-lbg-gray-600 mb-4">
        Canton is a <strong>privacy-aware distributed ledger</strong> for Daml smart contracts. GCUL uses the local
        sandbox JSON API — parties submit commands, the ledger validates Daml rules, and only authorised parties see
        contract data.
      </p>
      <CantonSimulationViz />
    </Card>
  );
}

function ImplementationTab() {
  return (
    <Card className="p-6 blueprint-card">
      <p className="text-sm text-lbg-gray-600 mb-4">
        Phases <strong>A–D</strong> shipped in <code className="text-xs">blockchain-orchestrator-service</code> and{' '}
        <code className="text-xs">canton/daml</code>. The orchestrator coordinates mint/verify with honest{' '}
        <code className="text-xs">ledger_mode</code> — simulated fallback only when strict mode is off and Canton is down.
      </p>
      <GculImplementationViz />
    </Card>
  );
}

function CapitalMarketTab() {
  return (
    <Card className="p-6 blueprint-card">
      <p className="text-sm text-lbg-gray-600 mb-4">
        Phase <strong>D</strong> extends the kit with shared capital-market templates — same DvP and eligibility patterns
        LBG would use for deposits ↔ gilts, applied here to insurance-linked notes and oracle triggers.
      </p>
      <CapitalMarketUpgradeViz />
    </Card>
  );
}

const TAB_CONTENT: Record<CantonLiveTabId, () => ReactElement> = {
  simulation: SimulationTab,
  implementation: ImplementationTab,
  'capital-market': CapitalMarketTab,
};

export function CantonKitLivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const activeView: CantonLiveTabId = isCantonLiveTabId(viewParam) ? viewParam : 'simulation';
  const selectView = (id: CantonLiveTabId) => setSearchParams({ view: id });
  const Content = TAB_CONTENT[activeView];

  return (
    <AdminLayout>
      <PageHeader
        icon={Sparkles}
        title="Canton live guide"
        subtitle="Animated simulation, GCUL implementation walkthrough, and capital market upgrade"
        metrics={[
          { label: 'Phases shipped', value: String(KIT_START_HERE.completed.phases) },
          { label: 'Deliverables', value: String(KIT_START_HERE.completed.deliverables) },
          { label: 'Tabs', value: '3' },
        ]}
        actions={
          <Link
            to="/capital-market/kit?view=recommendation"
            className="text-sm font-semibold text-lbg-green hover:underline inline-flex items-center gap-1"
          >
            <Boxes className="w-3.5 h-3.5" aria-hidden />
            Kit blueprint
          </Link>
        }
      />

      <AlertBanner variant="info">{KIT_START_HERE.summary}</AlertBanner>

      <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-lbg-gray-100 shadow-sm overflow-x-auto">
        {CANTON_LIVE_TABS.map(({ id, label }) => {
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

      <div className="mt-6 space-y-4">
        <CantonKitTestRunner />
        <Card className="p-5">
          <h3 className="font-bold text-lbg-black mb-2 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-lbg-green" aria-hidden />
            Daml demo script
          </h3>
          <pre className="text-xs bg-lbg-gray-50 rounded-lg p-3 overflow-x-auto text-lbg-gray-700">
            cd canton/daml{'\n'}
            daml script --dar .daml/dist/gcul-policy-0.1.0.dar --script-name Gcul.CapitalMarketDemo:demo{'\n'}
            {'  '}--ledger-host 127.0.0.1 --ledger-port 6865
          </pre>
        </Card>
      </div>
    </AdminLayout>
  );
}
