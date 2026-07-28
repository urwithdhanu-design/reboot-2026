import { Link, useSearchParams } from 'react-router-dom';
import {
  Users, FileText, ShieldCheck, ClipboardList, PoundSterling, TrendingUp, Coins, Link2,
  Zap, Activity, Layers, LayoutDashboard, BarChart3, GitBranch, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, StatCard, Badge, PageHeader, Button, AlertBanner } from '../components/ui';
import { useDashboardData, type DashboardActivity } from '../hooks/useDashboardData';
import { formatGBP, formatNumber, formatWhen } from '../utils/format';

const PIE_COLORS = ['#00864f', '#016846', '#4caf82', '#b8e0cc', '#6b9e82', '#2d6a4f'];
const TOKEN_COLORS = ['#00864f', '#016846', '#4caf82'];

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'financial', label: 'Financial', icon: BarChart3 },
  { id: 'tokenization', label: 'Tokenization', icon: Coins },
  { id: 'operations', label: 'Operations', icon: GitBranch },
] as const;

type TabId = (typeof TABS)[number]['id'];

function activityBadge(kind: DashboardActivity['kind']) {
  if (kind === 'kyc') return 'info' as const;
  if (kind === 'claim') return 'warning' as const;
  if (kind === 'mint') return 'success' as const;
  return 'neutral' as const;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[220px] text-sm text-lbg-gray-400 text-center px-6">
      {message}
    </div>
  );
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const tab: TabId = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'overview';
  const { loading, error, refreshedAt, metrics } = useDashboardData();

  const selectTab = (id: TabId) => setSearchParams({ tab: id });

  const networkLabel = metrics?.blockchain?.ledger_type === 'canton'
    ? (metrics.blockchain.live ? 'Canton live' : 'Canton sandbox')
    : (metrics?.blockchain?.network_name ?? 'Blockchain');

  return (
    <AdminLayout>
      <PageHeader
        icon={LayoutDashboard}
        title="Operations dashboard"
        subtitle="Live metrics from customers, policies, Canton minting, claims, and payments"
        metrics={[
          { label: 'Customers', value: metrics ? formatNumber(metrics.customers.total) : '—' },
          { label: 'Minted policies', value: metrics ? formatNumber(metrics.policies.minted) : '—', tone: 'success' },
          { label: 'Open claims', value: metrics ? String(metrics.claims.open) : '—', tone: 'warning' },
          { label: 'Premium (MTD)', value: metrics ? formatGBP(metrics.payments.mtdPremium) : '—' },
        ]}
        actions={
          <Badge variant={metrics?.blockchain?.live ? 'success' : 'neutral'}>
            {refreshedAt ? `Updated ${formatWhen(refreshedAt.toISOString())}` : 'Loading…'}
          </Badge>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-lbg-gray-100 shadow-sm overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => selectTab(id)}
            data-tab={id}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex-1 sm:flex-none justify-center ${
              tab === id ? 'bg-lbg-green text-white shadow-sm' : 'text-lbg-gray-600 hover:bg-lbg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading && !metrics ? (
        <Card className="p-12 text-center text-sm text-lbg-gray-500">Loading dashboard data…</Card>
      ) : metrics ? (
        <>
          {tab === 'overview' && <OverviewTab metrics={metrics} networkLabel={networkLabel} />}
          {tab === 'financial' && <FinancialTab metrics={metrics} />}
          {tab === 'tokenization' && <TokenizationTab metrics={metrics} networkLabel={networkLabel} />}
          {tab === 'operations' && <OperationsTab metrics={metrics} />}
        </>
      ) : null}
    </AdminLayout>
  );
}

