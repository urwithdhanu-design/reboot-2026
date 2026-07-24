import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  FileCode2,
  Gauge,
  Radio,
  RefreshCw,
  Route,
  ShieldAlert,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminLayout } from '../components/layout/AdminLayout';
import {
  PageHeader,
  FilterTabs,
  ContentPanel,
  AlertBanner,
  Badge,
  Button,
  Card,
  PaginatedTable,
} from '../components/ui';
import { adminApi, type ChainObservabilityResponse } from '../api';
import { formatNumber } from '../data/adminMockData';

type Tab = 'dashboard' | 'tracing' | 'contracts' | 'performance' | 'security';

const severityBadge: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

function formatHour(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function ChainObservabilityPage() {
  const [data, setData] = useState<ChainObservabilityResponse | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);

  const load = useCallback(() => {
    adminApi
      .chainObservability()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load observability'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(load, 10_000);
    return () => window.clearInterval(id);
  }, [live, load]);

  const chartData = useMemo(
    () =>
      (data?.throughput_24h ?? []).map((p) => ({
        label: formatHour(p.hour),
        count: p.count,
      })),
    [data],
  );

  const dash = data?.dashboard;
  const perf = data?.performance;

  return (
    <AdminLayout>
      <PageHeader
        icon={Radio}
        title="Chain observability"
        subtitle="Real-time dashboards, transaction tracing, contract monitoring, performance, and security alerts"
        metrics={[
          { label: 'Block height', value: dash?.block_height ?? '—' },
          { label: 'Tx (24h)', value: dash?.transactions_24h ?? '—', tone: 'success' },
          { label: 'Mempool', value: dash?.mempool_pending ?? '—', tone: 'warning' },
          {
            label: 'Chain',
            value: dash?.chain_valid ? 'Valid' : 'Invalid',
            tone: dash?.chain_valid ? 'success' : 'danger',
          },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={live ? 'hero' : 'outline'}
              onClick={() => setLive((v) => !v)}
            >
              <Activity className={`w-4 h-4 ${live ? 'animate-pulse' : ''}`} />
              {live ? 'Live · 10s' : 'Paused'}
            </Button>
            <Button size="sm" variant="hero" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <FilterTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'tracing', label: 'Transaction tracing' },
          { value: 'contracts', label: 'Smart contracts' },
          { value: 'performance', label: 'Performance' },
          { value: 'security', label: 'Security alerts' },
        ]}
      />

      {tab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-lbg-gray-400">Total transactions</p>
              <p className="text-2xl font-bold mt-1">{formatNumber(dash?.total_transactions ?? 0)}</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-lbg-gray-400">Fraud flags</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{dash?.fraud_flags ?? 0}</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-lbg-gray-400">Active ledgers</p>
              <p className="text-2xl font-bold mt-1">{dash?.ledgers_active ?? 0}</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-lbg-gray-400">Validator</p>
              <p className="text-sm font-mono font-bold mt-2 truncate">{String(data?.network?.validator_id ?? '—')}</p>
            </Card>
          </div>

          <ContentPanel title="Throughput (24 hours)" description="Transactions anchored per hour">
            <div className="h-56 p-2">
              {chartData.length === 0 ? (
                <p className="text-sm text-lbg-gray-500 text-center py-16">No transactions in the last 24 hours.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00864f" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#00864f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#00864f" fill="url(#txGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </ContentPanel>
        </div>
      )}

      {tab === 'tracing' && (
        <ContentPanel
          title="Transaction tracing"
          description="End-to-end trace IDs across policy, claims, and audit ledgers"
        >
          <PaginatedTable
            columns={[
              { key: 'trace_id', label: 'Trace ID', sortable: true },
              { key: 'type', label: 'Type', sortable: true },
              { key: 'ledger', label: 'Ledger', sortable: true },
              { key: 'status', label: 'Status', sortable: true },
              { key: 'block_height', label: 'Block', sortable: true },
              { key: 'fraud_score', label: 'Fraud', sortable: true },
              { key: 'created_at', label: 'Time', sortable: true },
            ]}
            rows={data?.transaction_traces ?? []}
            rowKey={(r) => r.trace_id}
            defaultSortKey="created_at"
            defaultSortDir="desc"
            pageSize={15}
            getSortValue={(row, key) => {
              if (key === 'block_height') return row.block_height ?? -1;
              if (key === 'fraud_score') return row.fraud_score ?? 0;
              return (row as Record<string, string | number>)[key];
            }}
            emptyMessage="No transactions to trace yet."
            renderRow={(t) => (
              <tr key={t.trace_id} className="hover:bg-lbg-green-light/30">
                <td className="py-3 px-4 font-mono text-xs">{t.trace_id.slice(0, 8)}…</td>
                <td className="py-3 px-4 text-sm font-medium">{t.type.replace(/_/g, ' ')}</td>
                <td className="py-3 px-4">
                  <Badge variant="info">{t.ledger}</Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={t.status === 'confirmed' ? 'success' : 'warning'}>{t.status}</Badge>
                </td>
                <td className="py-3 px-4 font-mono text-xs">{t.block_height ?? 'pending'}</td>
                <td className="py-3 px-4 text-sm">
                  {t.fraud_score != null ? (
                    <span className={t.fraud_score >= 0.45 ? 'text-red-600 font-bold' : 'text-lbg-gray-600'}>
                      {(t.fraud_score * 100).toFixed(0)}%
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-3 px-4 text-xs text-lbg-gray-400 whitespace-nowrap">{t.created_at}</td>
              </tr>
            )}
          />
        </ContentPanel>
      )}

      {tab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(data?.smart_contracts ?? []).map((sc) => (
            <Card key={sc.name}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-lbg-green-light flex items-center justify-center shrink-0">
                  <FileCode2 className="w-5 h-5 text-lbg-green" />
                </div>
                <div>
                  <p className="font-bold">{sc.name}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="info">{sc.standard}</Badge>
                    <Badge variant="success">{sc.status}</Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-lbg-gray-600 mb-4">{sc.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-lbg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-lbg-gray-400 uppercase">Invocations</p>
                  <p className="font-bold text-lg">{formatNumber(sc.invocations)}</p>
                </div>
                <div className="bg-lbg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-lbg-gray-400 uppercase">Network</p>
                  <p className="font-semibold text-xs mt-1">{sc.network}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-5 h-5 text-lbg-green" />
              <h3 className="font-bold">Block production</h3>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-lbg-gray-500">Avg block time</dt>
                <dd className="font-bold">{perf?.avg_block_time_seconds ?? 0}s</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-lbg-gray-500">Avg tx per block</dt>
                <dd className="font-bold">{perf?.avg_tx_per_block ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-lbg-gray-500">Mempool size</dt>
                <dd className="font-bold">{perf?.mempool_size ?? 0}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Route className="w-5 h-5 text-lbg-green" />
              <h3 className="font-bold">Confirmation latency</h3>
            </div>
            <p className="text-3xl font-bold text-lbg-green">{perf?.avg_confirmation_ms ?? 0} ms</p>
            <p className="text-sm text-lbg-gray-500 mt-2">Average time from transaction submit to block inclusion</p>
            <p className="text-xs text-lbg-gray-400 mt-4 font-mono">Validator: {String(perf?.validator_id ?? '—')}</p>
          </Card>
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-3">
          {(data?.security_alerts ?? []).map((alert, i) => (
            <Card
              key={`${alert.code}-${i}`}
              className={
                alert.severity === 'critical'
                  ? 'border-red-200 bg-red-50/50'
                  : alert.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50/40'
                    : ''
              }
            >
              <div className="flex items-start gap-3">
                {alert.severity === 'critical' || alert.severity === 'warning' ? (
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-lbg-green shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={severityBadge[alert.severity] ?? 'neutral'}>{alert.severity}</Badge>
                    <span className="text-xs font-mono text-lbg-gray-400">{alert.code}</span>
                  </div>
                  <p className="font-bold text-lbg-black">{alert.title}</p>
                  <p className="text-sm text-lbg-gray-600 mt-1">{alert.detail}</p>
                  <p className="text-[10px] text-lbg-gray-400 mt-2">{alert.at}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.generated_at ? (
        <p className="text-[10px] text-lbg-gray-400 mt-4 text-right">
          Last snapshot: {new Date(data.generated_at).toLocaleString('en-GB')}
        </p>
      ) : null}
    </AdminLayout>
  );
}
