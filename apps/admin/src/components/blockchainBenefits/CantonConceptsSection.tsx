import { ArrowLeftRight, Database, Scale, Shield } from 'lucide-react';
import { Badge, Card } from '../ui';
import { VehicleDvpAnimation } from './VehicleDvpAnimation';

function FlowNode({
  label,
  sub,
  variant = 'default',
  pulse = false,
}: {
  label: string;
  sub?: string;
  variant?: 'default' | 'party' | 'asset' | 'cash' | 'atomic' | 'risk';
  pulse?: boolean;
}) {
  return (
    <div className={`bb-flow-node bb-flow-node--${variant}${pulse ? ' bb-flow-node--pulse' : ''}`}>
      <span className="bb-flow-node-label">{label}</span>
      {sub ? <small>{sub}</small> : null}
    </div>
  );
}

function FlowArrow({ label, variant = 'default' }: { label?: string; variant?: 'default' | 'risk' | 'atomic' }) {
  return (
    <div className={`bb-flow-arrow bb-flow-arrow--${variant}`} aria-hidden>
      {label ? <span className="bb-flow-arrow-label">{label}</span> : null}
      <span className="bb-flow-arrow-line" />
    </div>
  );
}

export function CantonConceptsSection() {
  return (
    <section className="bb-concepts bb-reveal bb-reveal--delay-5" aria-labelledby="bb-concepts-heading">
      <div className="mb-4">
        <Badge variant="success">Canton advantage</Badge>
        <h2 id="bb-concepts-heading" className="mt-2 text-lg font-bold text-lbg-black">
          PCS & DvP — privacy and atomic settlement
        </h2>
        <p className="mt-1 text-sm text-lbg-gray-600 max-w-3xl">
          Why permissioned Canton fits insurance-linked securities and secondary markets: private contract stores per
          participant, and delivery-versus-payment that removes principal risk.
        </p>
      </div>

      {/* PCS */}
      <Card className="mb-6 p-5 bb-concept-card">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="bb-concept-icon-wrap">
            <Database className="w-5 h-5" aria-hidden />
          </div>
          <h3 className="text-base font-bold text-lbg-black">1. PCS — Private Contract Store</h3>
        </div>
        <p className="text-sm text-lbg-gray-600 leading-relaxed">
          Each Canton <strong>participant</strong> keeps the contracts and history relevant to the parties it hosts—not
          a copy of every contract on the network. That is the opposite of a public blockchain&apos;s global replica.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="bb-tree-card">
            <p className="text-xs font-bold uppercase tracking-wide text-lbg-green">Example contract</p>
            <p className="mt-2 font-bold text-lbg-black">Insurance security</p>
            <ul className="mt-2 space-y-1 text-sm text-lbg-gray-600 font-mono">
              <li>Issuer: Insurance company</li>
              <li>Owner: Investor A</li>
              <li>Face value: £1,000</li>
              <li>Rights: Premium / claims / redemption</li>
            </ul>
            <p className="mt-3 text-xs text-lbg-gray-500">
              Stored on the participant node with visibility rules—not broadcast to everyone.
            </p>
          </div>

          <div className="bb-participant-grid">
            {['Participant A', 'Participant B', 'Participant C'].map((name, i) => (
              <div key={name} className="bb-participant-col bb-canton-item" style={{ animationDelay: `${i * 80}ms` }}>
                <FlowNode label={name} sub="Participant node" variant="party" pulse />
                <FlowArrow />
                <div className="bb-pcs-box">
                  <Shield className="w-4 h-4 text-lbg-green shrink-0" aria-hidden />
                  <span>Sees contracts relevant to hosted parties only</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 bb-callout">
          <strong>Public chain:</strong> entire network typically holds one global ledger.{' '}
          <strong>Canton:</strong> each participant holds a <em>virtual</em> shared record with private slices.
        </div>
      </Card>

      {/* DvP */}
      <Card className="mb-6 p-5 bb-concept-card">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="bb-concept-icon-wrap">
            <ArrowLeftRight className="w-5 h-5" aria-hidden />
          </div>
          <h3 className="text-base font-bold text-lbg-black">2. DvP — Delivery versus Payment</h3>
        </div>
        <p className="text-sm text-lbg-gray-600">
          The asset is delivered <strong>if and only if</strong> payment happens—standard capital-markets settlement
          pattern, implemented atomically on Canton.
        </p>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="bb-dvp-panel bb-dvp-panel--risk">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">Without DvP — settlement risk</p>
            <div className="mt-3 flex flex-col items-center gap-2">
              <FlowNode label="Investor A" variant="party" />
              <FlowArrow label="£1,000" variant="risk" />
              <FlowNode label="Investor B" variant="party" />
              <FlowArrow label="Security" variant="risk" />
              <FlowNode label="Investor A" variant="party" />
            </div>
            <p className="mt-3 text-xs text-red-800/90">
              A may pay but B never delivers—or B delivers but A never pays. <strong>Principal risk.</strong>
            </p>
          </div>

          <div className="bb-dvp-panel bb-dvp-panel--atomic">
            <p className="text-xs font-bold uppercase tracking-wide text-lbg-green">With DvP — atomic transaction</p>
            <div className="mt-3 bb-atomic-hub">
              <FlowNode label="Atomic transaction" variant="atomic" pulse />
              <div className="bb-atomic-forks">
                <div className="bb-atomic-branch">
                  <FlowArrow variant="atomic" />
                  <FlowNode label="£1,000" sub="A → B" variant="cash" />
                </div>
                <div className="bb-atomic-branch">
                  <FlowArrow variant="atomic" />
                  <FlowNode label="Security" sub="B → A" variant="asset" />
                </div>
              </div>
              <p className="bb-atomic-footer">Both succeed — or neither happens</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-lbg-green/20 bg-lbg-green-light/30 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-lbg-green">Canton coordinates the exchange</p>
          <div className="mt-3 bb-canton-dvp-flow">
            <FlowNode label="Canton transaction" variant="atomic" pulse />
            <div className="bb-canton-dvp-split">
              <FlowNode label="Insurance security" sub="Transfer ownership A → B" variant="asset" />
              <FlowNode label="Digital cash" sub="Transfer payment B → A" variant="cash" />
            </div>
            <p className="text-center text-xs font-semibold text-lbg-green-dark mt-2">Atomic settlement</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
              <Badge variant="neutral">Insurer = issuer</Badge>
              <Badge variant="neutral">Investor A = seller</Badge>
              <Badge variant="neutral">Investor B = buyer</Badge>
              <Badge variant="neutral">Bank = cash</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Vehicle example */}
      <Card className="mb-6 p-5 bb-concept-card">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="bb-concept-icon-wrap">
            <Scale className="w-5 h-5" aria-hidden />
          </div>
          <h3 className="text-base font-bold text-lbg-black">Vehicle insurance security — DvP in practice</h3>
        </div>
        <p className="text-sm text-lbg-gray-600">
          Investor B buys <strong>Vehicle insurance security #123</strong> from Investor A for <strong>£10,000</strong>.
        </p>

        <VehicleDvpAnimation />
      </Card>
    </section>
  );
}
