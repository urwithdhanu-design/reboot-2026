import { Link, useSearchParams } from 'react-router-dom';
import {
  Users, FileText, ShieldCheck, ClipboardList, PoundSterling, TrendingUp, Zap, Coins, Link2,
  Flame, Snowflake, Activity, Layers, LayoutDashboard, BarChart3, GitBranch,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, StatCard, Badge, PageHeader, Button } from '../components/ui';
import {
  dashboardStats, workflowRuns, blockchainStats, tokenTypeConfigs, formatGBP, formatNumber, chartData,
} from '../data/adminMockData';

const PIE_COLORS = ['#00864f', '#016846', '#4caf82', '#b8e0cc', '#6b9e82', '#2d6a4f'];
const TOKEN_COLORS = ['#00864f', '#016846', '#4caf82'];

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'financial', label: 'Financial', icon: BarChart3 },
  { id: 'tokenization', label: 'Tokenization', icon: Coins },
  { id: 'operations', label: 'Operations', icon: GitBranch },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const tab: TabId = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'overview';
  const stats = dashboardStats;

  const selectTab = (id: TabId) => setSearchParams({ tab: id });

  return (
    <AdminLayout>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time overview of Reboot 2026 enterprise operations"
        actions={<Badge variant="success">Live · Updated just now</Badge>}
      />

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

      {tab === 'overview' && <OverviewTab stats={stats} />}
      {tab === 'financial' && <FinancialTab stats={stats} />}
      {tab === 'tokenization' && <TokenizationTab stats={stats} />}
      {tab === 'operations' && <OperationsTab stats={stats} />}
    </AdminLayout>
  );
}

function OverviewTab({ stats }: { stats: typeof dashboardStats }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Customers" value={formatNumber(stats.totalCustomers)} change="+4.2% this month" icon={Users} trend="up" />
        <StatCard label="Active Policies" value={formatNumber(stats.activePolicies)} change="+2.8% this month" icon={FileText} trend="up" />
        <StatCard label="Pending KYC" value={String(stats.pendingKYC)} change="4 awaiting review" icon={ShieldCheck} trend="neutral" />
        <StatCard label="Open Claims" value={String(stats.openClaims)} change="5 manual queue" icon={ClipboardList} trend="neutral" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Monthly Premium" value={formatGBP(stats.monthlyPremium)} change="+6.1% vs last month" icon={PoundSterling} trend="up" />
        <StatCard label="Tokenization Rate" value={`${stats.tokenizationRate}%`} change={`${formatNumber(stats.tokenizedPolicies)} on-chain`} icon={Layers} trend="up" />
        <StatCard label="On-Chain Claims" value={formatNumber(stats.onChainClaims)} change="ERC-1155 vouchers" icon={Link2} trend="up" />
        <StatCard label="Automation Rate" value={`${stats.automationRate}%`} change="Workflow efficiency" icon={Zap} trend="up" />
      </div>

      <Card className="mb-6 border-lbg-green/20 bg-lbg-green-light/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-bold text-lbg-black">GCUL L2</p>
            <p className="text-sm text-lbg-gray-400">
              Block #{formatNumber(blockchainStats.blockHeight)} · {blockchainStats.networkHealth}% uptime · {blockchainStats.dailyOnChainTx.toLocaleString()} tx today
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
            <p className="font-bold">KYC Review Queue</p>
            <p className="text-2xl font-bold text-lbg-green mt-1">{stats.pendingKYC}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">Applications pending review</p>
          </Card>
        </Link>
        <Link to="/claims">
          <Card className="hover:border-lbg-green/30 transition-colors cursor-pointer h-full">
            <ClipboardList className="w-8 h-8 text-amber-600 mb-3" />
            <p className="font-bold">Claims Queue</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.openClaims}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">Open claims requiring action</p>
          </Card>
        </Link>
        <Link to="/tokenization">
          <Card className="hover:border-lbg-green/30 transition-colors cursor-pointer h-full">
            <Coins className="w-8 h-8 text-lbg-green mb-3" />
            <p className="font-bold">Tokenization</p>
            <p className="text-2xl font-bold text-lbg-green mt-1">{blockchainStats.pendingMints}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">Pending policy token mints</p>
          </Card>
        </Link>
        <Link to="/workflows">
          <Card className="hover:border-lbg-green/30 transition-colors cursor-pointer h-full">
            <GitBranch className="w-8 h-8 text-purple-600 mb-3" />
            <p className="font-bold">Active Workflows</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{workflowRuns.filter((r) => r.status !== 'completed').length}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">Runs in progress</p>
          </Card>
        </Link>
      </div>
    </>
  );
}

