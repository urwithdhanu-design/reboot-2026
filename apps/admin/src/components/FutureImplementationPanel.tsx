import { useSearchParams } from 'react-router-dom';
import type { ReactElement } from 'react';
import {
  Satellite, Scale, FileText, BadgeCheck, Sparkles,
  Globe2, FileSearch,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FutureFlowDiagram } from './FutureFlowDiagram';
import {
  FUTURE_IMPLEMENTATION_TABS,
  isFutureImplementationTabId,
  type FutureImplementationTabId,
  ORACLE_PATTERN_INTRO,
  CLAIM_AUTOMATION_FUTURE,
  ORACLE_FEEDS,
  SANCTIONS_SOURCES,
  DOCUMENT_AI_INTRO,
  DOCUMENT_AI_CAPABILITIES,
  CLAIM_ELIGIBILITY_INTRO,
  CLAIM_ELIGIBILITY_CHECKS,
  ZERO_TOUCH_INTRO,
} from '../data/futureIntegrations';
import { Card, Badge } from './ui';

const TAB_ICONS: Record<FutureImplementationTabId, LucideIcon> = {
  oracles: Satellite,
  compliance: Scale,
  'document-ai': FileText,
  eligibility: BadgeCheck,
  'zero-touch': Sparkles,
};

function CapabilityCards({
  items,
  columns = 3,
}: {
  items: Array<{ id: string; title: string; sub: string; flow: string; badge?: string }>;
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 4
      ? 'lg:grid-cols-4'
      : columns === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 ${colClass} gap-3 text-sm`}>
      {items.map((item) => (
        <div key={item.id} className="future-cap-card p-3 rounded-lg border border-lbg-gray-100 bg-white">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{item.title}</p>
            {item.badge ? (
              <Badge variant={item.badge === 'Partially live' ? 'success' : 'neutral'}>
                {item.badge}
              </Badge>
            ) : (
              <Badge variant="neutral">Planned</Badge>
            )}
          </div>
          <p className="text-xs text-lbg-gray-400 mt-1">{item.sub}</p>
          <p className="text-[10px] font-mono text-lbg-green mt-2">{item.flow}</p>
        </div>
      ))}
    </div>
  );
}

function TabIntro({ title, lead, body }: { title: string; lead?: string; body?: string }) {
  return (
    <Card className="mb-4 p-4 border-lbg-green/15 bg-lbg-green-light/25">
      <h3 className="font-bold text-lbg-black">{title}</h3>
      {lead ? <p className="text-sm text-lbg-gray-600 mt-1">{lead}</p> : null}
      {body ? <p className="text-xs text-lbg-gray-500 mt-2">{body}</p> : null}
    </Card>
  );
}

function OraclesTab() {
  const tab = FUTURE_IMPLEMENTATION_TABS.find((t) => t.id === 'oracles')!;

  return (
    <>
      <TabIntro
        title={ORACLE_PATTERN_INTRO.title}
        lead={ORACLE_PATTERN_INTRO.lead}
        body={ORACLE_PATTERN_INTRO.body}
      />
      {tab.diagrams.map((d) => <FutureFlowDiagram key={d.id} diagram={d} />)}
      <Card className="mb-4 p-5">
        <h3 className="font-bold mb-2">Trusted oracle feeds</h3>
        <CapabilityCards
          columns={3}
          items={ORACLE_FEEDS.map((f) => ({
            id: f.id,
            title: f.label,
            sub: f.sub,
            flow: f.flow,
            badge: f.status === 'live' ? 'Partially live' : 'Planned',
          }))}
        />
      </Card>
      <Card className="p-4 border-amber-100 bg-amber-50/50">
        <p className="font-bold text-amber-900 text-sm">{CLAIM_AUTOMATION_FUTURE.title}</p>
        <p className="text-xs text-amber-800 mt-1">{CLAIM_AUTOMATION_FUTURE.subtitle}</p>
        <ul className="mt-2 space-y-1 text-xs text-amber-900/90 list-disc pl-4">
          {CLAIM_AUTOMATION_FUTURE.bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
      </Card>
    </>
  );
}

function ComplianceTab() {
  const tab = FUTURE_IMPLEMENTATION_TABS.find((t) => t.id === 'compliance')!;

  return (
    <>
      <TabIntro
        title="Sanctions & PEP screening"
        lead="Wire global watchlists into KYC, pre-mint compliance, and high-value claim gates."
      />
      {tab.diagrams.map((d) => <FutureFlowDiagram key={d.id} diagram={d} />)}
      <Card className="p-5">
        <h3 className="font-bold mb-2">Screening sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {SANCTIONS_SOURCES.map((src) => (
            <div key={src.id} className="future-cap-card p-3 rounded-lg border border-lbg-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <FileSearch className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <p className="font-semibold">{src.name}</p>
              </div>
              <div className="text-[10px] text-lbg-gray-500 space-y-0.5">
                <p><span className="font-medium">Free:</span> {src.freeUse}</p>
                <p><span className="font-medium">Commercial:</span> {src.commercial}</p>
                <p><span className="font-medium">Format:</span> {src.format}</p>
                <p><span className="font-medium">Scope:</span> {src.scope}</p>
              </div>
              <p className="text-xs text-lbg-gray-500 mt-2">{src.useCase}</p>
              <p className="text-[10px] font-mono text-lbg-green mt-2 flex items-center gap-1">
                <Globe2 className="w-3 h-3" />
                {src.flow}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function DocumentAiTab() {
  const tab = FUTURE_IMPLEMENTATION_TABS.find((t) => t.id === 'document-ai')!;

  return (
    <>
      <TabIntro title={DOCUMENT_AI_INTRO.title} lead={DOCUMENT_AI_INTRO.lead} body={DOCUMENT_AI_INTRO.body} />
      {tab.diagrams.map((d) => <FutureFlowDiagram key={d.id} diagram={d} />)}
      <Card className="p-5">
        <h3 className="font-bold mb-2">Capabilities</h3>
        <CapabilityCards
          columns={4}
          items={DOCUMENT_AI_CAPABILITIES.map((c) => ({
            id: c.id,
            title: c.label,
            sub: c.sub,
            flow: c.flow,
          }))}
        />
      </Card>
    </>
  );
}

function EligibilityTab() {
  const tab = FUTURE_IMPLEMENTATION_TABS.find((t) => t.id === 'eligibility')!;

  return (
    <>
      <TabIntro
        title={CLAIM_ELIGIBILITY_INTRO.title}
        lead={CLAIM_ELIGIBILITY_INTRO.lead}
        body={CLAIM_ELIGIBILITY_INTRO.body}
      />
      {tab.diagrams.map((d) => <FutureFlowDiagram key={d.id} diagram={d} />)}
      <Card className="p-5">
        <h3 className="font-bold mb-2">Eligibility checks</h3>
        <CapabilityCards
          columns={3}
          items={CLAIM_ELIGIBILITY_CHECKS.map((c) => ({
            id: c.id,
            title: c.label,
            sub: c.sub,
            flow: c.flow,
          }))}
        />
      </Card>
    </>
  );
}

function ZeroTouchTab() {
  const tab = FUTURE_IMPLEMENTATION_TABS.find((t) => t.id === 'zero-touch')!;

  return (
    <>
      <TabIntro title={ZERO_TOUCH_INTRO.title} lead={ZERO_TOUCH_INTRO.lead} />
      {tab.diagrams.map((d) => <FutureFlowDiagram key={d.id} diagram={d} />)}
      <Card className="p-5 border-lbg-green/20 bg-gradient-to-br from-lbg-green-light/40 to-white">
        <p className="font-bold text-lbg-green-dark">{ZERO_TOUCH_INTRO.subtitle}</p>
        <ul className="mt-3 space-y-2 text-sm text-lbg-gray-600 list-disc pl-4">
          {ZERO_TOUCH_INTRO.bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
        <div className="platform-zero-touch-pipeline mt-4">
          {['Quote', 'Pay', 'Mint', 'Trigger', 'Eligibility', 'Payout', 'Audit'].map((step, i) => (
            <span key={step} className="contents">
              <span className="platform-zero-touch-step">{step}</span>
              {i < 6 ? <span className="platform-zero-touch-arrow">→</span> : null}
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}

const TAB_CONTENT: Record<FutureImplementationTabId, () => ReactElement> = {
  oracles: OraclesTab,
  compliance: ComplianceTab,
  'document-ai': DocumentAiTab,
  eligibility: EligibilityTab,
  'zero-touch': ZeroTouchTab,
};

export function FutureImplementationPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const activeView: FutureImplementationTabId = isFutureImplementationTabId(viewParam)
    ? viewParam
    : 'oracles';

  const selectView = (id: FutureImplementationTabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', id);
      return next;
    });
  };

  const Content = TAB_CONTENT[activeView];

  return (
    <>
      <Card className="mb-4 p-4 border-lbg-green/20 bg-lbg-green-light/30">
        <p className="text-sm text-lbg-gray-600">
          Roadmap only — oracles, compliance screening, document AI, claim eligibility, and zero-touch automation.
          Each tab shows a <strong>flow diagram</strong> and planned capability boxes wired into today&apos;s KYC, mint,
          parametric, and claims paths.
        </p>
      </Card>

      <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-lbg-gray-100 shadow-sm overflow-x-auto">
        {FUTURE_IMPLEMENTATION_TABS.map(({ id, label, summary }) => {
          const Icon = TAB_ICONS[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectView(id)}
              title={summary}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeView === id
                  ? 'bg-lbg-green text-white shadow-sm'
                  : 'text-lbg-gray-600 hover:bg-lbg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="future-tab-panel animate-fade-in">
        <Content />
      </div>
    </>
  );
}
