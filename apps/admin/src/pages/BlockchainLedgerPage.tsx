import { useState } from 'react';
import { Link2, Copy, Check, Activity } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Badge, Button, DataTable, StatCard } from '../components/ui';
import { ledgerEntries, blockchainStats, formatNumber } from '../data/adminMockData';

const typeBadge = {
  policy_mint: 'success', claim_payout: 'warning', premium_debit: 'info',
  kyc_anchor: 'purple', token_transfer: 'neutral', token_burn: 'error', contract_deploy: 'info',
} as const;

const statusBadge = { confirmed: 'success', pending: 'warning', failed: 'error' } as const;

export function BlockchainLedgerPage() {
  const [filter, setFilter] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = filter === 'all' ? ledgerEntries : ledgerEntries.filter((e) => e.type === filter);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Blockchain Ledger"
        subtitle="Immutable on-chain audit trail for all insurance operations"
        actions={<Badge variant="success"><Activity className="w-3 h-3 mr-1" /> Live</Badge>}
      />

      <Card className="mb-6 border-lbg-green/30 bg-lbg-green-light/30">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { l: 'Network', v: blockchainStats.networkName },
            { l: 'Chain ID', v: String(blockchainStats.chainId) },
            { l: 'Block Height', v: formatNumber(blockchainStats.blockHeight) },
            { l: 'Health', v: `${blockchainStats.networkHealth}%` },
            { l: 'Daily Transactions', v: formatNumber(blockchainStats.dailyOnChainTx) },
          ].map(({ l, v }) => (
            <div key={l}>
              <p className="text-[10px] text-lbg-gray-400 uppercase font-medium">{l}</p>
              <p className="text-sm font-bold mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Policy Mints" value={String(ledgerEntries.filter((e) => e.type === 'policy_mint').length)} icon={Link2} />
        <StatCard label="Claim Payouts" value={String(ledgerEntries.filter((e) => e.type === 'claim_payout').length)} icon={Link2} />
        <StatCard label="Gas Spent Today" value={blockchainStats.gasSpentToday} icon={Link2} />
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-lbg-gray-100 flex flex-wrap gap-2">
          {['all', 'policy_mint', 'claim_payout', 'premium_debit', 'kyc_anchor', 'token_transfer', 'token_burn'].map((f) => (
            <Button key={f} variant={filter === f ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </Button>
          ))}
        </div>
        <DataTable headers={['Type', 'Description', 'From', 'To', 'Value', 'Tx Hash', 'Block', 'Gas', 'Status', 'Time']}>
          {filtered.map((e) => (
            <tr key={e.id} className="hover:bg-lbg-gray-50">
              <td className="py-3 px-4"><Badge variant={typeBadge[e.type]}>{e.type.replace('_', ' ')}</Badge></td>
              <td className="py-3 px-4 text-sm font-medium">{e.description}</td>
              <td className="py-3 px-4 text-xs text-lbg-gray-600 max-w-[120px] truncate">{e.from}</td>
              <td className="py-3 px-4 text-xs text-lbg-gray-600 max-w-[120px] truncate">{e.to}</td>
              <td className="py-3 px-4 text-sm font-semibold">{e.value ?? '—'}</td>
              <td className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => copyHash(e.txHash)}
                  aria-label={`Copy transaction hash ${e.txHash}`}
                  className="flex items-center gap-1 font-mono text-xs text-lbg-green hover:underline"
                >
                  {e.txHash}
                  {copied === e.txHash ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                </button>
              </td>
              <td className="py-3 px-4 font-mono text-xs">{e.blockNumber}</td>
              <td className="py-3 px-4 text-xs text-lbg-gray-400">{e.gasUsed}</td>
              <td className="py-3 px-4"><Badge variant={statusBadge[e.status]}>{e.status}</Badge></td>
              <td className="py-3 px-4 text-xs text-lbg-gray-400 whitespace-nowrap">{e.timestamp}</td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </AdminLayout>
  );
}
