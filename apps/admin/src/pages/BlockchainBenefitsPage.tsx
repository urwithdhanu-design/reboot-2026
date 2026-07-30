import {
  Blocks,
  Bot,
  CircleDollarSign,
  DatabaseZap,
  FileCheck2,
  Globe2,
  LockKeyhole,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge, Card, DataTable, PageHeader, StatCard } from '../components/ui';

const benefits = [
  ['Fraudulent claims', 'Immutable transaction history', 'Lower fraud losses'],
  ['Manual claim processing', 'Smart contracts automate claims', 'Faster settlements'],
  ['Policy disputes', 'Tamper-proof policy records', 'Increased customer trust'],
  ['Multiple intermediaries', 'Shared ledger', 'Lower operating costs'],
  ['Cross-border insurance', 'Global blockchain network', 'Faster international processing'],
  ['Slow payments', 'Tokenized payments or stablecoins', 'Near real-time settlement'],
  ['Compliance audits', 'Immutable audit trail', 'Easier regulatory reporting'],
];

const processBenefits = [
  ['Customer onboarding', 'Verifiable identity and consent records'],
  ['Policy issuance', 'Tamper-evident policy records'],
  ['Premium payment', 'Transparent payment tracking'],
  ['Endorsements', 'Immutable history of changes'],
  ['Claims', 'Automated, rule-based processing'],
  ['Fraud detection', 'Shared, auditable records'],
  ['Reinsurance', 'Efficient data sharing and settlement'],
  ['Regulatory reporting', 'Trusted audit trail'],
];

const cantonBenefits = [
  'Privacy between customers, insurers, reinsurers, and regulators',
  'Fine-grained access control for each participant and workflow',
  'High throughput and predictable enterprise performance',
  'Interoperability across connected networks and partners',
  'Strong governance and compliance support',
  'Finality suitable for enterprise transactions',
];

const demoOutcomes = [
  { value: '70–90%', label: 'faster automated claim processing', detail: 'For automation-ready products such as parametric insurance.' },
  { value: 'Lower cost', label: 'smart-contract-driven workflows', detail: 'Fewer manual hand-offs and operational exceptions.' },
  { value: 'Real-time', label: 'claim status for customers', detail: 'A transparent view from event detection to settlement.' },
  { value: 'Enterprise', label: 'auditability and interoperability', detail: 'A trusted foundation for regulators, reinsurers, and payment providers.' },
];

const capabilities = [
  { icon: Blocks, title: 'Blockchain', text: 'Shared, immutable policy and claims records provide a trusted source of truth.' },
  { icon: FileCheck2, title: 'Smart contracts', text: 'Pre-agreed rules automatically trigger policy actions and claims settlement.' },
  { icon: Bot, title: 'AI', text: 'Risk scoring and anomaly detection prioritise exceptions before they become losses.' },
  { icon: Zap, title: 'Real-time data', text: 'Verified event data activates parametric cover and keeps decisions current.' },
  { icon: CircleDollarSign, title: 'Tokenization', text: 'Tokenized premiums, claims vouchers, and stablecoins speed up settlement.' },
];

