import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, DataTable, Badge, Button, SearchInput } from '../components/ui';
import { enrichPoliciesWithPayments, policyCountByEmail, type AdminCustomer } from '../api';
import { formatCacheAge, FIRESTORE_CACHE_PROJECT } from '../firestore/adminCache';
import { cachedAdminApi, filterCustomers } from '../firestore/cachedAdminApi';

const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  pending_kyc: 'warning',
  suspended: 'error',
  registered: 'neutral',
};

const kycBadge: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  verified: 'success',
  in_progress: 'warning',
  not_started: 'neutral',
  rejected: 'error',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'in_progress'>('all');
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [policies, setPolicies] = useState<ReturnType<typeof enrichPoliciesWithPayments>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | undefined>();

  const load = useCallback((force = false) => {
    setLoading(true);
    Promise.all([
      cachedAdminApi.listCustomers(force),
      cachedAdminApi.listPolicies(force),
      cachedAdminApi.listPayments(force),
    ])
      .then(([custRes, polRes, payRes]) => {
        setCustomers(custRes.data.customers);
        setPolicies(enrichPoliciesWithPayments(polRes.data.policies, payRes.data.payments));
        setFromCache(custRes.fromCache && polRes.fromCache && payRes.fromCache);
        setCachedAt(custRes.cachedAt ?? polRes.cachedAt ?? payRes.cachedAt);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const rows = useMemo(
    () => filterCustomers(customers, search, filter),
    [customers, search, filter],
  );

  const cacheLabel = fromCache ? formatCacheAge(cachedAt) : null;

  return (
    <AdminLayout>
      <PageHeader
        title="Customer Management"
        subtitle={`Live customers · Firestore cache in ${FIRESTORE_CACHE_PROJECT}/gcul_cache (10 min)`}
        actions={
          <div className="flex items-center gap-2">
            {cacheLabel ? (
              <Badge variant="info">Cached · {cacheLabel}</Badge>
            ) : !loading ? (
              <Badge variant="neutral">Live API</Badge>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => load(true)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" disabled>
              Export CSV
            </Button>
          </div>
        }
      />

      {error ? (
        <p className="text-sm text-red-600 font-semibold mb-4" role="alert">
          {error}
        </p>
      ) : null}

      <Card padding={false}>
        <div className="p-4 border-b border-lbg-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." />
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>
              All
            </Button>
            <Button
              variant={filter === 'verified' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('verified')}
            >
              KYC verified
            </Button>
            <Button
              variant={filter === 'in_progress' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('in_progress')}
            >
              Pending KYC
            </Button>
          </div>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-lbg-gray-500">Loading customers…</p>
        ) : (
          <DataTable headers={['Customer', 'Contact', 'Status', 'KYC', 'Quotes / policies', 'Wallet', 'Joined']}>
            {rows.map((c) => {
              const acct = c.account_status ?? 'registered';
              const kyc = c.kyc_status ?? 'not_started';
              const policyCount = policyCountByEmail(policies, c.email);
              return (
                <tr key={c.id} className="hover:bg-lbg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-semibold">{c.full_name}</p>
                    <p className="text-xs text-lbg-gray-400 font-mono">{c.id}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{c.email}</p>
                    <p className="text-xs text-lbg-gray-400">{c.mobile_number}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={statusBadge[acct] ?? 'neutral'}>{acct.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={kycBadge[kyc] ?? 'neutral'}>{kyc.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="py-3 px-4 font-semibold">{policyCount}</td>
                  <td className="py-3 px-4 text-sm">
                    {c.wallet?.address ? (
                      <span className="font-mono text-xs">{c.wallet.address.slice(0, 10)}…</span>
                    ) : (
                      <span className="text-lbg-gray-400">{c.wallet_status ?? 'none'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-lbg-gray-400 text-sm">{formatDate(c.created_at)}</td>
                </tr>
              );
            })}
          </DataTable>
        )}
        {!loading && rows.length === 0 ? (
          <p className="p-6 text-sm text-lbg-gray-500">No customers match your filters.</p>
        ) : null}
      </Card>
    </AdminLayout>
  );
}
