import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlatformFlowHero } from '../components/PlatformFlowHero';
import { Button } from '../components/ui';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const demoEmail = 'admin@reboot2026.local';
  const demoPassword = 'Reboot2026!Admin';

  const handleDemoSignIn = async () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} — start local APIs: scripts\\start-local-apis.cmd`
          : 'Demo sign-in failed. Is kyc-service running on port 8081?',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-lbg-gray-50">
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden bg-gradient-to-br from-lbg-sidebar via-lbg-green to-lbg-green-dark flex-col text-white">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0V32" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col flex-1 min-h-0 p-8 xl:p-10">
          <div className="flex items-center gap-3 mb-8 shrink-0">
            <div className="w-12 h-12 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center ring-1 ring-white/20">
              <ShieldCheck className="w-7 h-7" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">Reboot 2026 Insurance</p>
              <p className="text-sm text-white/75">Platform operations</p>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <PlatformFlowHero />
          </div>

          <p className="relative z-10 text-xs text-white/50 mt-6 shrink-0">
            Authorised personnel only · Activity is audited
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-lbg-green text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-lbg-black">Reboot 2026 Admin</p>
              <p className="text-xs text-lbg-gray-400">Platform console</p>
            </div>
          </div>

          <div className="lg:hidden mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-lbg-sidebar via-lbg-green to-lbg-green-dark">
            <div className="p-5 sm:p-6">
              <PlatformFlowHero compact />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-lbg-gray-200 shadow-sm p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-lbg-green mb-2">Admin sign-in</p>
            <h2 className="text-2xl font-bold text-lbg-black tracking-tight">Welcome back</h2>
            <p className="text-sm text-lbg-gray-400 mt-1 mb-7">
              Use your work email to access the operations dashboard.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="admin-email" className="text-sm font-medium text-lbg-gray-600 block mb-1.5">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-lbg-gray-400 pointer-events-none" />
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-lbg-gray-200 focus:outline-none focus:ring-2 focus:ring-lbg-green/25 focus:border-lbg-green transition-shadow"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="admin-password" className="text-sm font-medium text-lbg-gray-600">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-lbg-green hover:underline"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-lbg-gray-400 pointer-events-none" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-lbg-gray-200 focus:outline-none focus:ring-2 focus:ring-lbg-green/25 focus:border-lbg-green transition-shadow"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-lbg-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-lbg-gray-200 text-lbg-green focus:ring-lbg-green/30"
                />
                Keep me signed in on this device
              </label>

              {error ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
                  {error}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="w-full shadow-sm" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in to admin'}
              </Button>

              {import.meta.env.DEV ? (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={handleDemoSignIn}
                >
                  {loading ? 'Signing in…' : 'Demo sign in (local)'}
                </Button>
              ) : null}
            </form>
          </div>

          <p className="text-sm text-center text-lbg-gray-400 mt-6">
            Insurance partner?{' '}
            <Link to="/vendor/login" className="text-lbg-green font-semibold hover:underline">
              Vendor portal
            </Link>
          </p>
          <p className="text-[11px] text-center text-lbg-gray-400 mt-3 leading-relaxed px-4">
            Customer sign-up and password reset live on the public app at{' '}
            <a href="http://localhost:5174/register" className="text-lbg-green font-medium hover:underline">
              localhost:5174
            </a>
            .
          </p>
          {import.meta.env.DEV ? (
            <p className="text-[11px] text-center text-lbg-gray-500 mt-2 leading-relaxed px-4">
              Local platform admin: <strong>admin@reboot2026.local</strong> / <strong>Reboot2026!Admin</strong>
              {' '}(seeded by kyc-service on startup). Re-sign in after switching local ↔ cloud APIs.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
