import { useEffect, useState, type CSSProperties } from 'react';
import {
  ShieldCheck, Wallet, FileText, Coins, ClipboardList, Zap,
  Brain, Link2, Sparkles,
} from 'lucide-react';

const FLOWS = [
  {
    id: 'kyc',
    label: 'KYC',
    icon: ShieldCheck,
    color: '#60a5fa',
    steps: ['Register', 'Upload ID', 'AI / Admin review', 'Consent', 'Verified'],
    insight: 'AI KYC agent auto-approves by default — customer must still accept digitisation consent.',
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: Wallet,
    color: '#4ade80',
    steps: ['KYC verified', 'Create / link wallet', 'WalletLinked event', 'Mint retry'],
    insight: 'Wallet creation is user-initiated — verified identity alone does not create a wallet.',
  },
  {
    id: 'policy',
    label: 'Policy & mint',
    icon: FileText,
    color: '#a78bfa',
    steps: ['Quote', 'Pay premium', 'ISSUED', 'Canton mint', 'MINTED'],
    insight: 'Premium credits vendor reserve; policy NFT mints when wallet and KYC gates pass.',
  },
  {
    id: 'claims',
    label: 'Claims',
    icon: ClipboardList,
    color: '#fbbf24',
    steps: ['Submit', 'Review', 'Approve', 'Pool debit', 'Settled'],
    insight: 'Parametric claims ≤ £500 auto-settle; larger amounts join the manual approval queue.',
  },
  {
    id: 'funds',
    label: 'Funds',
    icon: Coins,
    color: '#34d399',
    steps: ['Premium → vendor', 'Vendor → pool', 'Pool → customer', 'Chain mirror'],
    insight: 'Claims pool is the payout source — vendors contribute reserve before settlements.',
  },
] as const;

type FlowId = (typeof FLOWS)[number]['id'];

const CHAIN_NODES = ['KYC', 'Wallet', 'Policy', 'Mint', 'Claim', 'Payout'];

export function PlatformFlowHero({ compact = false }: { compact?: boolean }) {
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
    <section
      className={`platform-hero platform-hero--login ${compact ? 'platform-hero--login-compact' : ''}`}
      aria-label="Platform flow animation"
    >
      <div className="platform-viz-glow platform-viz-glow--login" aria-hidden />

      {!compact ? (
        <div className="platform-hero-badges platform-hero-badges--login">
          <span className="platform-hero-badge platform-hero-badge--login">
            <Sparkles className="w-3.5 h-3.5" />
            Live platform flows
          </span>
          <span className="platform-hero-badge platform-hero-badge--login-ai">
            <Brain className="w-3.5 h-3.5" />
            AI + Blockchain
          </span>
        </div>
      ) : null}

      <h2 className="platform-hero-title platform-hero-title--login">
        {compact ? 'Platform flows' : 'From identity to on-chain settlement'}
      </h2>
      {!compact ? (
        <p className="platform-hero-subtitle platform-hero-subtitle--login">
          KYC, wallet linking, Canton minting, parametric claims, and GBP fund movement across the platform stack.
        </p>
      ) : null}

      <div className="platform-flow-tabs platform-flow-tabs--login">
        {FLOWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setActiveFlow(id); setActiveStep(0); }}
            className={`platform-flow-tab platform-flow-tab--login ${activeFlow === id ? 'platform-flow-tab--login-active' : ''}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="platform-step-track platform-step-track--login" aria-label={`${flow.label} flow steps`}>
        {flow.steps.map((step, i) => (
          <div key={step} className="platform-step-item">
            <div className="platform-step-node-row">
              <div
                className={`platform-step-node platform-step-node--login ${i === activeStep ? 'platform-step-node--login-active' : ''} ${i < activeStep ? 'platform-step-node--login-done' : ''}`}
                style={{ '--step-color': flow.color } as CSSProperties}
              >
                <span>{i + 1}</span>
              </div>
              {i < flow.steps.length - 1 ? (
                <div className={`platform-step-connector platform-step-connector--login ${i < activeStep ? 'platform-step-connector--login-done' : ''}`} />
              ) : null}
            </div>
            <p className={`platform-step-label platform-step-label--login ${i === activeStep ? 'platform-step-label--login-active' : ''}`}>
              {step}
            </p>
          </div>
        ))}
      </div>

      <div className="platform-insight-box platform-insight-box--login">
        <Zap className="w-4 h-4 shrink-0 text-amber-300" />
        <p className="text-sm leading-relaxed">{flow.insight}</p>
      </div>

      {!compact ? (
        <div className="platform-login-viz">
          <div className="platform-viz-section">
            <p className="platform-viz-heading">Blockchain mesh</p>
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

          <div className="platform-viz-section platform-viz-section--ai">
            <p className="platform-viz-heading">AI integrations</p>
            <div className="platform-ai-grid">
              {[
                { label: 'KYC agent', sub: 'Auto-approve' },
                { label: 'Stallion', sub: 'RAG chatbot' },
                { label: 'Oracle', sub: 'Parametric' },
              ].map(({ label, sub }, i) => (
                <div key={label} className="platform-ai-card">
                  <div className="platform-ai-orb" style={{ animationDelay: `${i * 0.6}s` }}>
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-white mt-2.5">{label}</p>
                  <p className="text-[10px] text-white/60 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="platform-scan-line" aria-hidden />
    </section>
  );
}
