import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-lbg-green text-white hover:bg-lbg-green-dark shadow-sm',
  secondary: 'bg-lbg-black text-white hover:bg-lbg-gray-600',
  outline: 'border border-lbg-gray-200 text-lbg-gray-600 hover:border-lbg-green hover:text-lbg-green bg-white',
  ghost: 'text-lbg-gray-600 hover:bg-lbg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = { sm: 'px-3 py-1.5 text-xs rounded-lg', md: 'px-4 py-2 text-sm rounded-lg', lg: 'px-5 py-2.5 text-sm rounded-xl' };

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`font-semibold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', padding = true }: { children: ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-lbg-gray-100 shadow-sm ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' }) {
  const styles = {
    success: 'bg-lbg-green-light text-lbg-green-dark',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-700',
    neutral: 'bg-lbg-gray-100 text-lbg-gray-600',
    purple: 'bg-purple-50 text-purple-700',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-lbg-black">{title}</h1>
        {subtitle && <p className="text-sm text-lbg-gray-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, change, icon: Icon, trend }: {
  label: string; value: string; change?: string; icon: React.ComponentType<{ className?: string }>; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-lbg-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-lbg-black mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 font-medium ${trend === 'up' ? 'text-lbg-green' : trend === 'down' ? 'text-red-500' : 'text-lbg-gray-400'}`}>
              {change}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl bg-lbg-green-light flex items-center justify-center">
          <Icon className="w-5 h-5 text-lbg-green" />
        </div>
      </div>
    </Card>
  );
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-lbg-gray-100">
            {headers.map((h) => (
              <th key={h} scope="col" className="text-left py-3 px-4 text-xs font-semibold text-lbg-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-lbg-gray-100">{children}</tbody>
      </table>
    </div>
  );
}

export function SearchInput({ placeholder = 'Search...', value, onChange }: { placeholder?: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full sm:w-64 px-4 py-2 rounded-lg border border-lbg-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-lbg-green/20 focus:border-lbg-green"
    />
  );
}
