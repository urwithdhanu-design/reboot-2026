import { useCallback, useEffect, useState } from 'react';
import { Link2, Copy, Check, Activity, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Badge, Button, DataTable, StatCard } from '../components/ui';
import { ChainLinkedList } from '../components/blockchain/ChainLinkedList';
import { adminApi, type InsuranceChainResponse, type InsuranceChainTx } from '../api';
import { formatNumber } from '../data/adminMockData';

const statusBadge = { confirmed: 'success', pending: 'warning', failed: 'error' } as const;

export function BlockchainLedgerPage() {
  const [chain, setChain] = useState<InsuranceChainResponse | null>(null);
  const [ledgerFilter, setLedgerFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.insuranceChain();
      setChain(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chain');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const network = chain?.network;
  const validation = chain?.validation;
  const allTx: InsuranceChainTx[] =
    chain?.blocks.flatMap((b) => b.transactions.map((t) => ({ ...t, block_height: t.block_height ?? b.height }))) ??
    [];

  const filtered =
    ledgerFilter === 'all' ? allTx : allTx.filter((t) => t.ledger === ledgerFilter || t.type === ledgerFilter);

  const copyHash = (hash: string) => {
    void navigator.clipboard.writeText(hash);
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  };

  const ledgers = [...new Set(allTx.map((t) => t.ledger))];

  return (
    <AdminLayout>
      <PageHeader
        title="GCUL Insurance Chain"
        subtitle="Proof-of-authority ledger — policy, claims, identity, and audit blocks"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant={validation?.valid ? 'success' : 'error'}>
              {validation?.valid ? (
                <>
                  <ShieldCheck className="w-3 h-3 mr-1" /> Valid chain
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3 mr-1" /> Invalid
                </>
              )}
            </Badge>
            <Badge variant="success">
              <Activity className="w-3 h-3 mr-1" /> Live
            </Badge>
          </div>
        }
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 text-red-800 text-sm">{error}</Card>
      )}

      <Card className="mb-6 border-lbg-green/30 bg-lbg-green-light/30">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { l: 'Network', v: network?.network_name ?? '—' },
            { l: 'Chain ID', v: network ? String(network.chain_id) : '—' },
            { l: 'Block Height', v: network ? formatNumber(network.block_height) : '—' },
            { l: 'Consensus', v: network?.consensus ?? '—' },
            { l: 'Transactions', v: network ? formatNumber(network.transaction_count) : '—' },
          ].map(({ l, v }) => (
            <div key={l}>
              <p className="text-[10px] text-lbg-gray-400 uppercase font-medium">{l}</p>
              <p className="text-sm font-bold mt-0.5 capitalize">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Blocks"
          value={chain ? String(chain.blocks.length) : '—'}
          icon={Link2}
        />
        <StatCard
          label="Policy ledger txs"
          value={String(allTx.filter((t) => t.ledger === 'POLICY').length)}
          icon={Link2}
        />
        <StatCard
          label="Claims ledger txs"
          value={String(allTx.filter((t) => t.ledger === 'CLAIMS').length)}
          icon={Link2}
        />
      </div>

      <Card className="mb-6">
        <h2 className="text-sm font-bold text-lbg-gray-700 mb-1">Block chain (linked list)</h2>
        <p className="text-xs text-lbg-gray-500 mb-4">
          Each block points to the previous block hash — scroll horizontally to walk genesis → tip.
        </p>
        {loading && !chain ? (
          <p className="text-sm text-lbg-gray-500 py-8 text-center">Loading chain…</p>
        ) : (
          <ChainLinkedList blocks={chain?.blocks ?? []} />
        )}
      </Card>

      <Card padding={false}>
        <div className="p-4 border-b border-lbg-gray-100 flex flex-wrap gap-2">
          <Button
            key="all"
            variant={ledgerFilter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setLedgerFilter('all')}
          >
            All
          </Button>
          {ledgers.map((f) => (
            <Button key={f} variant={ledgerFilter === f ? 'primary' : 'ghost'} size="sm" onClick={() => setLedgerFilter(f)}>
              {f}
            </Button>
          ))}
        </div>
        <DataTable
          headers={['Type', 'Ledger', 'Actor', 'Tx hash', 'Block', 'Fraud', 'Status', 'Time']}
        >
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-sm text-lbg-gray-500">
                No transactions on chain yet.
              </td>
            </tr>
          ) : (
            filtered.map((e) => (
                <tr key={e.id} className="hover:bg-lbg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium">{e.type.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-4">
                    <Badge variant="info">{e.ledger}</Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-lbg-gray-600 max-w-[140px] truncate" title={e.actor_id ?? ''}>
                    {e.actor_role ?? '—'}
                    {e.actor_id ? ` · ${e.actor_id}` : ''}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => copyHash(e.tx_hash)}
                      aria-label={`Copy transaction hash ${e.tx_hash}`}
                      className="flex items-center gap-1 font-mono text-xs text-lbg-green hover:underline max-w-[200px] truncate"
                      title={e.tx_hash}
                    >
                      {e.tx_hash}
                      {copied === e.tx_hash ? (
                        <Check className="w-3 h-3 shrink-0" aria-hidden />
                      ) : (
                        <Copy className="w-3 h-3 shrink-0" aria-hidden />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{e.block_height ?? 'pending'}</td>
                  <td className="py-3 px-4 text-xs">{e.fraud_score ?? '—'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={e.block_height != null ? statusBadge.confirmed : statusBadge.pending}>
                      {e.block_height != null ? 'confirmed' : 'pending'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-lbg-gray-400 whitespace-nowrap">{e.created_at}</td>
                </tr>
            ))
          )}
        </DataTable>
      </Card>
    </AdminLayout>
  );
}
