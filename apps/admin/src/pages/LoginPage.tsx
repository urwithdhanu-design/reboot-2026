import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-lbg-gray-50">
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-lbg-sidebar via-lbg-green to-lbg-green-dark p-12 flex-col justify-between text-white">
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
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center ring-1 ring-white/20">
              <ShieldCheck className="w-7 h-7" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">Reboot 2026 Insurance</p>
              <p className="text-sm text-white/75">Platform operations</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight mb-5 max-w-lg">
            Run products, vendors, and compliance from one console
          </h1>
          <p className="text-white/85 text-lg leading-relaxed max-w-md">
            Review KYC, manage policies and claims, monitor ledger activity, and coordinate microservices across the GCUL stack.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-white/90">
            {['Customer & KYC review', 'Policy and claims oversight', 'Blockchain & wallet operations'].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-lbg-green-muted" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/50">
          Authorised personnel only · Activity is audited
        </p>
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

              <Button type="submit" size="lg" className="w-full shadow-sm" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in to admin'}
              </Button>
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
        </div>
      </div>
    </div>
  );
}