function FinancialTab({ stats }: { stats: typeof dashboardStats }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Monthly Premium" value={formatGBP(stats.monthlyPremium)} change="+6.1% vs last month" icon={PoundSterling} trend="up" />
        <StatCard label="Claim Payouts" value={formatGBP(stats.claimPayouts)} change="-3.2% vs last month" icon={TrendingUp} trend="down" />
        <StatCard label="Wallet Volume" value={formatGBP(stats.walletVolume)} change="+12% this quarter" icon={Coins} trend="up" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2">
          <h3 className="font-bold text-lbg-black mb-4">Premium Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData.premiums}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00864f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00864f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8a9290" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8a9290" tickFormatter={(v) => `£${(Number(v) / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatGBP(Number(v))} />
              <Area type="monotone" dataKey="value" stroke="#00864f" strokeWidth={2} fill="url(#greenGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-bold text-lbg-black mb-4">Policies by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData.policiesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {chartData.policiesByCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatNumber(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {chartData.policiesByCategory.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-lbg-gray-600">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                {c.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-lbg-black mb-4">Claims: Automated vs Manual</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData.claims}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8a9290" />
            <YAxis tick={{ fontSize: 12 }} stroke="#8a9290" />
            <Tooltip />
            <Legend />
            <Bar dataKey="automated" name="Automated (on-chain)" fill="#00864f" radius={[4, 4, 0, 0]} />
            <Bar dataKey="manual" name="Manual review" fill="#b8e0cc" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}

function TokenizationTab({ stats }: { stats: typeof dashboardStats }) {
  return (
    <>
      <Card className="mb-6 border-lbg-green/20 overflow-hidden">
        <div className="bg-gradient-to-r from-lbg-green to-lbg-sidebar px-5 py-4 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                <h3 className="font-bold text-lg">Blockchain Network</h3>
              </div>
              <p className="text-sm text-white/80 mt-1">
                {blockchainStats.networkName} · Chain {blockchainStats.chainId} · Block #{formatNumber(blockchainStats.blockHeight)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/tokenization" className="text-sm bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg font-semibold">Manage →</Link>
              <Link to="/contracts" className="text-sm bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg font-semibold">Contracts →</Link>
            </div>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-b from-lbg-green-light/30 to-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
            <StatCard label="Tokenization Rate" value={`${stats.tokenizationRate}%`} change={`${formatNumber(stats.tokenizedPolicies)} policies`} icon={Layers} trend="up" />
            <StatCard label="Policy NFTs" value={formatNumber(blockchainStats.policyNFTs)} change="ERC-721" icon={Coins} trend="up" />
            <StatCard label="Premium Tokens" value={formatNumber(stats.premiumTokensCirculating)} change="LBGP" icon={Coins} trend="up" />
            <StatCard label="Claim Vouchers" value={formatNumber(stats.claimVouchersActive)} change="ERC-1155" icon={Link2} trend="neutral" />
            <StatCard label="Minted MTD" value={formatNumber(stats.tokensMintedMTD)} change={`${stats.tokensBurnedMTD} burned`} icon={Activity} trend="up" />
            <StatCard label="Pending Mints" value={String(blockchainStats.pendingMints)} change={blockchainStats.avgConfirmationTime} icon={Zap} trend="neutral" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'On-Chain Claims', value: formatNumber(stats.onChainClaims), icon: Link2 },
              { label: 'Daily Tx', value: formatNumber(blockchainStats.dailyOnChainTx), icon: Activity },
              { label: 'Gas Today', value: blockchainStats.gasSpentToday, icon: Flame },
              { label: 'Frozen Tokens', value: String(stats.frozenTokens), icon: Snowflake },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 bg-white rounded-xl border border-lbg-gray-100 px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-lbg-green-light flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-lbg-green" />
                </div>
                <div>
                  <p className="text-[10px] text-lbg-gray-400 uppercase font-medium">{label}</p>
                  <p className="text-sm font-bold">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Policy Tokenization Coverage</p>
              <p className="text-sm font-bold text-lbg-green">{stats.tokenizationRate}%</p>
            </div>
            <div className="h-2.5 bg-lbg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-lbg-green to-lbg-green-dark rounded-full" style={{ width: `${stats.tokenizationRate}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {tokenTypeConfigs.map((tc) => (
              <div key={tc.standard} className="bg-white rounded-xl border border-lbg-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="info">{tc.standard}</Badge>
                  <span className="text-xs font-mono text-lbg-gray-400">{tc.symbol}</span>
                </div>
                <p className="font-semibold text-sm">{tc.name}</p>
                <div className="flex justify-between mt-3 text-xs">
                  <div><p className="text-lbg-gray-400">Supply</p><p className="font-bold">{formatNumber(tc.totalSupply)}</p></div>
                  <div className="text-right"><p className="text-lbg-gray-400">Circulating</p><p className="font-bold text-lbg-green">{formatNumber(tc.circulating)}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2">
          <h3 className="font-bold mb-4">Token Minting vs Burn</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData.tokenization}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip /><Legend />
              <Bar dataKey="minted" name="Minted" fill="#00864f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="burned" name="Burned" fill="#d9dddc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-bold mb-4">Tokens by Standard</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={chartData.tokensByStandard} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>
                {chartData.tokensByStandard.map((_, i) => (
                  <Cell key={i} fill={TOKEN_COLORS[i % TOKEN_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatNumber(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">On-Chain Activity</h3>
          <Link to="/blockchain" className="text-xs text-lbg-green font-semibold hover:underline">View ledger →</Link>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData.onChainActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip /><Legend />
            <Area type="monotone" dataKey="mints" name="Policy Mints" stroke="#00864f" fill="#00864f33" strokeWidth={2} />
            <Area type="monotone" dataKey="payouts" name="Claim Payouts" stroke="#016846" fill="#01684622" strokeWidth={2} />
            <Area type="monotone" dataKey="transfers" name="Transfers" stroke="#4caf82" fill="none" strokeWidth={2} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}

function OperationsTab({ stats }: { stats: typeof dashboardStats }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Claims" value={String(stats.openClaims)} change="5 manual queue" icon={ClipboardList} trend="neutral" />
        <StatCard label="Pending KYC" value={String(stats.pendingKYC)} change="Compliance review" icon={ShieldCheck} trend="neutral" />
        <StatCard label="Automation Rate" value={`${stats.automationRate}%`} change="Workflow efficiency" icon={Zap} trend="up" />
        <StatCard label="Active Workflow Runs" value={String(workflowRuns.filter((r) => r.status !== 'completed').length)} change="In progress" icon={GitBranch} trend="neutral" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Active Workflow Runs</h3>
            <Link to="/workflows" className="text-xs text-lbg-green font-semibold hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {workflowRuns.map((run) => (
              <div key={run.id} className="flex items-center gap-3 p-3 rounded-lg bg-lbg-gray-50">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                  run.status === 'awaiting_review' ? 'bg-amber-500' :
                  run.status === 'completed' ? 'bg-lbg-green' : 'bg-red-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{run.workflowName}</p>
                  <p className="text-xs text-lbg-gray-400">{run.customerName} · {run.currentStep}</p>
                </div>
                <Badge variant={run.type === 'automated' ? 'success' : run.type === 'manual' ? 'warning' : 'purple'}>
                  {run.type}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-4">Operational Queues</h3>
          <div className="space-y-3">
            {[
              { label: 'KYC Review', count: stats.pendingKYC, to: '/kyc', color: 'text-lbg-green' },
              { label: 'Claims Processing', count: stats.openClaims, to: '/claims', color: 'text-amber-600' },
              { label: 'Token Mint Queue', count: blockchainStats.pendingMints, to: '/tokenization', color: 'text-lbg-green' },
              { label: 'Manual Workflows', count: workflowRuns.filter((r) => r.type === 'manual' && r.status === 'awaiting_review').length, to: '/workflows', color: 'text-purple-600' },
            ].map(({ label, count, to, color }) => (
              <Link key={label} to={to} className="flex items-center justify-between p-4 rounded-xl border border-lbg-gray-100 hover:border-lbg-green/30 transition-colors">
                <span className="font-semibold text-sm">{label}</span>
                <span className={`text-2xl font-bold ${color}`}>{count}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
