import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../api';
import { Badge, Button, Card, PageHeader, StatCard } from '../components/ui';
import { Building2, ClipboardList, Package, Users } from 'lucide-react';

const VENDOR_TOKEN_KEY = 'gcul-vendor-token';
const VENDOR_META_KEY = 'gcul-vendor-meta';

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
          Sign in to view customers, products, and claims for your cover.
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
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.vendorDashboard>> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(VENDOR_TOKEN_KEY);
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    let alive = true;
    adminApi
      .vendorDashboard(token)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        localStorage.removeItem(VENDOR_TOKEN_KEY);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [navigate]);

  function logout() {
    localStorage.removeItem(VENDOR_TOKEN_KEY);
    localStorage.removeItem(VENDOR_META_KEY);
    navigate('/vendor/login');
  }

  if (loading) {
    return <div className="p-8 text-lbg-gray-400">Loading vendor portal…</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <p className="text-red-600 mb-4">{error ?? 'Session expired'}</p>
        <Button onClick={() => navigate('/vendor/login')}>Back to login</Button>
      </div>
    );
  }

  const { vendor, products, customers, claims, stats } = data;

  return (
    <div className="min-h-screen bg-lbg-gray-50">
      <header className="bg-lbg-sidebar text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/60">Vendor portal</p>
          <h1 className="font-bold text-lg">{vendor.name}</h1>
        </div>
        <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={logout}>
          Log out
        </Button>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <PageHeader
          title={`${vendor.name} overview`}
          subtitle={`Code ${vendor.code} · ${vendor.categories} · status ${vendor.status}`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Products" value={String(stats.products ?? 0)} icon={Package} />
          <StatCard label="Customers" value={String(stats.customers ?? 0)} icon={Users} />
          <StatCard label="Open claims" value={String(stats.open_claims ?? 0)} icon={ClipboardList} />
          <StatCard label="Status" value={String(stats.status ?? '—')} icon={Building2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <h2 className="font-bold mb-3">Linked products</h2>
            <ul className="space-y-2">
              {products.map((p) => (
                <li key={String(p.id)} className="flex justify-between text-sm border-b border-lbg-gray-50 py-2">
                  <span className="font-medium">{String(p.title)}</span>
                  <Badge variant="info">{String(p.category)}</Badge>
                </li>
              ))}
              {products.length === 0 ? <p className="text-sm text-lbg-gray-400">No linked products yet.</p> : null}
            </ul>
          </Card>
          <Card>
            <h2 className="font-bold mb-3">Claims</h2>
            <ul className="space-y-2">
              {claims.map((c) => (
                <li key={String(c.id)} className="text-sm border-b border-lbg-gray-50 py-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{String(c.customer)}</span>
                    <Badge variant={c.status === 'open' ? 'warning' : 'success'}>{String(c.status)}</Badge>
                  </div>
                  <p className="text-lbg-gray-400 text-xs mt-1">
                    {String(c.type)} · £{Number(c.amount).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card>
          <h2 className="font-bold mb-3">Customers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-lbg-gray-400 border-b">
                  <th scope="col" className="py-2">Name</th>
                  <th scope="col" className="py-2">Email</th>
                  <th scope="col" className="py-2">Product</th>
                  <th scope="col" className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={String(c.id)} className="border-b border-lbg-gray-50">
                    <td className="py-2 font-medium">{String(c.name)}</td>
                    <td className="py-2">{String(c.email)}</td>
                    <td className="py-2">{String(c.product)}</td>
                    <td className="py-2">
                      <Badge variant={c.status === 'active' ? 'success' : 'neutral'}>{String(c.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
