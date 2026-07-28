import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Link2,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import {
  AlertBanner,
  Badge,
  Button,
  ContentPanel,
  FilterTabs,
  PageHeader,
  PaginatedTable,
  StatCard,
} from '../components/ui';
import { adminApi, type WalletOpsView } from '../api';
import { formatGBP } from '../data/adminMockData';

const REFRESH_MS = 15_000;

type Tab = 'transactions' | 'wallets';

const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  completed: 'success',
  connected: 'success',
  pending: 'warning',
  disconnected: 'neutral',
  failed: 'error',
};

const typeBadge: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  claim_payout: 'success',
  premium: 'warning',
  recharge: 'info',
};

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function formatType(type: string) {
  return type.replace(/_/g, ' ');
}

function shortId(value?: string | null, len = 10) {
  if (!value) return '—';
  if (value.length <= len + 3) return value;
  return `${value.slice(0, len)}…`;
}

export function WalletOpsPage() {
  const [tab, setTab] = useState<Tab>('transactions');
  const [data, setData] = useState<WalletOpsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    adminApi
      .walletOpsView()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load wallet operations data');
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => load(true), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [live, load]);

  const stats = data?.stats;
  const transactions = data?.transactions ?? [];
  const wallets = data?.wallets ?? [];

  return (
    <AdminLayout>
      <PageHeader
        icon={Wallet}
        title="Wallet operations"
        subtitle="Live customer wallet balances, top-ups, premium debits, and claim payouts"
        metrics={[
          { label: 'Connected', value: stats?.connected_wallets ?? '—', tone: 'success' },
          { label: 'Total balance', value: formatGBP(stats?.total_balance_gbp ?? 0) },
          { label: 'Claim payouts', value: formatGBP(stats?.claim_payouts_gbp ?? 0), tone: 'success' },
          { label: 'Transactions', value: stats?.transaction_count ?? '—' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant={live ? 'hero' : 'outline'} onClick={() => setLive((v) => !v)}>
              <Activity className={`w-4 h-4 ${live ? 'animate-pulse' : ''}`} />
              {live ? `Live · ${REFRESH_MS / 1000}s` : 'Paused'}
            </Button>
            <Button size="sm" variant="hero" onClick={() => load(false)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      {data?.generated_at ? (
        <p className="text-xs text-lbg-gray-400 mb-4">
          Last updated {formatWhen(data.generated_at)}
          {loading ? ' · refreshing…' : ''}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total wallet volume"
          value={formatGBP(stats?.total_volume_gbp ?? 0)}
          change={`${stats?.transaction_count ?? 0} ledger movements`}
          icon={Wallet}
          trend="up"
        />
        <StatCard
          label="Recharge volume"
          value={formatGBP(stats?.recharge_volume_gbp ?? 0)}
          change="Demo top-ups"
          icon={ArrowDownLeft}
          trend="neutral"
        />
        <StatCard
          label="Premium debits"
          value={formatGBP(stats?.premium_volume_gbp ?? 0)}
          change="Wallet premium payments"
          icon={ArrowUpRight}
          trend="down"
        />
        <StatCard
          label="Disconnected wallets"
          value={String(stats?.disconnected_wallets ?? 0)}
          change={`${stats?.total_wallets ?? 0} total accounts`}
          icon={Link2}
          trend="neutral"
        />
      </div>

      <FilterTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'transactions', label: `Transactions (${transactions.length})` },
          { value: 'wallets', label: `Customer wallets (${wallets.length})` },
        ]}
      />

      {tab === 'transactions' && (
        <ContentPanel
          title="Recent transactions"
          description="Wallet ledger movements from wallet-service (recharge, premium, claim payout)"
          className="mt-4"
        >
          <PaginatedTable
            columns={[
              { key: 'id', label: 'ID', sortable: true },
              { key: 'customer_name', label: 'Customer', sortable: true },
              { key: 'type', label: 'Type', sortable: true },
              { key: 'amount', label: 'Amount', sortable: true },
              { key: 'method', label: 'Method', sortable: true },
              { key: 'status', label: 'Status', sortable: true },
              { key: 'blockchain_tx', label: 'Reference', sortable: true },
              { key: 'created_at', label: 'Date', sortable: true },
            ]}
            rows={transactions}
            rowKey={(tx) => tx.id}
            defaultSortKey="created_at"
            defaultSortDir="desc"
            pageSize={10}
            getSortValue={(row, key) => {
              if (key === 'amount') return row.amount;
              if (key === 'blockchain_tx') return row.blockchain_tx ?? '';
              return (row as Record<string, string | number | null | undefined>)[key] ?? '';
            }}
            emptyMessage="No wallet transactions yet. Customer recharges, premium payments, and claim payouts appear here."
            renderRow={(tx) => (
              <tr key={tx.id} className="hover:bg-lbg-gray-50">
                <td className="py-3 px-4 font-mono text-sm">{tx.id}</td>
                <td className="py-3 px-4">
                  <p className="font-semibold">{tx.customer_name ?? tx.customer_email ?? tx.user_id}</p>
                  <p className="text-xs text-lbg-gray-400">{tx.customer_email ?? '—'}</p>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={typeBadge[tx.type] ?? 'neutral'}>{formatType(tx.type)}</Badge>
                </td>
                <td className={`py-3 px-4 font-bold ${tx.amount > 0 ? 'text-lbg-green' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}
                  {formatGBP(tx.amount)}
                </td>
                <td className="py-3 px-4 text-sm">{tx.method ?? '—'}</td>
                <td className="py-3 px-4">
                  <Badge variant={statusBadge[tx.status] ?? 'neutral'}>{tx.status}</Badge>
                </td>
                <td className="py-3 px-4">
                  {tx.blockchain_tx ? (
                    <span className="flex items-center gap-1 text-xs font-mono text-lbg-gray-500">
                      <Link2 className="w-3 h-3 text-lbg-green shrink-0" />
                      {shortId(tx.blockchain_tx, 14)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-3 px-4 text-lbg-gray-400 whitespace-nowrap">{formatWhen(tx.created_at)}</td>
              </tr>
            )}
          />
        </ContentPanel>
      )}

      {tab === 'wallets' && (
        <ContentPanel
          title="Customer wallets"
          description="Connected demo and Canton-linked wallets with live balances"
          className="mt-4"
        >
          <PaginatedTable
            columns={[
              { key: 'email', label: 'Customer', sortable: true },
              { key: 'address', label: 'Address', sortable: true },
              { key: 'status', label: 'Status', sortable: true },
              { key: 'provider', label: 'Provider', sortable: true },
              { key: 'mode', label: 'Mode', sortable: true },
              { key: 'balance_gbp', label: 'Balance', sortable: true },
              { key: 'updated_at', label: 'Updated', sortable: true },
            ]}
            rows={wallets}
            rowKey={(w) => w.user_id}
            defaultSortKey="updated_at"
            defaultSortDir="desc"
            pageSize={10}
            getSortValue={(row, key) => {
              if (key === 'balance_gbp') return row.balance_gbp;
              return (row as Record<string, string | number | null | undefined>)[key] ?? '';
            }}
            emptyMessage="No customer wallets created yet."
            renderRow={(w) => (
              <tr key={w.user_id} className="hover:bg-lbg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-semibold">{w.email ?? w.user_id}</p>
                  <p className="text-xs text-lbg-gray-400 font-mono">{shortId(w.user_id, 12)}</p>
                </td>
                <td className="py-3 px-4 font-mono text-xs">{shortId(w.address, 16)}</td>
                <td className="py-3 px-4">
                  <Badge variant={statusBadge[w.status] ?? 'neutral'}>{w.status}</Badge>
                </td>
                <td className="py-3 px-4 text-sm">{w.provider ?? '—'}</td>
                <td className="py-3 px-4 text-sm">{w.mode ?? '—'}</td>
                <td className="py-3 px-4 font-bold">{formatGBP(w.balance_gbp)}</td>
                <td className="py-3 px-4 text-lbg-gray-400 whitespace-nowrap">{formatWhen(w.updated_at)}</td>
              </tr>
            )}
          />
        </ContentPanel>
      )}
    </AdminLayout>
  );
}