export function BlockchainBenefitsPage() {
  return (
    <AdminLayout>
      <PageHeader
        icon={Sparkles}
        title="Blockchain business benefits"
        subtitle="A practical view of how trusted records and automation can improve insurance operations."
        metrics={[
          { label: 'Business challenges', value: '7' },
          { label: 'Automation enablers', value: '5', tone: 'success' },
          { label: 'Settlement speed', value: 'Real-time', tone: 'success' },
          { label: 'Auditability', value: 'Immutable', tone: 'default' },
        ]}
      />

      <Card className="mb-6 border-lbg-green/30 bg-gradient-to-br from-lbg-green-light/60 to-white">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <Badge variant="success">Platform transformation</Badge>
            <h2 className="mt-3 text-2xl font-bold text-lbg-black">Trust and automation, working together</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-lbg-gray-600">
              Blockchain transforms an insurance platform by improving trust, automation, transparency, fraud prevention,
              and operational efficiency. The greatest value comes from combining it with smart contracts, tokenization,
              AI, and real-time data sources.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <Outcome label="Trust" detail="Tamper-proof records" icon={ShieldCheck} />
            <Outcome label="Automation" detail="Rules execute consistently" icon={Zap} />
            <Outcome label="Transparency" detail="Shared operational view" icon={Blocks} />
            <Outcome label="Global reach" detail="Cross-border processing" icon={Globe2} />
          </div>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Claims processing" value="Automated" change="Smart-contract workflows" trend="up" icon={Zap} />
        <StatCard label="Fraud prevention" value="Strengthened" change="Immutable transaction history" trend="up" icon={ShieldCheck} />
        <StatCard label="Settlement" value="Near real-time" change="Tokenized payment options" trend="up" icon={CircleDollarSign} />
      </div>

      <DemoOutcomesSection />

      <Card className="mb-6" padding={false}>
        <div className="border-b border-lbg-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-lbg-black">Business benefit map</h2>
          <p className="mt-1 text-sm text-lbg-gray-500">Connect each insurance challenge to its blockchain-enabled outcome.</p>
        </div>
        <DataTable headers={['Business challenge', 'Blockchain solution', 'Business value']}>
          {benefits.map(([challenge, solution, value]) => (
            <tr key={challenge} className="align-top hover:bg-lbg-gray-50/70">
              <td className="px-4 py-4 font-semibold text-lbg-black">{challenge}</td>
              <td className="px-4 py-4 text-lbg-gray-600">{solution}</td>
              <td className="px-4 py-4"><Badge variant="success">{value}</Badge></td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card padding={false}>
          <div className="border-b border-lbg-gray-100 px-5 py-4">
            <h2 className="text-base font-bold text-lbg-black">Where blockchain adds the most value</h2>
            <p className="mt-1 text-sm text-lbg-gray-500">Automation and trusted records across the full insurance lifecycle.</p>
          </div>
          <DataTable headers={['Insurance process', 'Blockchain benefit']}>
            {processBenefits.map(([process, benefit]) => (
              <tr key={process} className="hover:bg-lbg-gray-50/70">
                <td className="px-4 py-3 font-semibold text-lbg-black">{process}</td>
                <td className="px-4 py-3 text-lbg-gray-600">{benefit}</td>
              </tr>
            ))}
          </DataTable>
        </Card>

        <Card className="border-lbg-green/25 bg-gradient-to-br from-lbg-sidebar to-lbg-green-dark text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Network className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold">Why permissioned Canton fits insurance</h2>
          <p className="mt-2 text-sm leading-6 text-white/80">
            Enterprise insurance needs controlled data sharing, predictable performance, and governance—not a fully public ledger.
          </p>
          <ul className="mt-5 space-y-3">
            {cantonBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-2 text-sm leading-5 text-white/90">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lbg-green-light" aria-hidden="true" />
                {benefit}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section>
        <div className="mb-3">
          <h2 className="text-base font-bold text-lbg-black">Automation foundation</h2>
          <p className="mt-1 text-sm text-lbg-gray-500">Blockchain delivers more value when connected to these platform capabilities.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {capabilities.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="border-t-2 border-t-lbg-green">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-lbg-green-light">
                <Icon className="h-5 w-5 text-lbg-green" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-lbg-black">{title}</h3>
              <p className="mt-1.5 text-sm leading-5 text-lbg-gray-600">{text}</p>
            </Card>
          ))}
        </div>
      </section>

    </AdminLayout>
  );
}

function DemoOutcomesSection() {
  return (
    <section className="mb-6">
      <div className="mb-3">
        <h2 className="text-base font-bold text-lbg-black">Insurance platform demo outcomes</h2>
        <p className="mt-1 text-sm text-lbg-gray-500">
          The combined Spring Boot microservices, smart contracts, tokenized policies, and automated claims architecture demonstrates measurable business value.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {demoOutcomes.map(({ value, label, detail }, index) => {
          const icons = [DatabaseZap, FileCheck2, Zap, Scale];
          const Icon = icons[index];
          return (
            <Card key={label} className="relative overflow-hidden">
              <Icon className="absolute right-4 top-4 h-8 w-8 text-lbg-green/15" aria-hidden="true" />
              <p className="text-2xl font-bold text-lbg-green">{value}</p>
              <h3 className="mt-1 font-bold text-lbg-black">{label}</h3>
              <p className="mt-1.5 text-sm leading-5 text-lbg-gray-600">{detail}</p>
            </Card>
          );
        })}
      </div>
      <Card className="mt-4 border-lbg-green/30 bg-lbg-green-light/40">
        <div className="flex gap-3">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-lbg-green" aria-hidden="true" />
          <p className="text-sm leading-6 text-lbg-gray-700">
            Together, these capabilities improve customer experience, operational efficiency, compliance, fraud prevention, and cost control while creating transparent, tamper-evident policy management that builds customer trust.
          </p>
        </div>
      </Card>
    </section>
  );
}

function Outcome({ label, detail, icon: Icon }: { label: string; detail: string; icon: typeof ShieldCheck }) {
  return (
    <div className="rounded-xl border border-lbg-green/20 bg-white/80 p-3 shadow-sm">
      <Icon className="h-4 w-4 text-lbg-green" aria-hidden="true" />
      <p className="mt-2 text-sm font-bold text-lbg-black">{label}</p>
      <p className="mt-0.5 text-xs text-lbg-gray-500">{detail}</p>
    </div>
  );
}
