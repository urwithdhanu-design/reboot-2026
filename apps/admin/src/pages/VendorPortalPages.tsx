import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi, type VendorReserveView } from '../api';
import { Button, Card, PageHeader, StatCard } from '../components/ui';
import { ArrowUpRight, Landmark, Wallet } from 'lucide-react';

const VENDOR_TOKEN_KEY = 'gcul-vendor-token';
const VENDOR_META_KEY = 'gcul-vendor-meta';

function formatGBP(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

function VendorReservePanel({
  reserve,
  reserveError,
  onRefresh,
}: {
  reserve?: VendorReserveView;
  reserveError?: string;
  onRefresh: () => void;
}) {
  const [amount, setAmount] = useState('5000');
  const [reference, setReference] = useState('premium-capital');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem(VENDOR_TOKEN_KEY);
    if (!token) return;
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setLocalError('Enter a valid amount greater than zero.');
      return;
    }
    setBusy(true);
    setLocalError(null);
    setMessage(null);
    try {
      const res = await adminApi.vendorContributeToClaimsPool(token, parsed, reference || undefined);
      setMessage(
        `Transferred ${formatGBP(parsed)} to the insurer claims pool. Pool balance is now ${formatGBP(res.claims_pool.balance_gbp)}.`,
      );
      onRefresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setBusy(false);
    }
  }

  if (reserveError && !reserve) {
    return (
      <Card>
        <h2 className="font-bold mb-2">Claims reserve funding</h2>
        <p className="text-sm text-red-600">{reserveError}</p>
        <p className="text-xs text-lbg-gray-400 mt-2">Ensure wallet-service is running on port 8089.</p>
      </Card>
    );
  }

  if (!reserve) {
    return (
      <Card>
        <p className="text-sm text-lbg-gray-400">Loading reserve balances…</p>
      </Card>
    );
  }

  const vendorBalance = reserve.vendor_reserve.balance_gbp;
  const poolBalance = reserve.claims_pool.balance_gbp;
  const contributions = reserve.transactions.filter((tx) => tx.type === 'vendor_contribution');

  return (
    <Card>
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="font-bold text-lg">Claims reserve funding</h2>
        <p className="text-sm text-lbg-gray-500">
          Transfer from your vendor reserve to the insurer claims pool. Approved claim payouts debit this shared pool before crediting customer wallets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Your reserve balance"
          value={formatGBP(vendorBalance)}
          change={reserve.vendor_reserve.label}
          icon={Wallet}
          trend="neutral"
        />
        <StatCard
          label="Insurer claims pool"
          value={formatGBP(poolBalance)}
          change={reserve.claims_pool.label}
          icon={Landmark}
          trend="neutral"
        />
        <StatCard
          label="Your contributions"
          value={formatGBP(reserve.contributions_total_gbp)}
          change="Transferred to insurer pool"
          icon={ArrowUpRight}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <h3 className="text-sm font-bold text-lbg-gray-700 mb-3">Contribution history</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-lbg-gray-400 border-b">
                  <th scope="col" className="py-2 pr-3">When</th>
                  <th scope="col" className="py-2 pr-3">Reference</th>
                  <th scope="col" className="py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((tx) => (
                  <tr key={tx.id} className="border-b border-lbg-gray-50">
                    <td className="py-2 pr-3 text-lbg-gray-500">{formatWhen(tx.created_at)}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{tx.reference ?? '—'}</td>
                    <td className="py-2 font-semibold text-lbg-black">{formatGBP(Math.abs(tx.amount))}</td>
                  </tr>
                ))}
                {contributions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-lbg-gray-400">
                      No transfers yet. Fund the insurer pool before claims are settled.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <form className="flex flex-col gap-3 min-w-[260px]" onSubmit={handleContribute}>
          <p className="text-sm font-bold text-lbg-gray-700">Transfer to insurer pool</p>
          <label className="text-sm font-medium text-lbg-gray-600">
            Amount (£)
            <input
              className="mt-1 w-full rounded-lg border border-lbg-gray-200 px-3 py-2"
              type="number"
              min="0.01"
              step="0.01"
              max={vendorBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="text-sm font-medium text-lbg-gray-600">
            Reference
            <input
              className="mt-1 w-full rounded-lg border border-lbg-gray-200 px-3 py-2"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </label>
          <Button type="submit" variant="hero" disabled={busy || vendorBalance <= 0}>
            {busy ? 'Transferring…' : 'Transfer to claims pool'}
          </Button>
          {message ? <p className="text-xs text-lbg-green">{message}</p> : null}
          {localError ? <p className="text-xs text-red-600">{localError}</p> : null}
          <p className="text-xs text-lbg-gray-400">
            Demo reserve starts at £50,000 per vendor. Claims settle from the shared insurer pool only.
          </p>
        </form>
      </div>
    </Card>
  );
}

