import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { PageHeader, ContentPanel, AlertBanner, Badge, Button, PaginatedTable } from '../components/ui';
import { enrichPoliciesWithPayments, type AdminPolicyRow } from '../api';
import { formatCacheAge } from '../firestore/adminCache';
import { cachedAdminApi } from '../firestore/cachedAdminApi';

const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  active: 'success',
  quoted: 'info',
  expiring: 'warning',
  expired: 'error',
  cancelled: 'neutral',
  paid: 'success',
  pending: 'warning',
};

function formatGBP(amount: number, unit?: string) {
  const suffix = unit === 'trip' ? '/trip' : unit === 'month' ? '/mo' : '';
  return `£${amount.toFixed(2)}${suffix}`;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function PoliciesPage() {
  const [policies, setPolicies] = useState<AdminPolicyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | undefined>();

  const load = useCallback((force = false) => {
    setLoading(true);
    Promise.all([cachedAdminApi.listPolicies(force), cachedAdminApi.listPayments(force)])
      .then(([polRes, payRes]) => {
        setPolicies(enrichPoliciesWithPayments(polRes.data.policies, payRes.data.payments));
        setFromCache(polRes.fromCache && payRes.fromCache);
        setCachedAt(polRes.cachedAt ?? payRes.cachedAt);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load policies');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const cacheLabel = fromCache ? formatCacheAge(cachedAt) : null;

  return (
    <AdminLayout>
      <PageHeader
        icon={FileText}
        title="Policy management"
        subtitle="Quotes, bound policies, and payment status across the marketplace"
        metrics={[
          { label: 'Applications', value: policies.length },
          { label: 'Paid', value: policies.filter((p) => p.payment_status === 'paid').length, tone: 'success' },
          { label: 'Active', value: policies.filter((p) => p.status === 'active').length, tone: 'success' },
          { label: 'Pending pay', value: policies.filter((p) => (p.payment_status ?? 'pending') !== 'paid').length, tone: 'warning' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {cacheLabel ? (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
                Cached · {cacheLabel}
              </span>
            ) : null}
            <Button size="sm" variant="hero" onClick={() => load(true)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <ContentPanel title="Quotes & policies" description="All customer applications and bound cover">
        {loading ? (
          <p className="p-6 text-sm text-lbg-gray-500">Loading policies…</p>
        ) : (
          <PaginatedTable
            columns={[
              { key: 'policy_number', label: 'Quote / policy', sortable: true },
              { key: 'customer_name', label: 'Customer', sortable: true },
              { key: 'product_title', label: 'Product', sortable: true },
              { key: 'category', label: 'Category', sortable: true },
              { key: 'premium', label: 'Premium', sortable: true },
              { key: 'payment_status', label: 'Payment', sortable: true },
              { key: 'status', label: 'Status', sortable: true },
              { key: 'created_at', label: 'Created', sortable: true },
            ]}
            rows={policies}
            rowKey={(p) => p.id}
            defaultSortKey="created_at"
            defaultSortDir="desc"
            getSortValue={(row, key) => {
              if (key === 'premium') return Number(row.premium);
              if (key === 'payment_status') return row.payment_status ?? 'pending';
              return (row as Record<string, string | number>)[key];
            }}
            emptyMessage="No quotes yet. Customer quotes appear here after estimate."
            renderRow={(p) => (
              <tr key={p.id} className="hover:bg-lbg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-semibold text-sm">{p.policy_number}</p>
                  <p className="text-xs font-mono text-lbg-gray-400">{p.quote_id}</p>
                  {p.policy_ref ? (
                    <p className="text-xs text-lbg-green mt-1">Ref: {p.policy_ref}</p>
                  ) : null}
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm font-medium">{p.customer_name}</p>
                  <p className="text-xs text-lbg-gray-400">{p.customer_email || '—'}</p>
                </td>
                <td className="py-3 px-4 text-sm">{p.product_title}</td>
                <td className="py-3 px-4">
                  <Badge variant="info">{p.category}</Badge>
                </td>
                <td className="py-3 px-4 font-semibold text-sm">
                  {formatGBP(Number(p.premium), p.price_unit)}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={statusBadge[p.payment_status ?? 'pending'] ?? 'neutral'}>
                    {p.payment_status ?? 'not paid'}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={statusBadge[p.status] ?? 'neutral'}>{p.status}</Badge>
                </td>
                <td className="py-3 px-4 text-lbg-gray-400 text-sm">{formatDate(p.created_at)}</td>
              </tr>
            )}
          />
        )}
      </ContentPanel>
    </AdminLayout>
  );
}
