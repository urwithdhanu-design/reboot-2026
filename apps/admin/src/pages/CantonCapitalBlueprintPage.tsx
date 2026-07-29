import type { ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Layers, Home, Scale, FileCode2, Store, ArrowLeftRight, Eye, RefreshCw,
  Satellite, Sparkles, AlertTriangle, Hammer, Globe2, BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, AlertBanner } from '../components/ui';
import {
  BuildSequenceViz,
  DamlModelViz,
  DvpAnimation,
  FourLayerStack,
  HomeProductFlow,
  LifecycleRail,
  LimitsGrid,
  OracleFlowViz,
  ScaleMarketViz,
  SecurityTokenCard,
  SharedTruthViz,
  TradingVenueFlow,
  ValueRankList,
} from '../components/capitalMarket/CantonBlueprintViz';
import {
  BLUEPRINT_TABS,
  isBlueprintTabId,
  KILLER_THESIS,
  type BlueprintTabId,
} from '../data/cantonCapitalBlueprint';

const TAB_ICONS: Record<BlueprintTabId, LucideIcon> = {
  layers: Layers,
  product: Home,
  legal: Scale,
  daml: FileCode2,
  trading: Store,
  dvp: ArrowLeftRight,
  privacy: Eye,
  lifecycle: RefreshCw,
  oracle: Satellite,
  value: Sparkles,
  limits: AlertTriangle,
  build: Hammer,
  scale: Globe2,
};

function LayersTab() {
  return (
    <Card className="p-6 blueprint-card">
      <p className="text-sm text-lbg-gray-600 mb-4">
        Build an <strong>insurance capital market</strong> — Canton is programmable transaction and settlement
        infrastructure, not a replacement for insurer, SPV, regulated market, or legal contract.
      </p>
      <FourLayerStack />
    </Card>
  );
}

function ProductTab() {
  return (
    <Card className="p-6 blueprint-card">
      <HomeProductFlow />
    </Card>
  );
}

function LegalTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5 blueprint-card">
        <h3 className="font-bold text-lbg-black mb-2">Legal wrapper first</h3>
        <p className="text-sm text-lbg-gray-600 mb-4">
          Before Daml: insurer → reinsurance / risk transfer → SPV → insurance-linked securities → investors.
          Documentation defines risk, collateral, triggers, coupons, maturity, and transfer rules.
        </p>
        <div className="blueprint-legal-chain text-sm font-mono text-lbg-gray-600 space-y-1">
          <p>Insurer</p>
          <p className="pl-4">↓ Risk transfer</p>
          <p className="pl-4">SPV / Transformer</p>
          <p className="pl-8">↓ Issues</p>
          <p className="pl-8">ILS notes</p>
          <p className="pl-12">├── Investor A</p>
          <p className="pl-12">├── Investor B</p>
          <p className="pl-12">└── Investor C</p>
        </div>
      </Card>
      <SecurityTokenCard />
    </div>
  );
}

function DamlTab() {
  return (
    <Card className="p-6 blueprint-card">
      <p className="text-sm text-lbg-gray-600 mb-4">
        Tokenize the <strong>security</strong>, not the insurance policy. Transfer becomes a programmable regulated asset.
      </p>
      <DamlModelViz />
    </Card>
  );
}

function TradingTab() {
  return (
    <Card className="p-6 blueprint-card">
      <TradingVenueFlow />
    </Card>
  );
}

function DvpTab() {
  return (
    <Card className="p-6 blueprint-card">
      <DvpAnimation />
    </Card>
  );
}

function PrivacyTab() {
  return (
    <Card className="p-6 blueprint-card">
      <p className="text-sm text-lbg-gray-600 mb-4">
        Canton solves shared truth with privacy — each party sees different information rights, not five reconciling databases.
      </p>
      <SharedTruthViz />
    </Card>
  );
}

function LifecycleTab() {
  return (
    <Card className="p-6 blueprint-card">
      <p className="text-sm text-lbg-gray-600 mb-4">
        Programmable lifecycle: coupon, trigger, and loss allocation as Daml choices — not just a static token balance.
      </p>
      <LifecycleRail />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 text-sm">
        <div className="rounded-lg border border-lbg-gray-100 p-3 bg-lbg-green-light/30">
          <p className="font-semibold">Coupon payment</p>
          <p className="text-lbg-gray-600 mt-1 text-xs">IF security active AND coupon date → calculate, obligate, transfer cash.</p>
        </div>
        <div className="rounded-lg border border-amber-100 p-3 bg-amber-50">
          <p className="font-semibold">Catastrophe trigger</p>
          <p className="text-lbg-gray-600 mt-1 text-xs">IF verified loss &gt; threshold → reduce principal, update security.</p>
        </div>
      </div>
    </Card>
  );
}

function OracleTab() {
  return (
    <Card className="p-6 blueprint-card">
      <p className="text-sm text-lbg-gray-600 mb-4">
        Example trigger: UK insured catastrophe losses &gt; £2bn — multi-source oracle committee feeds Canton trigger contracts.
      </p>
      <OracleFlowViz />
    </Card>
  );
}

function ValueTab() {
  return (
    <Card className="p-6 blueprint-card">
      <ValueRankList />
    </Card>
  );
}

function LimitsTab() {
  return (
    <Card className="p-6 blueprint-card">
      <LimitsGrid />
    </Card>
  );
}

function BuildTab() {
  return (
    <Card className="p-6 blueprint-card">
      <BuildSequenceViz />
    </Card>
  );
}

function ScaleTab() {
  return (
    <Card className="p-6 blueprint-card">
      <ScaleMarketViz />
      <p className="text-sm text-lbg-gray-600 mt-4 p-4 rounded-xl bg-lbg-green-light/40 border border-lbg-green/20">
        <strong>Composability:</strong> home → motor → health → reinsurance notes → insurance risk fund → fund units —
        ownership, eligibility, transfer, DvP, NAV, and distributions on Canton.
      </p>
    </Card>
  );
}

const TAB_CONTENT: Record<BlueprintTabId, () => ReactElement> = {
  layers: LayersTab,
  product: ProductTab,
  legal: LegalTab,
  daml: DamlTab,
  trading: TradingTab,
  dvp: DvpTab,
  privacy: PrivacyTab,
  lifecycle: LifecycleTab,
  oracle: OracleTab,
  value: ValueTab,
  limits: LimitsTab,
  build: BuildTab,
  scale: ScaleTab,
};

export function CantonCapitalBlueprintPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const activeView: BlueprintTabId = isBlueprintTabId(viewParam) ? viewParam : 'layers';

  const selectView = (id: BlueprintTabId) => setSearchParams({ view: id });
  const Content = TAB_CONTENT[activeView];

  return (
    <AdminLayout>
      <PageHeader
        icon={BookOpen}
        title="Canton capital market blueprint"
        subtitle="Animated guide — insurance capital market with programmable settlement on Canton"
        metrics={[
          { label: 'First product', value: 'Home cat note', tone: 'success' },
          { label: 'Illustrative size', value: '£100m' },
          { label: 'Layers', value: '4' },
        ]}
        actions={
          <Link
            to="/capital-market"
            className="text-sm font-semibold text-lbg-green hover:underline"
          >
            Reference docs →
          </Link>
        }
      />

      <AlertBanner variant="info">
        {KILLER_THESIS}
      </AlertBanner>

      <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-lbg-gray-100 shadow-sm overflow-x-auto">
        {BLUEPRINT_TABS.map(({ id, label }) => {
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
