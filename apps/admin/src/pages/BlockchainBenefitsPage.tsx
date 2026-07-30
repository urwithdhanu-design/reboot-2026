import {
  Blocks,
  Bot,
  CircleDollarSign,
  FileCheck2,
  Globe2,
  Network,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { BusinessBenefitMap } from '../components/blockchainBenefits/BusinessBenefitMap';
import { CantonConceptsSection } from '../components/blockchainBenefits/CantonConceptsSection';
import { Badge, Card, PageHeader, StatCard } from '../components/ui';

const headlineOutcomes = [
  { value: '70–90%', label: 'Faster claims (parametric)', icon: Zap },
  { value: 'Real-time', label: 'Settlement & status', icon: CircleDollarSign },
  { value: 'Immutable', label: 'Audit trail', icon: ShieldCheck },
];

const challengeOutcomes = [
  { challenge: 'Fraud & disputes', outcome: 'Tamper-proof policy and claim records' },
  { challenge: 'Manual claims', outcome: 'Rules-based automation where products allow it' },
  { challenge: 'Slow payments', outcome: 'Wallet and tokenized settlement paths' },
  { challenge: 'Compliance', outcome: 'Shared audit trail for regulators and partners' },
];

const lifecycleHighlights = [
  'KYC and consent on verifiable records',
  'Policy issuance with ledger attestation',
  'Parametric and standard claims with clear status',
  'Reinsurance and reporting from one trusted timeline',
];

const cantonPoints = [
  'Privacy between insurers, customers, and partners',
  'Enterprise performance—not a public ledger',
  'Interoperability for capital-market and bank workflows',
];

const stackLayers = [
  { icon: Blocks, title: 'Blockchain', text: 'Shared source of truth' },
  { icon: FileCheck2, title: 'Smart contracts', text: 'Automated rules' },
  { icon: Bot, title: 'AI', text: 'Fraud and risk signals' },
  { icon: Zap, title: 'Real-time data', text: 'Parametric triggers' },
  { icon: CircleDollarSign, title: 'Tokenization', text: 'Faster settlement' },
];

export function BlockchainBenefitsPage() {
  return (
    <AdminLayout>
      <div className="blockchain-benefits-page">
        <PageHeader
          icon={Sparkles}
          title="Blockchain business benefits"
          subtitle="Trusted records and automation for UK insurance operations."
          metrics={[
            { label: 'Focus areas', value: '4', tone: 'success' },
            { label: 'Settlement', value: 'Near real-time', tone: 'success' },
            { label: 'Ledger model', value: 'Permissioned', tone: 'default' },
          ]}
        />

        <Card className="mb-6 border-lbg-green/30 bg-gradient-to-br from-lbg-green-light/60 to-white bb-hero bb-reveal">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <span className="bb-badge-pop inline-block">
                <Badge variant="success">Executive summary</Badge>
              </span>
              <h2 className="mt-3 text-xl font-bold text-lbg-black sm:text-2xl">
                Trust, automation, and faster settlement
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-lbg-gray-600">
                Blockchain adds value when combined with smart contracts, tokenization, AI, and live data—not as a
                replacement for your core policy and customer systems.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 bb-outcome-grid">
              <Outcome label="Trust" detail="Tamper-proof records" icon={ShieldCheck} delay={0} />
              <Outcome label="Automation" detail="Consistent rules" icon={Zap} delay={1} />
              <Outcome label="Transparency" detail="Shared operational view" icon={Blocks} delay={2} />
              <Outcome label="Reach" detail="Cross-border ready" icon={Globe2} delay={3} />
            </div>
          </div>
        </Card>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 bb-stat-grid bb-reveal bb-reveal--delay-2">
          {headlineOutcomes.map(({ value, label, icon: Icon }) => (
            <StatCard key={label} label={label} value={value} change="Demo platform" trend="up" icon={Icon} />
          ))}
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2 bb-reveal bb-reveal--delay-3">
          <Card className="p-5">
            <h2 className="text-base font-bold text-lbg-black">Problems we address</h2>
            <p className="mt-1 text-sm text-lbg-gray-500">Four common challenges and the platform response.</p>
            <ul className="mt-4 space-y-3">
              {challengeOutcomes.map(({ challenge, outcome }, rowIndex) => (
                <li
                  key={challenge}
                  className="bb-table-row rounded-lg border border-lbg-gray-100 px-3 py-2.5"
                  style={{ animationDelay: `${rowIndex * 50}ms` }}
                >
                  <p className="text-sm font-semibold text-lbg-black">{challenge}</p>
                  <p className="mt-0.5 text-sm text-lbg-gray-600">{outcome}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-bold text-lbg-black">Across the lifecycle</h2>
            <p className="mt-1 text-sm text-lbg-gray-500">Where trusted records matter most.</p>
            <ul className="mt-4 space-y-2.5">
              {lifecycleHighlights.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm text-lbg-gray-600 bb-canton-item"
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lbg-green" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_0.9fr] bb-reveal bb-reveal--delay-4">
          <Card className="border-lbg-green/25 bg-gradient-to-br from-lbg-sidebar to-lbg-green-dark text-white bb-canton-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 bb-canton-icon">
              <Network className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-bold">Why permissioned Canton</h2>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Controlled sharing, governance, and performance for regulated insurance—not open-chain speculation.
            </p>
            <ul className="mt-4 space-y-2.5 bb-canton-list">
              {cantonPoints.map((point, index) => (
                <li
                  key={point}
                  className="flex gap-2 text-sm leading-5 text-white/90 bb-canton-item"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lbg-green-light" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-bold text-lbg-black">Platform stack</h2>
            <p className="mt-1 text-sm text-lbg-gray-500">Layers that amplify blockchain value.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 bb-cap-grid">
              {stackLayers.map(({ icon: Icon, title, text }, index) => (
                <div key={title} className="bb-cap-card-wrap" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="bb-cap-card flex gap-3 rounded-lg border border-lbg-gray-100 bg-lbg-gray-50/50 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lbg-green-light">
                      <Icon className="h-4 w-4 text-lbg-green" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-lbg-black">{title}</p>
                      <p className="text-xs text-lbg-gray-500">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <BusinessBenefitMap />

        <CantonConceptsSection />
      </div>
    </AdminLayout>
  );
}

function Outcome({
  label,
  detail,
  icon: Icon,
  delay,
}: {
  label: string;
  detail: string;
  icon: typeof ShieldCheck;
  delay: number;
}) {
  return (
    <div
      className="rounded-xl border border-lbg-green/20 bg-white/80 p-3 shadow-sm bb-outcome-pill"
      style={{ animationDelay: `${delay * 90}ms` }}
    >
      <Icon className="h-4 w-4 text-lbg-green" aria-hidden="true" />
      <p className="mt-2 text-sm font-bold text-lbg-black">{label}</p>
      <p className="mt-0.5 text-xs text-lbg-gray-500">{detail}</p>
    </div>
  );
}