export function VendorLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('vendor.vitality@example.com');
  const [password, setPassword] = useState('VendorDemo123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.vendorLogin(email, password);
      localStorage.setItem(VENDOR_TOKEN_KEY, res.access_token);
      localStorage.setItem(VENDOR_META_KEY, JSON.stringify(res));
      navigate('/vendor/portal');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lbg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-widest text-lbg-green mb-2">
          Reboot 2026 Insurance platform
        </p>
        <h1 className="text-2xl font-bold text-lbg-black mb-1">Vendor portal</h1>
        <p className="text-sm text-lbg-gray-400 mb-6">
          Sign in to fund the insurer claims reserve from your vendor balance.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-lbg-gray-600">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-lbg-gray-200 px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-lbg-gray-600">
            Password
            <input
              className="mt-1 w-full rounded-lg border border-lbg-gray-200 px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="text-xs text-lbg-gray-400 mt-4">
          Demo logins: Vitality <span className="font-mono">vendor.vitality@example.com</span> · HomeShield{' '}
          <span className="font-mono">vendor.homeshield@example.com</span> (password{' '}
          <span className="font-mono">VendorDemo123!</span>)
        </p>
        <p className="text-xs text-lbg-gray-400 mt-2">
          Platform admin? <Link className="text-lbg-green font-semibold" to="/login">Admin login</Link>
        </p>
      </Card>
    </div>
  );
}

export function VendorPortalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [reserve, setReserve] = useState<VendorReserveView | undefined>();
  const [reserveError, setReserveError] = useState<string | undefined>();

  const refreshReserve = () => {
    const token = localStorage.getItem(VENDOR_TOKEN_KEY);
    if (!token) return;
    return adminApi.vendorReserve(token).then((res) => {
      setReserve(res);
      setReserveError(undefined);
    });
  };

  useEffect(() => {
    const token = localStorage.getItem(VENDOR_TOKEN_KEY);
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    const metaRaw = localStorage.getItem(VENDOR_META_KEY);
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw) as { vendor?: { name?: string; code?: string } };
        setVendorName(meta.vendor?.name ?? 'Vendor');
        setVendorCode(meta.vendor?.code ?? '');
      } catch {
        setVendorName('Vendor');
      }
    }
    adminApi
      .vendorDashboard(token)
      .then((res) => {
        setVendorName(res.vendor.name);
        setVendorCode(res.vendor.code);
        setReserve(res.reserve);
        setReserveError(res.reserve_error);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load vendor portal');
        localStorage.removeItem(VENDOR_TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  function logout() {
    localStorage.removeItem(VENDOR_TOKEN_KEY);
    localStorage.removeItem(VENDOR_META_KEY);
    navigate('/vendor/login');
  }

  if (loading) {
    return <div className="p-8 text-lbg-gray-400">Loading vendor portal…</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => navigate('/vendor/login')}>Back to login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lbg-gray-50">
      <header className="bg-lbg-sidebar text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/60">Vendor portal</p>
          <h1 className="font-bold text-lg">{vendorName}</h1>
        </div>
        <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={logout}>
          Log out
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <PageHeader
          title="Claims reserve funding"
          subtitle={vendorCode ? `Partner code ${vendorCode} · transfer to the shared insurer pool` : 'Transfer to the shared insurer pool'}
        />

        <VendorReservePanel
          reserve={reserve}
          reserveError={reserveError}
          onRefresh={() => void refreshReserve()}
        />
      </main>
    </div>
  );
}
