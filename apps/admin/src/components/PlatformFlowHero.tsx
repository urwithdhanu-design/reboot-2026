import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Wallet, FileText, Coins, ClipboardList, Zap,
  Brain, Link2, ArrowRight, Sparkles,
} from 'lucide-react';
import { Button } from './ui';

const FLOWS = [
  {
    id: 'kyc',
    label: 'KYC',
    icon: ShieldCheck,
    color: '#2563eb',
    steps: ['Register', 'Upload ID', 'AI / Admin review', 'Consent', 'Verified'],
    insight: 'AI KYC agent auto-approves by default — customer must still accept digitisation consent.',
    link: '/kyc',
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: Wallet,
    color: '#00864f',
    steps: ['KYC verified', 'Create / link wallet', 'WalletLinked event', 'Mint retry'],
    insight: 'Wallet creation is user-initiated — CustomerVerified alone does not create a wallet.',
    link: '/wallet',
  },
  {
    id: 'policy',
    label: 'Policy & mint',
    icon: FileText,
    color: '#7c3aed',
    steps: ['Quote', 'Pay premium', 'ISSUED', 'Canton mint', 'MINTED'],
    insight: 'Premium credits vendor reserve; policy NFT mints only when wallet + KYC gates pass.',
    link: '/tokenization',
  },
  {
    id: 'claims',
    label: 'Claims',
    icon: ClipboardList,
    color: '#d97706',
    steps: ['Submit', 'Review', 'Approve', 'Pool debit', 'Settled'],
    insight: 'Parametric claims ≤ £500 auto-settle; above that they join the manual approval queue.',
    link: '/claims',
  },
  {
    id: 'funds',
    label: 'Funds',
    icon: Coins,
    color: '#016846',
    steps: ['Premium → vendor', 'Vendor → pool', 'Pool → customer', 'Chain mirror'],
    insight: 'Claims pool is the payout source — vendors must contribute reserve before settlements.',
    link: '/wallet',
  },
] as const;

type FlowId = (typeof FLOWS)[number]['id'];

const CHAIN_NODES = ['KYC', 'Wallet', 'Policy', 'Mint', 'Claim', 'Payout'];

export function PlatformFlowHero() {
  const [activeFlow, setActiveFlow] = useState<FlowId>('kyc');
  const [activeStep, setActiveStep] = useState(0);
  const [tick, setTick] = useState(0);

  const flow = FLOWS.find((f) => f.id === activeFlow)!;

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStep((s) => (s + 1) % flow.steps.length);
    }, 2200);
    return () => clearInterval(stepTimer);
  }, [flow.steps.length]);

  useEffect(() => {
    const flowTimer = setInterval(() => {
      setActiveFlow((id) => {
        const idx = FLOWS.findIndex((f) => f.id === id);
        const next = FLOWS[(idx + 1) % FLOWS.length];
        setActiveStep(0);
        return next.id;
      });
    }, 11000);
    return () => clearInterval(flowTimer);
  }, []);

  useEffect(() => {
    const pulse = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(pulse);
  }, []);

  return (
    <section className="platform-hero mb-6 overflow-hidden rounded-2xl border border-lbg-green/20 bg-white">
      <div className="platform-hero-grid">
        <div className="platform-hero-main p-5 sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="platform-hero-badge">
              <Sparkles className="w-3.5 h-3.5" />
              Live platform flows
            </span>
            <span className="platform-hero-badge platform-hero-badge--ai">
              <Brain className="w-3.5 h-3.5" />
              AI + Blockchain
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-lbg-black mb-1">
            From identity to on-chain settlement
          </h2>
          <p className="text-sm text-lbg-gray-400 mb-5 max-w-xl">
            Animated view of KYC, wallet linking, Canton minting, parametric claims, and GBP fund movement across the platform stack.
          </p>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {FLOWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setActiveFlow(id); setActiveStep(0); }}
                className={`platform-flow-tab ${activeFlow === id ? 'platform-flow-tab--active' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="platform-step-track mb-4" aria-label={`${flow.label} flow steps`}>
            {flow.steps.map((step, i) => (
              <div key={step} className="platform-step-item">
                <div
                  className={`platform-step-node ${i === activeStep ? 'platform-step-node--active' : ''} ${i < activeStep ? 'platform-step-node--done' : ''}`}
                  style={{ '--step-color': flow.color } as CSSProperties}
                >
                  <span>{i + 1}</span>
                </div>
                {i < flow.steps.length - 1 ? (
                  <div className={`platform-step-connector ${i < activeStep ? 'platform-step-connector--done' : ''}`} />
                ) : null}
                <p className={`platform-step-label ${i === activeStep ? 'platform-step-label--active' : ''}`}>{step}</p>
              </div>
            ))}
          </div>

          <div className="platform-insight-box mb-4">
            <Zap className="w-4 h-4 shrink-0 text-amber-500" />
            <p className="text-sm text-lbg-gray-600">{flow.insight}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to={flow.link}>
              <Button size="sm">
                Open {flow.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link
              to="/flows"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-lbg-green hover:underline"
            >
              Full flow reference
            </Link>
          </div>
        </div>

        <div className="platform-hero-viz relative min-h-[280px] sm:min-h-[320px] bg-lbg-sidebar p-5 sm:p-6 flex flex-col justify-between">
          <div className="platform-viz-glow" aria-hidden />

          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-3">Blockchain mesh</p>
            <div className="platform-chain-row">
              {CHAIN_NODES.map((node, i) => (
                <div key={node} className="platform-chain-cell">
                  <div
                    className={`platform-chain-block ${(tick + i) % CHAIN_NODES.length === activeStep % CHAIN_NODES.length ? 'platform-chain-block--pulse' : ''}`}
                  >
                    <Link2 className="w-3 h-3 text-lbg-green-muted" />
                  </div>
                  {i < CHAIN_NODES.length - 1 ? (
                    <div className="platform-chain-link">
                      <span className="platform-chain-packet" style={{ animationDelay: `${i * 0.4}s` }} />
                    </div>
                  ) : null}
                  <span className="platform-chain-label">{node}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-3">AI integrations</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'KYC agent', sub: 'Auto-approve' },
                { label: 'Stallion', sub: 'RAG chatbot' },
                { label: 'Oracle', sub: 'Parametric' },
              ].map(({ label, sub }, i) => (
                <div key={label} className="platform-ai-card">
                  <div className="platform-ai-orb" style={{ animationDelay: `${i * 0.6}s` }}>
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-white mt-2">{label}</p>
                  <p className="text-[10px] text-white/60">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="platform-scan-line" aria-hidden />
        </div>
      </div>
    </section>
  );
}
