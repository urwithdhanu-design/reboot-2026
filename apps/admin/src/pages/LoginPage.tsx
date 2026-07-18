import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@reboot2026.local');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-lbg-green to-lbg-sidebar p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                <path d="M12 2C8.5 2 6 4.5 6 8c0 2 1 3.5 2.5 4.5L12 22l3.5-9.5C17 11.5 18 10 18 8c0-3.5-2.5-6-6-6zm0 3c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold">Reboot 2026 Insurance</p>
              <p className="text-sm text-white/70">Platform Admin Portal</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Manage products, vendors, KYC, and on-chain operations
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-md">
            Onboard third-party insurers, publish vendor UIs, review customers and claims, and wire GCUL microservices from one admin console.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { v: '12.8K', l: 'Customers' },
            { v: '34.3K', l: 'Policies' },
            { v: '78%', l: 'Automated' },
          ].map(({ v, l }) => (
            <div key={l} className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold">{v}</p>
              <p className="text-xs text-white/70 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
          <div className="lg:hidden mb-8">
            <p className="text-xl font-bold text-lbg-green">Reboot 2026 Admin</p>
          </div>
          <h2 className="text-2xl font-bold text-lbg-black">Sign in</h2>
          <p className="text-sm text-lbg-gray-400">Access the platform operations dashboard</p>

          <div>
            <label className="text-sm font-medium text-lbg-gray-600 block mb-1.5">Work email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-lbg-gray-200 focus:outline-none focus:ring-2 focus:ring-lbg-green/20 focus:border-lbg-green"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-lbg-gray-600 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-lbg-gray-200 focus:outline-none focus:ring-2 focus:ring-lbg-green/20 focus:border-lbg-green"
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in to Admin'}
          </Button>

          <p className="text-xs text-center text-lbg-gray-400">
            Vendor partner?{' '}
            <a href="/vendor/login" className="text-lbg-green font-semibold">
              Vendor portal login
            </a>
          </p>

          <p className="text-[10px] text-lbg-gray-400 text-center leading-relaxed">
            Authorised personnel only. All activity is logged and monitored.
          </p>
        </form>
      </div>
    </div>
  );
}
