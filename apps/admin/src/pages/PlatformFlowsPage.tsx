import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Wallet, FileText, ClipboardList, Coins, Zap, Brain, Link2,
  ArrowRight, BookOpen,
} from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Button } from '../components/ui';

const SECTIONS = [
  {
    id: 'kyc',
    title: 'KYC flow',
    icon: ShieldCheck,
    color: '#2563eb',
    pipeline: ['Register', 'Upload docs', 'AI / Admin review', 'Digitisation consent', 'Verified'],
    insight: 'Admin approve moves to pending_consent — not straight to verified. CustomerVerified fires only after consent POST.',
    apis: ['POST /api/kyc/submit', 'POST /api/kyc/consent', 'PATCH /api/admin/customers/{id}/kyc'],
    adminLink: '/kyc',
  },
  {
    id: 'wallet',
    title: 'Wallet linking',
    icon: Wallet,
    color: '#00864f',
    pipeline: ['KYC verified', 'Create or link', 'connected', 'WalletLinked', 'Mint retry'],
    insight: 'Wallet is never auto-created on KYC verify. Policy mint waits until WalletLinked event retries pending mints.',
    apis: ['POST /api/wallet/create', 'POST /api/wallet/link', 'GET /api/wallet'],
    adminLink: '/wallet',
  },
  {
    id: 'policy',
    title: 'Policy issuance & minting',
    icon: FileText,
    color: '#7c3aed',
    pipeline: ['Quote', 'Pay premium', 'ISSUED', 'Canton mint', 'MINTED + rules'],
    insight: 'Wallet pay debits customer and credits vendor reserve atomically. Mint needs KYC + wallet + compliance.',
    apis: ['POST /api/quotes/estimate', 'POST /api/payments/wallet', 'POST /api/blockchain/internal/policy-nft/mint'],
    adminLink: '/tokenization',
  },
  {
    id: 'manual-claim',
    title: 'Manual claim settlement',
    icon: ClipboardList,
    color: '#d97706',
    pipeline: ['Submit', 'pending_approval', 'Admin approve', 'credit-claim', 'settled'],
    insight: 'Open queries block approval. Canton re-verified at approve. Chain settle is best-effort after wallet credit.',
    apis: ['POST /api/claims', 'POST /api/claims/{id}/approve', 'POST /api/internal/wallet/credit-claim'],
    adminLink: '/claims',
  },
  {
    id: 'parametric',
    title: 'Parametric settlement',
    icon: Zap,
    color: '#ea580c',
    pipeline: ['Oracle / sim', 'Rule match', 'parametric claim', 'Auto ≤£500', 'Payout'],
    insight: 'Above £500 parametric claims join manual queue. Oracle→pool chain entry is audit-only; GBP moves at credit-claim.',
    apis: ['POST /api/parametric/simulate/flight-delay', 'POST /api/internal/claims/parametric'],
    adminLink: '/parametric',
  },
  {
    id: 'funds',
    title: 'Fund transfer on claim success',
    icon: Coins,
    color: '#016846',
    pipeline: ['Premium → vendor', 'Vendor → pool', 'Pool debit', 'Customer +£', 'Chain mirror'],
    insight: 'Claims pool (£100k seed) is payout source. Idempotent per claimId. Vendor must contribute reserve to pool.',
    apis: ['POST /api/vendor-portal/claims-pool/contribute', 'POST /api/admin/wallet-ops/claims-pool/top-up'],
    adminLink: '/wallet',
  },
] as const;

const AI_ITEMS = [
  { name: 'KYC AI agent', desc: 'Auto-approves submissions when enabled (kyc-service)', icon: ShieldCheck },
  { name: 'Stallion chatbot', desc: 'RAG insurance Q&A — chatbot-assistance-service :8090', icon: Brain },
  { name: 'Flight oracle', desc: 'Polls delay data; triggers parametric rules automatically', icon: Zap },
  { name: 'Fraud scorer', desc: 'Heuristic scoring on mint and settlement chain txs', icon: Link2 },
];

export function PlatformFlowsPage() {
  const [expanded, setExpanded] = useState<string>('kyc');

  return (
    <AdminLayout>
      <PageHeader
        icon={BookOpen}
        title="Platform flows"
        subtitle="Visual reference for KYC, wallet, policy minting, claims, parametric automation, and fund movement"
      />

      <Card className="mb-6 p-4 border-lbg-green/20 bg-lbg-green-light/30">
        <p className="text-sm text-lbg-gray-600">
          Full documentation with Mermaid diagrams lives in{' '}
          <code className="text-xs bg-white px-1.5 py-0.5 rounded">docs/PLATFORM-FLOWS.md</code>
          {' '}in the repository. This page is the interactive admin companion.
        </p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {AI_ITEMS.map(({ name, desc, icon: Icon }) => (
          <Card key={name} className="p-4">
            <div className="platform-ai-orb w-9 h-9 mb-2" style={{ width: '2.25rem', height: '2.25rem' }}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="font-bold text-sm">{name}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">{desc}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = expanded === section.id;
          return (
            <Card key={section.id} className="flow-doc-section overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-lbg-gray-50 transition-colors"
                onClick={() => setExpanded(isOpen ? '' : section.id)}
                aria-expanded={isOpen}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${section.color}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color: section.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{section.title}</p>
                  <p className="text-xs text-lbg-gray-400 truncate">{section.pipeline.join(' → ')}</p>
                </div>
                <ArrowRight className={`w-4 h-4 text-lbg-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {isOpen ? (
                <div className="px-4 pb-4 border-t border-lbg-gray-100 pt-4">
                  <div className="flow-pipeline mb-4">
                    {section.pipeline.map((step, i) => (
                      <span key={step} className="contents">
                        <span className="flow-box flow-box--active" style={{ borderColor: section.color }}>
                          {step}
                        </span>
                        {i < section.pipeline.length - 1 ? (
                          <span className="flow-arrow" aria-hidden>→</span>
                        ) : null}
                      </span>
                    ))}
                  </div>

                  <div className="flow-insight mb-4">{section.insight}</div>

                  <div className="mb-4">
                    <p className="text-xs font-bold text-lbg-gray-400 uppercase tracking-wide mb-2">Key APIs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {section.apis.map((api) => (
                        <code key={api} className="text-[10px] bg-lbg-gray-50 border border-lbg-gray-100 px-2 py-1 rounded font-mono">
                          {api}
                        </code>
                      ))}
                    </div>
                  </div>

                  <Link to={section.adminLink}>
                    <Button size="sm" variant="outline">
                      Open in admin
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-5">
        <h3 className="font-bold mb-3">GBP money map</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-lbg-gray-50 border border-lbg-gray-100">
            <p className="font-semibold text-lbg-green">Premium inflow</p>
            <p className="text-xs text-lbg-gray-400 mt-1">Customer wallet −£ → Vendor reserve +£</p>
          </div>
          <div className="p-3 rounded-lg bg-lbg-gray-50 border border-lbg-gray-100">
            <p className="font-semibold text-lbg-green">Pool funding</p>
            <p className="text-xs text-lbg-gray-400 mt-1">Vendor reserve −£ → Claims pool +£</p>
          </div>
          <div className="p-3 rounded-lg bg-lbg-gray-50 border border-lbg-gray-100">
            <p className="font-semibold text-amber-600">Claim payout</p>
            <p className="text-xs text-lbg-gray-400 mt-1">Claims pool −£ → Customer wallet +£</p>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}
