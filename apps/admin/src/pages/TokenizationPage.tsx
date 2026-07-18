import { useState } from 'react';
import { Coins, Plus, Flame, Snowflake, ArrowRightLeft, Check, X, ExternalLink } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Badge, Button, DataTable, StatCard } from '../components/ui';
import {
  tokenizedAssets, tokenMintQueue, tokenTypeConfigs, blockchainStats, formatGBP, formatNumber,
} from '../data/adminMockData';

const statusBadge = {
  active: 'success', minting: 'info', transferred: 'purple', burned: 'neutral', frozen: 'warning', redeemed: 'success',
  pending: 'warning', approved: 'info', completed: 'success', rejected: 'error',
} as const;

const typeBadge = {
  policy_nft: 'success', premium_credit: 'info', claim_voucher: 'warning', coverage_certificate: 'purple',
} as const;

export function TokenizationPage() {
  const [tab, setTab] = useState<'registry' | 'mint-queue' | 'standards'>('registry');

  return (
    <AdminLayout>
      <PageHeader
        title="Tokenization"
        subtitle="Mint, manage and lifecycle-control blockchain insurance tokens"
        actions={
          <>
            <Button variant="outline" size="sm"><ArrowRightLeft className="w-4 h-4" /> Transfer</Button>
            <Button size="sm"><Plus className="w-4 h-4" /> Mint Policy Token</Button>
          </>
        }
      />

      <Card className="mb-6 bg-gradient-to-r from-lbg-green to-lbg-sidebar text-white border-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-white/80 font-medium">{blockchainStats.networkName} · Chain ID {blockchainStats.chainId}</p>
            <p className="text-2xl font-bold mt-1">Block #{formatNumber(blockchainStats.blockHeight)}</p>
            <p className="text-xs text-white/70 mt-1">Network health {blockchainStats.networkHealth}% · Avg confirmation {blockchainStats.avgConfirmationTime}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'Policy NFTs', v: formatNumber(blockchainStats.policyNFTs) },
              { l: 'Premium Tokens', v: formatNumber(blockchainStats.premiumTokensCirculating) },
              { l: 'Claim Vouchers', v: String(blockchainStats.claimVouchersActive) },
              { l: 'Pending Mints', v: String(blockchainStats.pendingMints) },
            ].map(({ l, v }) => (
              <div key={l} className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{v}</p>
                <p className="text-[10px] text-white/70">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Tokens Minted" value={formatNumber(blockchainStats.totalTokensMinted)} change="+2,847 this month" icon={Coins} trend="up" />
        <StatCard label="On-Chain Policies" value={formatNumber(blockchainStats.policyNFTs)} change="95.8% tokenized" icon={Coins} trend="up" />
        <StatCard label="Daily On-Chain Tx" value={formatNumber(blockchainStats.dailyOnChainTx)} change={`Gas: ${blockchainStats.gasSpentToday}`} icon={Coins} trend="neutral" />
        <StatCard label="Mint Queue" value={String(blockchainStats.pendingMints)} change="Awaiting approval" icon={Coins} trend="neutral" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['registry', 'mint-queue', 'standards'] as const).map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'outline'} size="sm" onClick={() => setTab(t)}>
            {t === 'registry' ? 'Token Registry' : t === 'mint-queue' ? `Mint Queue (${tokenMintQueue.length})` : 'Token Standards'}
          </Button>
        ))}
      </div>

      {tab === 'registry' && (
        <Card padding={false}>
          <DataTable headers={['Token ID', 'Name', 'Standard', 'Type', 'Owner', 'Value', 'Status', 'Contract', 'Actions']}>
            {tokenizedAssets.map((t) => (
              <tr key={t.id} className="hover:bg-lbg-gray-50">
                <td className="py-3 px-4 font-mono text-sm font-semibold">{t.tokenId}</td>
                <td className="py-3 px-4">
                  <p className="font-medium text-sm">{t.name}</p>
                  {t.policyNumber && <p className="text-xs text-lbg-gray-400">{t.policyNumber}</p>}
                </td>
                <td className="py-3 px-4"><Badge variant="info">{t.standard}</Badge></td>
                <td className="py-3 px-4"><Badge variant={typeBadge[t.type]}>{t.type.replace('_', ' ')}</Badge></td>
                <td className="py-3 px-4 text-sm">{t.owner}</td>
                <td className="py-3 px-4 font-semibold">{t.type === 'premium_credit' ? `${formatNumber(t.value)} LBGP` : formatGBP(t.value)}</td>
                <td className="py-3 px-4"><Badge variant={statusBadge[t.status]}>{t.status}</Badge></td>
                <td className="py-3 px-4 font-mono text-xs text-lbg-gray-400">{t.contractAddress}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" aria-label={`View ${t.name} on explorer`}>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </Button>
                    {t.status === 'active' && (
                      <>
                        <Button variant="ghost" size="sm" aria-label={`Freeze ${t.name}`}>
                          <Snowflake className="w-3 h-3" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label={`Burn ${t.name}`}>
                          <Flame className="w-3 h-3" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      {tab === 'mint-queue' && (
        <div className="space-y-3">
          {tokenMintQueue.map((m) => (
            <Card key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold">{m.policyNumber}</p>
                  <Badge variant="info">{m.standard}</Badge>
                  <Badge variant={statusBadge[m.status]}>{m.status}</Badge>
                </div>
                <p className="text-sm text-lbg-gray-600 mt-1">{m.customerName} · {m.category} · Coverage {formatGBP(m.coverage)}</p>
                <p className="text-xs text-lbg-gray-400 mt-1">Requested {m.requestedAt}</p>
              </div>
              {m.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm"><Check className="w-4 h-4" /> Approve Mint</Button>
                  <Button variant="danger" size="sm"><X className="w-4 h-4" /> Reject</Button>
                </div>
              )}
              {m.status === 'minting' && <Badge variant="info">Minting on-chain...</Badge>}
            </Card>
          ))}
        </div>
      )}

      {tab === 'standards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {tokenTypeConfigs.map((tc) => (
            <Card key={tc.standard}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge variant="info">{tc.standard}</Badge>
                  <p className="font-bold text-lg mt-2">{tc.name}</p>
                  <p className="text-sm text-lbg-gray-400">{tc.symbol}</p>
                </div>
                <div className={`w-10 h-5 rounded-full ${tc.enabled ? 'bg-lbg-green' : 'bg-lbg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow mx-0.5 mt-0.5 transition-transform ${tc.enabled ? 'translate-x-5' : ''}`} />
                </div>
              </div>
              <p className="text-sm text-lbg-gray-600 mb-4">{tc.description}</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-lbg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-lbg-gray-400">Total Supply</p>
                  <p className="font-bold">{formatNumber(tc.totalSupply)}</p>
                </div>
                <div className="bg-lbg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-lbg-gray-400">Circulating</p>
                  <p className="font-bold">{formatNumber(tc.circulating)}</p>
                </div>
              </div>
              <p className="font-mono text-xs text-lbg-gray-400">{tc.contractAddress}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full">Configure</Button>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
