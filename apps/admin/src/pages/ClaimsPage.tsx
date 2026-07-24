import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import {
  PageHeader,
  FilterTabs,
  ContentPanel,
  AlertBanner,
  Badge,
  Button,
  PaginatedTable,
} from '../components/ui';
import { adminApi, type AdminClaimRow } from '../api';

type Filter = 'all' | 'open' | 'approved' | 'rejected';

const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  submitted: 'warning',
  in_review: 'info',
  approved: 'success',
  rejected: 'error',
  paid: 'success',
};

function formatGBP(amount: number) {
  return `£${amount.toFixed(2)}`;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function isOpen(status: string) {
  return status === 'submitted' || status === 'in_review';
}

export function ClaimsPage() {
  const [claims, setClaims] = useState<AdminClaimRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listClaims()
      .then((res) => {
        setClaims(res.claims);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load claims');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'open') return claims.filter((c) => isOpen(c.status));
    if (filter === 'approved') return claims.filter((c) => c.status === 'approved' || c.status === 'paid');
    if (filter === 'rejected') return claims.filter((c) => c.status === 'rejected');
    return claims;
  }, [claims, filter]);

  const openCount = useMemo(() => claims.filter((c) => isOpen(c.status)).length, [claims]);
  const approvedCount = useMemo(
    () => claims.filter((c) => c.status === 'approved' || c.status === 'paid').length,
    [claims],
  );
  const rejectedCount = useMemo(() => claims.filter((c) => c.status === 'rejected').length, [claims]);
  const totalClaimed = useMemo(
    () => claims.reduce((sum, c) => sum + Number(c.amount_claimed || 0), 0),
    [claims],
  );

  async function setStatus(claim: AdminClaimRow, status: string) {
    setBusyId(claim.id);
    setError(null);
    try {
      await adminApi.updateClaimStatus(claim.id, status);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update claim');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        icon={ClipboardList}
        title="Claims processing"
        subtitle="Review, adjudicate, and track customer claims from first notice through settlement."
        metrics={[
          { label: 'Total claims', value: claims.length },
          { label: 'Open', value: openCount, tone: 'warning' },
          { label: 'Approved / paid', value: approvedCount, tone: 'success' },
          { label: 'Value claimed', value: formatGBP(totalClaimed) },
        ]}
        actions={
          <Button size="sm" variant="hero" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <FilterTabs
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: `All (${claims.length})` },
          { value: 'open', label: `Open (${openCount})` },
          { value: 'approved', label: `Approved (${approvedCount})` },
          { value: 'rejected', label: `Rejected (${rejectedCount})` },
        ]}
      />

      <ContentPanel
        title="Claims register"
        description="Sorted by submission date · use column headers to re-sort"
      >
        {loading ? (
          <p className="p-8 text-center text-sm text-lbg-gray-500">Loading claims…</p>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-lbg-black">No claims in this view</p>
            <p className="mt-1 text-sm text-lbg-gray-400">
              Customer claims appear here after submission from the app.
            </p>
          </div>
        ) : (
          <PaginatedTable
            columns={[
              { key: 'id', label: 'Claim ID', sortable: true },
              { key: 'customer_name', label: 'Customer', sortable: true },
              { key: 'policy_ref', label: 'Policy', sortable: true },
              { key: 'category', label: 'Category', sortable: true },
              { key: 'amount_claimed', label: 'Amount', sortable: true },
              { key: 'status', label: 'Status', sortable: true },
              { key: 'source', label: 'Source', sortable: true },
              { key: 'description', label: 'Description', sortable: true },
              { key: 'created_at', label: 'Submitted', sortable: true },
              { key: '_actions', label: 'Actions', sortable: false },
            ]}
            rows={filtered}
            rowKey={(c) => c.id}
            defaultSortKey="created_at"
            defaultSortDir="desc"
            getSortValue={(row, key) => {
              if (key === 'amount_claimed') return Number(row.amount_claimed);
              if (key === '_actions') return '';
              return (row as Record<string, string | number>)[key];
            }}
            emptyMessage="No claims in this view."
            renderRow={(c) => (
              <tr key={c.id} className="hover:bg-lbg-green-light/30 transition-colors">
                <td className="py-3.5 px-4 font-mono text-sm font-semibold text-lbg-green-dark">{c.id}</td>
                <td className="py-3.5 px-4 font-semibold text-lbg-black">{c.customer_name}</td>
                <td className="py-3.5 px-4 font-mono text-xs text-lbg-gray-500">{c.policy_ref}</td>
                <td className="py-3.5 px-4">
                  <Badge variant="info">{c.category}</Badge>
                </td>
                <td className="py-3.5 px-4 font-bold text-lbg-black">{formatGBP(Number(c.amount_claimed))}</td>
                <td className="py-3.5 px-4">
                  <Badge variant={statusBadge[c.status] ?? 'neutral'}>
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="py-3.5 px-4 text-sm text-lbg-gray-500">{c.source ?? '—'}</td>
                <td className="py-3.5 px-4 text-sm text-lbg-gray-500 max-w-[200px] truncate" title={c.description}>
                  {c.description || '—'}
                </td>
                <td className="py-3.5 px-4 text-sm text-lbg-gray-400 whitespace-nowrap">{formatDate(c.created_at)}</td>
                <td className="py-3.5 px-4">
                  {isOpen(c.status) ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {c.status === 'submitted' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === c.id}
                          onClick={() => void setStatus(c, 'in_review')}
                        >
                          Review
                        </Button>
                      ) : null}
                      <Button size="sm" disabled={busyId === c.id} onClick={() => void setStatus(c, 'approved')}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === c.id}
                        onClick={() => void setStatus(c, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-lbg-gray-400">Complete</span>
                  )}
                </td>
              </tr>
            )}
          />
        )}
      </ContentPanel>
    </AdminLayout>
  );
}
