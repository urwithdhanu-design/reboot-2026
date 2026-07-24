import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, DataTable, Badge, Button } from '../components/ui';
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
        title="Policy Management"
        subtitle="Quotes and bound policies — Firestore cache (10 min) with live refresh"
        actions={
          <div className="flex items-center gap-2">
            {cacheLabel ? (
              <Badge variant="info">Cached · {cacheLabel}</Badge>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => load(true)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="info">{policies.length} applications</Badge>
          </div>
        }
      />

      {error ? (
        <p className="text-sm text-red-600 font-semibold mb-4" role="alert">
          {error}
        </p>
      ) : null}

      <Card padding={false}>
        {loading ? (
          <p className="p-6 text-sm text-lbg-gray-500">Loading policies…</p>
        ) : (
          <DataTable
            headers={[
              'Quote / policy',
              'Customer',
              'Product',
              'Category',
              'Premium',
              'Payment',
              'Status',
              'Created',
            ]}
          >
            {policies.map((p) => (
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
            ))}
          </DataTable>
        )}
        {!loading && policies.length === 0 ? (
          <p className="p-6 text-sm text-lbg-gray-500">No quotes yet. Customer quotes appear here after estimate.</p>
        ) : null}
      </Card>
    </AdminLayout>
  );
}
