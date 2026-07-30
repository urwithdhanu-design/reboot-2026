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
  CurrentImplementationViz,
  PlatformCantonFlowViz,
} from '../components/cantonKit/CantonKitLiveViz';
import { PlatformStackSimulator } from '../components/cantonKit/PlatformStackSimulator';
import {
  CANTON_LIVE_TABS,
  CANTON_SIMULATION_SUB_TABS,
  isCantonLiveTabId,
  isCantonSimulationSubTabId,
  KIT_START_HERE,
  type CantonLiveTabId,
  type CantonSimulationSubTabId,
} from '../data/cantonKitLive';

const TAB_ICONS: Record<CantonLiveTabId, LucideIcon> = {
  simulation: PlayCircle,
  implementation: Activity,
  'capital-market': Landmark,
};

function SimulationTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subParam = searchParams.get('sub');
  const subTab: CantonSimulationSubTabId = isCantonSimulationSubTabId(subParam) ? subParam : 'ledger';

  const setSubTab = (id: CantonSimulationSubTabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', 'simulation');
      next.set('sub', id);
      return next;
    });
  };

  return (
    <Card className="blueprint-card" padding={false}>
      <div className="p-6">
        <div className="flex gap-1 mb-4 p-1 bg-lbg-gray-50 rounded-lg border border-lbg-gray-100 overflow-x-auto">
          {CANTON_SIMULATION_SUB_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                subTab === id ? 'bg-white text-lbg-green shadow-sm border border-lbg-gray-100' : 'text-lbg-gray-600 hover:text-lbg-black'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {subTab === 'ledger' ? (
          <>
            <p className="text-sm text-lbg-gray-600 mb-4">
              Canton is a <strong>privacy-aware distributed ledger</strong> for Daml smart contracts. This platform uses the
              local sandbox JSON API — parties submit commands, the ledger validates Daml rules, and only authorised parties
              see contract data.
            </p>
            <CantonSimulationViz />
          </>
        ) : (
          <>
            <p className="text-sm text-lbg-gray-600 mb-4">
              How <strong>policy mint, wallet link, claim verify, and settlement</strong> flow through our services — and
              which steps create or read <strong>Canton contracts</strong> versus core database only.
            </p>
            <PlatformStackSimulator />
            <PlatformCantonFlowViz />
          </>
        )}
      </div>
    </Card>
  );
}

function ImplementationTab() {
  return (
    <Card className="blueprint-card" padding={false}>
      <div className="p-6">
        <p className="text-sm text-lbg-gray-600 mb-4">
          Phases <strong>A–D</strong> shipped in <code className="text-xs">blockchain-orchestrator-service</code> and{' '}
          <code className="text-xs">canton/daml</code>. The orchestrator coordinates mint/verify with honest{' '}
          <code className="text-xs">ledger_mode</code> — simulated fallback only when strict mode is off and Canton is down.
        </p>
        <CurrentImplementationViz />
      </div>
    </Card>
  );
}

function CapitalMarketTab() {
  return (
    <Card className="blueprint-card" padding={false}>
      <div className="p-6">
        <p className="text-sm text-lbg-gray-600 mb-4">
          Phase <strong>D</strong> extends the kit with shared capital-market templates — same DvP and eligibility patterns
          LBG would use for deposits ↔ gilts, applied here to insurance-linked notes and oracle triggers.
        </p>
        <CapitalMarketUpgradeViz />
      </div>
    </Card>
  );
}

function renderLiveTab(view: CantonLiveTabId): ReactElement {
  switch (view) {
    case 'simulation':
      return <SimulationTab />;
    case 'implementation':
      return <ImplementationTab />;
    case 'capital-market':
      return <CapitalMarketTab />;
    default:
      return <SimulationTab />;
  }
}

export function CantonKitLivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const activeView: CantonLiveTabId = isCantonLiveTabId(viewParam) ? viewParam : 'simulation';

  const selectView = (id: CantonLiveTabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', id);
      if (id === 'simulation' && !next.get('sub')) {
        next.set('sub', 'ledger');
      }
      return next;
    });
  };

  return (
    <AdminLayout>
      <PageHeader
        icon={Sparkles}
        title="Canton live guide"
        subtitle="Animated simulation, current implementation walkthrough, and capital market upgrade"
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

      {renderLiveTab(activeView)}

      <div className="mt-6 space-y-4">
        <CantonKitTestRunner />
        <Card padding={false} className="p-5">
          <h3 className="font-bold text-lbg-black mb-2 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-lbg-green" aria-hidden />
            Daml demo script
          </h3>
          <pre className="text-xs bg-lbg-gray-50 rounded-lg p-3 overflow-x-auto text-lbg-gray-700">
            cd canton/daml{'\n'}
            daml build{'\n'}
            daml script --dar .daml/dist/*.dar --script-name CapitalMarketDemo:demo{'\n'}
            {'  '}--ledger-host 127.0.0.1 --ledger-port 6865
          </pre>
          <p className="text-xs text-lbg-gray-500 mt-2">
            Script module name matches the Daml package in <code className="text-xs">canton/daml</code> (see daml.yaml).
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
}
