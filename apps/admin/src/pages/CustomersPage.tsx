import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { PageHeader, FilterTabs, ContentPanel, AlertBanner, Badge, Button, SearchInput, PaginatedTable } from '../components/ui';
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

const customerColumns = [
  { key: 'full_name', label: 'Customer', sortable: true },
  { key: 'email', label: 'Contact', sortable: true },
  { key: 'account_status', label: 'Status', sortable: true },
  { key: 'kyc_status', label: 'KYC', sortable: true },
  { key: 'policyCount', label: 'Quotes / policies', sortable: true },
  { key: 'wallet_status', label: 'Wallet', sortable: true },
  { key: 'created_at', label: 'Joined', sortable: true },
] as const;

type CustomerRow = AdminCustomer & { policyCount: number };

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

  const tableRows = useMemo<CustomerRow[]>(
    () =>
      rows.map((c) => ({
        ...c,
        policyCount: policyCountByEmail(policies, c.email),
        account_status: c.account_status ?? 'registered',
        kyc_status: c.kyc_status ?? 'not_started',
        wallet_status: c.wallet?.address ? c.wallet.address : (c.wallet_status ?? 'none'),
      })),
    [rows, policies],
  );

  const cacheLabel = fromCache ? formatCacheAge(cachedAt) : null;

  return (
    <AdminLayout>
      <PageHeader
        icon={Users}
        title="Customer management"
        subtitle={`Registered customers and KYC status · cache in ${FIRESTORE_CACHE_PROJECT}/gcul_cache`}
        metrics={[
          { label: 'Customers', value: customers.length },
          { label: 'KYC verified', value: customers.filter((c) => c.kyc_status === 'verified').length, tone: 'success' },
          { label: 'Pending KYC', value: customers.filter((c) => c.kyc_status === 'in_progress').length, tone: 'warning' },
          { label: 'Policies', value: policies.length },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {cacheLabel ? (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
                Cached · {cacheLabel}
              </span>
            ) : !loading ? (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
                Live API
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

      <FilterTabs
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All customers' },
          { value: 'verified', label: 'KYC verified' },
          { value: 'in_progress', label: 'Pending KYC' },
        ]}
      />

      <ContentPanel title="Customer register" description="Search and sort across your customer base">
        <div className="border-b border-lbg-gray-100 px-4 py-3 sm:px-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or ID…" />
        </div>
        {loading ? (
          <p className="p-6 text-sm text-lbg-gray-500">Loading customers…</p>
        ) : (
          <PaginatedTable
            columns={[...customerColumns]}
            rows={tableRows}
            rowKey={(c) => c.id}
            defaultSortKey="created_at"
            defaultSortDir="desc"
            emptyMessage="No customers match your filters."
            getSortValue={(row, key) => {
              if (key === 'policyCount') return row.policyCount;
              if (key === 'wallet_status') return row.wallet_status;
              return (row as unknown as Record<string, string | number>)[key];
            }}
            renderRow={(c) => {
              const acct = c.account_status ?? 'registered';
              const kyc = c.kyc_status ?? 'not_started';
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
                  <td className="py-3 px-4 font-semibold">{c.policyCount}</td>
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
            }}
          />
        )}
      </ContentPanel>
    </AdminLayout>
  );
}