function OverviewTab({ metrics, networkLabel }: { metrics: NonNullable<ReturnType<typeof useDashboardData>['metrics']>; networkLabel: string }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total customers" value={formatNumber(metrics.customers.total)} change={`${metrics.customers.kycVerified} KYC verified`} icon={Users} trend="neutral" />
        <StatCard label="Issued policies" value={formatNumber(metrics.policies.issued)} change={`${metrics.policies.minted} minted on ledger`} icon={FileText} trend="up" />
        <StatCard label="KYC pending review" value={String(metrics.customers.pendingReview)} change={`${metrics.customers.kycInProgress} in progress`} icon={ShieldCheck} trend="neutral" />
        <StatCard label="Open claims" value={String(metrics.claims.open)} change={`${metrics.claims.settled} settled`} icon={ClipboardList} trend="neutral" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Premium collected" value={formatGBP(metrics.payments.totalPremium)} change={`${metrics.payments.paidCount} payments`} icon={PoundSterling} trend="up" />
        <StatCard label="Tokenization rate" value={`${metrics.policies.tokenizationRate}%`} change={`${formatNumber(metrics.policies.minted)} / ${formatNumber(metrics.policies.issued)} issued`} icon={Layers} trend="up" />
        <StatCard label="Claims paid out" value={formatGBP(metrics.claims.totalPaidOut)} change={`${metrics.claims.settled} settled claims`} icon={Link2} trend="neutral" />
        <StatCard label="Quotes in system" value={formatNumber(metrics.policies.totalQuotes)} change="From policy-service" icon={Zap} trend="neutral" />
      </div>

      <Card className="mb-6 border-lbg-green/20 bg-lbg-green-light/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-bold text-lbg-black">{networkLabel}</p>
            <p className="text-sm text-lbg-gray-400">
              {metrics.blockchain?.mode ?? 'offline'} · {metrics.tokenization?.policy_nfts ?? 0} policy certificates minted
              {metrics.observability ? ` · ${metrics.observability.dashboard.transactions_24h} chain tx (24h)` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/tokenization"><Button size="sm" variant="outline">Tokenization</Button></Link>
            <Link to="/blockchain"><Button size="sm" variant="outline">Ledger</Button></Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link to="/kyc">
          <Card className="hover:border-lbg-green/30 transition-colors cursor-pointer h-full">
            <ShieldCheck className="w-8 h-8 text-lbg-green mb-3" />
            <p className="font-bold">KYC review queue</p>
            <p className="text-2xl font-bold text-lbg-green mt-1">{metrics.customers.pendingReview}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">Applications awaiting review</p>
          </Card>
        </Link>
        <Link to="/claims">
          <Card className="hover:border-lbg-green/30 transition-colors cursor-pointer h-full">
            <ClipboardList className="w-8 h-8 text-amber-600 mb-3" />
            <p className="font-bold">Claims queue</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.claims.open}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">Open claims requiring action</p>
          </Card>
        </Link>
        <Link to="/tokenization">
          <Card className="hover:border-lbg-green/30 transition-colors cursor-pointer h-full">
            <Coins className="w-8 h-8 text-lbg-green mb-3" />
            <p className="font-bold">Mint queue</p>
            <p className="text-2xl font-bold text-lbg-green mt-1">{metrics.tokenization?.pending_mints ?? 0}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">
              {metrics.tokenization?.failed_mints ? `${metrics.tokenization.failed_mints} failed · ` : ''}
              pending Canton mints
            </p>
          </Card>
        </Link>
        <Link to="/policies">
          <Card className="hover:border-lbg-green/30 transition-colors cursor-pointer h-full">
            <FileText className="w-8 h-8 text-purple-600 mb-3" />
            <p className="font-bold">Policy registry</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.policies.issued}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">{metrics.policies.active} active in system</p>
          </Card>
        </Link>
      </div>
    </>
  );
}

