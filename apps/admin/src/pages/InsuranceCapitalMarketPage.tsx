import type { ReactElement, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2, Home, Car, HeartPulse, ArrowLeftRight, Layers, Map, Shield,
  AlertTriangle, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { FutureFlowDiagram } from '../components/FutureFlowDiagram';
import { Card, Badge, PageHeader, AlertBanner } from '../components/ui';
import {
  ASSET_CLASSES,
  BUSINESS_MODELS,
  CAPITAL_MARKET_POSITIONING,
  CAPITAL_MARKET_TABS,
  CORE_ARCHITECTURE_DIAGRAM,
  DAML_CHOICES,
  DAML_FIELDS,
  DVP_DIAGRAM,
  FIVE_LAYERS,
  HEALTH_AGGREGATION_DIAGRAM,
  HEALTH_RISK_NOTE,
  HOME_CAPITAL_FLOW_DIAGRAM,
  HOME_RISK_NOTE,
  isCapitalMarketTabId,
  MOTOR_LAYER_DIAGRAM,
  MOTOR_RISK_NOTE,
  ORACLE_EXAMPLES,
  REGULATORY_QUESTIONS,
  ROADMAP_PHASES,
  SECONDARY_MARKET_DIAGRAM,
  TRANSFER_CONDITIONS,
  type CapitalMarketTabId,
} from '../data/insuranceCapitalMarket';

const TAB_ICONS: Record<CapitalMarketTabId, LucideIcon> = {
  overview: Building2,
  home: Home,
  motor: Car,
  health: HeartPulse,
  secondary: ArrowLeftRight,
  architecture: Layers,
  roadmap: Map,
};

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-bold text-lbg-black mt-0 mb-2">{children}</h3>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="text-sm text-lbg-gray-600 space-y-1.5 list-disc pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function HomeWaterfall() {
  const colors: Record<string, string> = {
    insurer: 'bg-blue-100 border-blue-200 text-blue-900',
    investor: 'bg-lbg-green-light border-lbg-green/30 text-lbg-green-dark',
    reinsurer: 'bg-amber-50 border-amber-200 text-amber-900',
  };
  return (
    <div className="space-y-2">
      {HOME_RISK_NOTE.waterfall.map((row) => (
        <div
          key={row.layer}
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border px-3 py-2 ${colors[row.color]}`}
        >
          <span className="text-xs font-mono font-semibold">{row.layer}</span>
          <span className="text-sm font-medium">{row.bearer}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewTab() {
  return (
    <>
      <Card className="p-5 mb-4 border-lbg-green/20 bg-lbg-green-light/30">
        <p className="text-xs font-bold uppercase tracking-wide text-lbg-green">Positioning</p>
        <h2 className="text-lg font-bold text-lbg-black mt-1">{CAPITAL_MARKET_POSITIONING.title}</h2>
        <p className="text-sm text-lbg-gray-600 mt-2">{CAPITAL_MARKET_POSITIONING.lead}</p>
        <BulletList items={CAPITAL_MARKET_POSITIONING.bullets} />
      </Card>

      <FutureFlowDiagram diagram={CORE_ARCHITECTURE_DIAGRAM} />

      <Card className="p-4 mb-4">
        <SectionTitle>Three asset classes — not one generic “insurance token”</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ASSET_CLASSES.map((asset) => (
            <div key={asset.id} className="rounded-xl border border-lbg-gray-100 p-3 bg-white">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{asset.label}</p>
                <Badge variant="neutral">Phase {asset.phase}</Badge>
              </div>
              <p className="text-xs font-mono text-lbg-green mt-1">{asset.id}</p>
              <p className="text-xs text-lbg-gray-500 mt-2">{asset.exposure}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <SectionTitle>Strategic options</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BUSINESS_MODELS.map((model) => (
            <div key={model.id} className="rounded-xl border border-lbg-gray-100 p-3">
              <p className="text-sm font-bold">Business {model.id} — {model.title}</p>
              <p className="text-xs text-lbg-gray-500 mt-1">{model.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <AlertBanner variant="info">
        {CAPITAL_MARKET_POSITIONING.disclaimer}
      </AlertBanner>
    </>
  );
}

function HomeTab() {
  return (
    <>
      <Card className="p-5 mb-4 border-lbg-green/25 bg-gradient-to-br from-lbg-green-light/40 to-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="success">Phase 1 · Bundle focus</Badge>
            <h2 className="text-xl font-bold text-lbg-black mt-2">{HOME_RISK_NOTE.title}</h2>
            <p className="text-sm text-lbg-gray-500 mt-1">{HOME_RISK_NOTE.subtitle}</p>
            <p className="text-xs font-mono text-lbg-green mt-2">{HOME_RISK_NOTE.securityId}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-lbg-gray-400">Indicative notional</p>
            <p className="text-2xl font-bold text-lbg-black">{HOME_RISK_NOTE.structure.notional}</p>
          </div>
        </div>
        <p className="text-sm text-lbg-gray-600 mt-4">
          Start with <strong>home insurance</strong>, not individual policy tokens. The SPV receives a portfolio of
          catastrophe risk; investors provide capital; the insurer transfers defined peril exposure from UK residential
          policies.
        </p>
      </Card>

      <Card className="p-4 mb-4">
        <SectionTitle>Modelled perils</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {HOME_RISK_NOTE.perils.map((peril) => (
            <Badge key={peril} variant="neutral">{peril}</Badge>
          ))}
        </div>
      </Card>

      <FutureFlowDiagram diagram={HOME_CAPITAL_FLOW_DIAGRAM} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <SectionTitle>Loss waterfall (illustrative)</SectionTitle>
          <HomeWaterfall />
          <p className="text-xs text-lbg-gray-400 mt-3">
            If losses stay low: investors receive coupon + principal. If losses exceed trigger: note principal absorbs
            losses in the defined layer.
          </p>
        </Card>
        <Card className="p-4">
          <SectionTitle>Structure summary</SectionTitle>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between gap-4 border-b border-lbg-gray-50 pb-2">
              <dt className="text-lbg-gray-500">Notional</dt>
              <dd className="font-semibold">{HOME_RISK_NOTE.structure.notional}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-lbg-gray-50 pb-2">
              <dt className="text-lbg-gray-500">Attachment</dt>
              <dd className="font-semibold text-right">{HOME_RISK_NOTE.structure.attachment}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-lbg-gray-50 pb-2">
              <dt className="text-lbg-gray-500">Investor role</dt>
              <dd className="font-semibold text-right">{HOME_RISK_NOTE.structure.investorRole}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-lbg-gray-50 pb-2">
              <dt className="text-lbg-gray-500">Upside</dt>
              <dd className="font-semibold text-right">{HOME_RISK_NOTE.structure.upside}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-lbg-gray-500">Downside</dt>
              <dd className="font-semibold text-right">{HOME_RISK_NOTE.structure.downside}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="p-4 mb-4 border-dashed border-lbg-green/40 bg-lbg-green-light/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-lbg-green shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-sm font-bold text-lbg-black">Next simulation (planned)</p>
            <p className="text-sm text-lbg-gray-600 mt-1">
              Bundle ~10,000 UK home policies into a portfolio, link to SPV economics, and model revenue to a bank /
              institutional investor through primary issuance fees, secondary trading, and risk capital returns.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}

function MotorTab() {
  return (
    <>
      <Card className="p-5 mb-4">
        <Badge variant="neutral">Phase 2</Badge>
        <h2 className="text-lg font-bold mt-2">{MOTOR_RISK_NOTE.title}</h2>
        <p className="text-xs font-mono text-lbg-green">{MOTOR_RISK_NOTE.securityId}</p>
        <p className="text-sm text-lbg-gray-600 mt-2">{MOTOR_RISK_NOTE.subtitle}</p>
      </Card>

      <Card className="p-4 mb-4">
        <SectionTitle>Example portfolio</SectionTitle>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-lbg-gray-400">Policies</dt><dd className="font-semibold">{MOTOR_RISK_NOTE.example.policies}</dd></div>
          <div><dt className="text-lbg-gray-400">Expected claims</dt><dd className="font-semibold">{MOTOR_RISK_NOTE.example.expectedClaims}</dd></div>
          <div><dt className="text-lbg-gray-400">Risk layer</dt><dd className="font-semibold">{MOTOR_RISK_NOTE.example.riskLayer}</dd></div>
          <div><dt className="text-lbg-gray-400">Investor capital</dt><dd className="font-semibold">{MOTOR_RISK_NOTE.example.investorCapital}</dd></div>
        </dl>
      </Card>

      <FutureFlowDiagram diagram={MOTOR_LAYER_DIAGRAM} />

      <Card className="p-4 mb-4">
        <SectionTitle>Modelling factors</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {MOTOR_RISK_NOTE.factors.map((f) => (
            <Badge key={f} variant="neutral">{f}</Badge>
          ))}
        </div>
      </Card>
    </>
  );
}

function HealthTab() {
  return (
    <>
      <Card className="p-5 mb-4">
        <Badge variant="warning">Phase 3 — highest complexity</Badge>
        <h2 className="text-lg font-bold mt-2">{HEALTH_RISK_NOTE.title}</h2>
        <p className="text-xs font-mono text-lbg-green">{HEALTH_RISK_NOTE.securityId}</p>
        <p className="text-sm text-lbg-gray-600 mt-2">{HEALTH_RISK_NOTE.subtitle}</p>
      </Card>

      <FutureFlowDiagram diagram={HEALTH_AGGREGATION_DIAGRAM} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <SectionTitle>On Canton ledger</SectionTitle>
          <BulletList items={HEALTH_RISK_NOTE.onLedger} />
        </Card>
        <Card className="p-4">
          <SectionTitle>Never on ledger</SectionTitle>
          <BulletList items={HEALTH_RISK_NOTE.notOnLedger} />
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <SectionTitle>Additional complexities</SectionTitle>
        <BulletList items={HEALTH_RISK_NOTE.complexities} />
      </Card>
    </>
  );
}

function SecondaryTab() {
  return (
    <>
      <FutureFlowDiagram diagram={SECONDARY_MARKET_DIAGRAM} />
      <FutureFlowDiagram diagram={DVP_DIAGRAM} />

      <Card className="p-4 mb-4">
        <SectionTitle>Transfer(Security, Buyer) — embedded conditions</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TRANSFER_CONDITIONS.map((c) => (
            <div key={c} className="flex items-center gap-2 text-sm text-lbg-gray-600">
              <Shield className="w-4 h-4 text-lbg-green shrink-0" aria-hidden />
              {c}
            </div>
          ))}
        </div>
        <p className="text-xs text-lbg-gray-400 mt-3">
          The security carries transfer rules — reducing manual reconciliation versus traditional OTC insurance-linked
          note transfers.
        </p>
      </Card>
    </>
  );
}

function ArchitectureTab() {
  return (
    <>
      <Card className="p-4 mb-4">
        <SectionTitle>Canton insurance capital market — five layers</SectionTitle>
        <div className="space-y-2">
          {FIVE_LAYERS.map((layer, index) => (
            <div
              key={layer.id}
              className="flex items-start gap-3 rounded-lg border border-lbg-gray-100 px-3 py-2 bg-white"
            >
              <span className="text-xs font-bold text-lbg-green w-6 shrink-0">{index + 1}</span>
              <div>
                <p className="text-sm font-semibold">{layer.title}</p>
                <p className="text-xs text-lbg-gray-500">{layer.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <SectionTitle>InsuranceLinkedNote — conceptual Daml fields</SectionTitle>
        <div className="flex flex-wrap gap-2 mb-4">
          {DAML_FIELDS.map((field) => (
            <span key={field} className="text-xs font-mono bg-lbg-gray-50 border border-lbg-gray-100 rounded px-2 py-1">
              {field}
            </span>
          ))}
        </div>
        <SectionTitle>Choices</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {DAML_CHOICES.map((choice) => (
            <Badge key={choice} variant="neutral">{choice}</Badge>
          ))}
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <SectionTitle>Oracle architecture (multi-source)</SectionTitle>
        <div className="space-y-3">
          {ORACLE_EXAMPLES.map((row) => (
            <div key={row.product} className="rounded-lg border border-lbg-gray-100 p-3 text-sm">
              <p className="font-semibold">{row.product}</p>
              <p className="text-lbg-gray-600 mt-1">Trigger: {row.trigger}</p>
              <p className="text-xs text-lbg-gray-400 mt-1">Sources: {row.sources}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-lbg-gray-400 mt-3">
          Data Source A + B + C → oracle committee → Canton trigger determination → security cash flow.
        </p>
      </Card>
    </>
  );
}

function RoadmapTab() {
  return (
    <>
      <div className="space-y-4 mb-4">
        {ROADMAP_PHASES.map((phase) => (
          <Card key={phase.phase} className="p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={phase.phase === 1 ? 'success' : 'neutral'}>Phase {phase.phase}</Badge>
              <span className="text-xs text-lbg-gray-400">{phase.status}</span>
            </div>
            <h3 className="font-bold text-lbg-black">{phase.title}</h3>
            <BulletList items={phase.items} />
            {phase.next ? (
              <p className="text-xs text-lbg-green font-medium mt-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" aria-hidden />
                {phase.next}
              </p>
            ) : null}
          </Card>
        ))}
      </div>

      <Card className="p-4 mb-4">
        <SectionTitle>UK regulatory architecture — two distinct questions</SectionTitle>
        <div className="space-y-3">
          {REGULATORY_QUESTIONS.map((item) => (
            <div key={item.q} className="border-b border-lbg-gray-50 pb-3 last:border-0">
              <p className="text-sm font-semibold">{item.q}</p>
              <p className="text-sm text-lbg-gray-600 mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 mb-4 border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          From 19 January 2026, UK Public Offers and Admissions to Trading (POATs) applies to distribution and secondary
          design — not merely a technical tokenization exercise.
        </p>
      </Card>
    </>
  );
}

const TAB_CONTENT: Record<CapitalMarketTabId, () => ReactElement> = {
  overview: OverviewTab,
  home: HomeTab,
  motor: MotorTab,
  health: HealthTab,
  secondary: SecondaryTab,
  architecture: ArchitectureTab,
  roadmap: RoadmapTab,
};

export function InsuranceCapitalMarketPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const activeView: CapitalMarketTabId = isCapitalMarketTabId(viewParam) ? viewParam : 'home';

  const selectView = (id: CapitalMarketTabId) => {
    setSearchParams({ view: id });
  };

  const Content = TAB_CONTENT[activeView];

  return (
    <AdminLayout>
      <PageHeader
        icon={Building2}
        title="Insurance capital market"
        subtitle="UK secondary-market issuance — home, motor, and health risk notes on Canton"
        metrics={[
          { label: 'Phase 1 focus', value: 'Home ILS', tone: 'success' },
          { label: 'Security', value: HOME_RISK_NOTE.securityId },
          { label: 'Notional (illustrative)', value: HOME_RISK_NOTE.structure.notional },
        ]}
        actions={
          <Link
            to="/capital-market/blueprint"
            className="text-sm font-semibold text-lbg-green hover:underline"
          >
            Animated blueprint →
          </Link>
        }
      />

      <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-lbg-gray-100 shadow-sm overflow-x-auto">
        {CAPITAL_MARKET_TABS.map(({ id, label }) => {
          const Icon = TAB_ICONS[id];
          return (
          <button
            key={id}
            type="button"
            onClick={() => selectView(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeView === id
                ? 'bg-lbg-green text-white shadow-sm'
                : 'text-lbg-gray-600 hover:bg-lbg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            {label}
          </button>
          );
        })}
      </div>

      <Content />
    </AdminLayout>
  );
}
