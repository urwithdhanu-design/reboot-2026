import { FileCode2, ExternalLink, Pause, Play, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { smartContracts } from '../data/adminMockData';

const statusBadge = { active: 'success', paused: 'warning', upgrading: 'info' } as const;

export function SmartContractsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Smart Contracts"
        subtitle="Deployed blockchain contracts powering Reboot 2026 tokenization"
        actions={<Button size="sm">Deploy New Contract</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {smartContracts.map((sc) => (
          <Card key={sc.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-lbg-green-light flex items-center justify-center">
                  <FileCode2 className="w-5 h-5 text-lbg-green" />
                </div>
                <div>
                  <p className="font-bold">{sc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="info">{sc.standard}</Badge>
                    <Badge variant={statusBadge[sc.status]}>{sc.status}</Badge>
                    <span className="text-xs text-lbg-gray-400">v{sc.version}</span>
                  </div>
                </div>
              </div>
              {sc.status === 'active' ? (
                <Button variant="ghost" size="sm" aria-label={`Pause ${sc.name}`}>
                  <Pause className="w-4 h-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" aria-label={`Resume ${sc.name}`}>
                  <Play className="w-4 h-4" aria-hidden="true" />
                </Button>
              )}
            </div>

            <p className="text-sm text-lbg-gray-600 mb-4">{sc.description}</p>

            <button
              type="button"
              onClick={() => copyAddress(sc.address)}
              aria-label={`Copy address ${sc.address}`}
              className="flex items-center gap-2 font-mono text-xs text-lbg-green bg-lbg-green-light/50 px-3 py-2 rounded-lg w-full hover:bg-lbg-green-light transition-colors mb-4"
            >
              {sc.address}
              {copied === sc.address ? <Check className="w-3 h-3 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
            </button>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-lbg-gray-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-lbg-gray-400">Transactions</p>
                <p className="font-bold text-sm">{sc.totalTransactions.toLocaleString()}</p>
              </div>
              <div className="bg-lbg-gray-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-lbg-gray-400">Gas Used</p>
                <p className="font-bold text-sm">{sc.gasUsed}</p>
              </div>
              <div className="bg-lbg-gray-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-lbg-gray-400">Deployed</p>
                <p className="font-bold text-sm">{sc.deployedAt}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">View ABI</Button>
              <Button variant="outline" size="sm" className="flex-1"><ExternalLink className="w-3 h-3" /> Explorer</Button>
              <Button variant="ghost" size="sm" className="flex-1">Upgrade</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="font-bold mb-3">Tokenization Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { title: 'ERC-721 Policy NFTs', desc: 'Each insurance policy is minted as a unique non-fungible token with IPFS metadata anchoring coverage terms, expiry, and beneficiary details on-chain.' },
            { title: 'ERC-20 Premium Tokens', desc: 'Fungible LBGP tokens enable wallet top-ups, premium auto-debit via smart contracts, and cross-policy payment settlement.' },
            { title: 'ERC-1155 Claim Vouchers', desc: 'Semi-fungible tokens issued upon claim approval. Redeemable for GBP payout or transferable. Burned after redemption.' },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-lbg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-lbg-green-dark">{title}</p>
              <p className="text-lbg-gray-600 mt-2 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