function FinancialTab({ metrics }: { metrics: NonNullable<ReturnType<typeof useDashboardData>['metrics']> }) {
  const premiumData = metrics.charts.premiumsByMonth.length > 0
    ? metrics.charts.premiumsByMonth
    : [{ month: 'Now', value: metrics.payments.totalPremium }];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Premium (MTD)" value={formatGBP(metrics.payments.mtdPremium)} change={`${metrics.payments.paidCount} paid records`} icon={PoundSterling} trend="up" />
        <StatCard label="Claim payouts" value={formatGBP(metrics.claims.totalPaidOut)} change={`${metrics.claims.settled} settled`} icon={TrendingUp} trend="neutral" />
        <StatCard label="Total claimed" value={formatGBP(metrics.claims.totalClaimed)} change={`${metrics.claims.total} claims filed`} icon={Coins} trend="neutral" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2">
          <h3 className="font-bold text-lbg-black mb-4">Premium payments</h3>
          {premiumData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={premiumData}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00864f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00864f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8a9290" />
                <YAxis tick={{ fontSize: 12 }} stroke="#8a9290" tickFormatter={(v) => `£${Number(v).toLocaleString()}`} />
                <Tooltip formatter={(v) => formatGBP(Number(v))} />
                <Area type="monotone" dataKey="value" stroke="#00864f" strokeWidth={2} fill="url(#greenGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No premium payments recorded yet." />
          )}
        </Card>

        <Card>
          <h3 className="font-bold text-lbg-black mb-4">Policies by category</h3>
          {metrics.charts.policiesByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={metrics.charts.policiesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {metrics.charts.policiesByCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatNumber(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {metrics.charts.policiesByCategory.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-xs text-lbg-gray-600">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                    {c.name} ({c.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart message="No issued policies with categories yet." />
          )}
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-bold text-lbg-black mb-4">Recent payments</h3>
        {metrics.recentPayments.length === 0 ? (
          <p className="text-sm text-lbg-gray-400">No paid premiums in the ledger.</p>
        ) : (
          <div className="space-y-2">
            {metrics.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-lbg-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold">{p.policy_ref || p.quote_id}</p>
                  <p className="text-xs text-lbg-gray-400">{p.customer_email} · {formatWhen(p.created_at)}</p>
                </div>
                <p className="font-bold text-lbg-green">{formatGBP(Number(p.amount))}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-bold text-lbg-black mb-4">Claims: parametric vs manual</h3>
        {metrics.charts.claimsByMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={metrics.charts.claimsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8a9290" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8a9290" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="automated" name="Parametric" fill="#00864f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="manual" name="Manual" fill="#b8e0cc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No claims submitted yet." />
        )}
      </Card>
    </>
  );
}

function TokenizationTab({ metrics, networkLabel }: { metrics: NonNullable<ReturnType<typeof useDashboardData>['metrics']>; networkLabel: string }) {
  const bc = metrics.blockchain;
  const stdData = metrics.standards.map((s) => ({ name: s.standard, value: s.circulating }));

  return (
    <>
      <Card className="mb-6 border-lbg-green/20 overflow-hidden">
        <div className="bg-gradient-to-r from-lbg-green to-lbg-sidebar px-5 py-4 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                <h3 className="font-bold text-lg">{networkLabel}</h3>
                {bc?.live ? <Badge variant="success">Live</Badge> : <Badge variant="warning">Offline</Badge>}
              </div>
              <p className="text-sm text-white/80 mt-1">
                {bc?.network_name ?? 'Not configured'} · mode {bc?.mode ?? '—'} · template {bc?.contract_address ? 'configured' : 'not set'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/tokenization" className="text-sm bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg font-semibold">Manage →</Link>
            </div>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-b from-lbg-green-light/30 to-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
            <StatCard label="Tokenization rate" value={`${metrics.policies.tokenizationRate}%`} change={`${metrics.policies.minted} minted`} icon={Layers} trend="up" />
            <StatCard label="Policy NFTs" value={formatNumber(metrics.tokenization?.policy_nfts ?? 0)} change={metrics.standards[0]?.standard ?? 'Daml/Canton'} icon={Coins} trend="up" />
            <StatCard label="Issued total" value={formatNumber(metrics.tokenization?.total_issued ?? 0)} change="All policies" icon={FileText} trend="neutral" />
            <StatCard label="Pending mints" value={String(metrics.tokenization?.pending_mints ?? 0)} change={`${metrics.tokenization?.pending_wallet ?? 0} awaiting wallet`} icon={Zap} trend="neutral" />
            <StatCard label="Failed mints" value={String(metrics.tokenization?.failed_mints ?? 0)} change="Needs retry" icon={AlertCircle} trend="down" />
            <StatCard label="Chain tx (24h)" value={formatNumber(metrics.observability?.dashboard.transactions_24h ?? 0)} change="GCUL PoA chain" icon={Activity} trend="neutral" />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Policy tokenization coverage</p>
              <p className="text-sm font-bold text-lbg-green">{metrics.policies.tokenizationRate}%</p>
            </div>
            <div className="h-2.5 bg-lbg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-lbg-green to-lbg-green-dark rounded-full transition-all" style={{ width: `${Math.min(100, metrics.policies.tokenizationRate)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {metrics.standards.length > 0 ? metrics.standards.map((tc) => (
              <div key={tc.standard} className="bg-white rounded-xl border border-lbg-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="info">{tc.standard}</Badge>
                  <span className="text-xs font-mono text-lbg-gray-400">{tc.symbol}</span>
                </div>
                <p className="font-semibold text-sm">{tc.name}</p>
                <p className="text-xs text-lbg-gray-400 mt-1 line-clamp-2">{tc.description}</p>
                <div className="flex justify-between mt-3 text-xs">
                  <div><p className="text-lbg-gray-400">Supply</p><p className="font-bold">{formatNumber(tc.total_supply)}</p></div>
                  <div className="text-right"><p className="text-lbg-gray-400">Circulating</p><p className="font-bold text-lbg-green">{formatNumber(tc.circulating)}</p></div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-lbg-gray-400 col-span-3">No token standards configured.</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2">
          <h3 className="font-bold mb-4">Policy mints over time</h3>
          {metrics.charts.mintsByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={metrics.charts.mintsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="minted" name="Minted" fill="#00864f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No minted policy certificates yet." />
          )}
        </Card>
        <Card>
          <h3 className="font-bold mb-4">Tokens by standard</h3>
          {stdData.length > 0 && stdData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stdData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>
                  {stdData.map((_, i) => (
                    <Cell key={i} fill={TOKEN_COLORS[i % TOKEN_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatNumber(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Mint policies to populate this chart." />
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Minted policy registry (recent)</h3>
          <Link to="/tokenization" className="text-xs text-lbg-green font-semibold hover:underline">View all →</Link>
        </div>
        {metrics.registry.length === 0 ? (
          <p className="text-sm text-lbg-gray-400">No minted policies in the registry.</p>
        ) : (
          <div className="space-y-2">
            {metrics.registry.slice(0, 8).map((row) => (
              <div key={row.id} className="flex items-center justify-between py-2 border-b border-lbg-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold">{row.policy_number}</p>
                  <p className="text-xs text-lbg-gray-400">{row.owner} · {row.standard}</p>
                </div>
                <div className="text-right">
                  <Badge variant="success">{row.status}</Badge>
                  {row.token_id ? <p className="text-[10px] font-mono text-lbg-gray-400 mt-1">{row.token_id}</p> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function OperationsTab({ metrics }: { metrics: NonNullable<ReturnType<typeof useDashboardData>['metrics']> }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open claims" value={String(metrics.claims.open)} change={`${metrics.claims.rejected} rejected`} icon={ClipboardList} trend="neutral" />
        <StatCard label="KYC pending" value={String(metrics.customers.pendingReview)} change={`${metrics.customers.kycNotStarted} not started`} icon={ShieldCheck} trend="neutral" />
        <StatCard label="Mint queue" value={String(metrics.tokenization?.pending_mints ?? 0)} change={`${metrics.tokenization?.failed_mints ?? 0} failed`} icon={Coins} trend="neutral" />
        <StatCard label="Chain height" value={formatNumber(metrics.observability?.dashboard.block_height ?? metrics.observability?.network.block_height ?? 0)} change={metrics.observability?.dashboard.chain_valid ? 'Chain valid' : 'Unverified'} icon={GitBranch} trend="neutral" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Recent platform activity</h3>
          </div>
          {metrics.recentActivity.length === 0 ? (
            <p className="text-sm text-lbg-gray-400">No recent KYC, claims, mints, or payments.</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentActivity.map((run) => (
                <div key={run.id} className="flex items-center gap-3 p-3 rounded-lg bg-lbg-gray-50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    run.kind === 'claim' ? 'bg-amber-500' :
                    run.kind === 'mint' ? 'bg-lbg-green' :
                    run.kind === 'kyc' ? 'bg-blue-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{run.title}</p>
                    <p className="text-xs text-lbg-gray-400 truncate">{run.subtitle}</p>
                    {run.at ? <p className="text-[10px] text-lbg-gray-400">{formatWhen(run.at)}</p> : null}
                  </div>
                  <Badge variant={activityBadge(run.kind)}>{run.status.replace(/_/g, ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-bold mb-4">Operational queues</h3>
          <div className="space-y-3">
            {[
              { label: 'KYC review', count: metrics.customers.pendingReview, to: '/kyc', color: 'text-lbg-green' },
              { label: 'Claims processing', count: metrics.claims.open, to: '/claims', color: 'text-amber-600' },
              { label: 'Mint queue', count: metrics.tokenization?.pending_mints ?? 0, to: '/tokenization', color: 'text-lbg-green' },
              { label: 'Failed mints', count: metrics.tokenization?.failed_mints ?? 0, to: '/tokenization', color: 'text-red-600' },
            ].map(({ label, count, to, color }) => (
              <Link key={label} to={to} className="flex items-center justify-between p-4 rounded-xl border border-lbg-gray-100 hover:border-lbg-green/30 transition-colors">
                <span className="font-semibold text-sm">{label}</span>
                <span className={`text-2xl font-bold ${color}`}>{count}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold mb-4">Recent claims</h3>
        {metrics.recentClaims.length === 0 ? (
          <p className="text-sm text-lbg-gray-400">No claims filed yet.</p>
        ) : (
          <div className="space-y-2">
            {metrics.recentClaims.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-lbg-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold font-mono">{c.id}</p>
                  <p className="text-xs text-lbg-gray-400">{c.policy_ref} · {c.customer_name}</p>
                </div>
                <div className="text-right">
                  <Badge variant={c.status === 'settled' || c.status === 'paid_out' ? 'success' : c.status === 'rejected' ? 'error' : 'warning'}>
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                  <p className="text-xs font-bold mt-1">{formatGBP(Number(c.amount_claimed))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
