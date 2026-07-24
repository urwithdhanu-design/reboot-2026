import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, DataTable, Badge, Button } from '../components/ui';
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
        title="Claims Processing"
        subtitle="Live claims from the claims service — submitted, reviewed, and adjudicated"
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="info">{claims.length} total</Badge>
          </div>
        }
      />

      {error ? (
        <p className="text-sm text-red-600 font-semibold mb-4" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-xs text-lbg-gray-400 uppercase font-medium">Total claims</p>
          <p className="text-2xl font-bold mt-1">{claims.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-lbg-gray-400 uppercase font-medium">Open</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{openCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-lbg-gray-400 uppercase font-medium">Approved / paid</p>
          <p className="text-2xl font-bold text-lbg-green mt-1">{approvedCount}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ['all', `All (${claims.length})`],
            ['open', `Open (${openCount})`],
            ['approved', `Approved (${approvedCount})`],
            ['rejected', `Rejected (${claims.filter((c) => c.status === 'rejected').length})`],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? 'primary' : 'ghost'}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card padding={false}>
        {loading ? (
          <p className="p-6 text-sm text-lbg-gray-500">Loading claims…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-lbg-gray-500">
            No claims in this view. Customer claims appear here after submission from the app.
          </p>
        ) : (
          <DataTable
            headers={[
              'Claim ID',
              'Customer',
              'Policy',
              'Category',
              'Amount',
              'Status',
              'Source',
              'Description',
              'Submitted',
              'Actions',
            ]}
          >
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-lbg-gray-50">
                <td className="py-3 px-4 font-mono text-sm">{c.id}</td>
                <td className="py-3 px-4 font-semibold">{c.customer_name}</td>
                <td className="py-3 px-4 font-mono text-xs">{c.policy_ref}</td>
                <td className="py-3 px-4">
                  <Badge variant="info">{c.category}</Badge>
                </td>
                <td className="py-3 px-4 font-bold">{formatGBP(Number(c.amount_claimed))}</td>
                <td className="py-3 px-4">
                  <Badge variant={statusBadge[c.status] ?? 'neutral'}>
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-sm text-lbg-gray-500">{c.source ?? '—'}</td>
                <td className="py-3 px-4 text-sm text-lbg-gray-500 max-w-[200px] truncate">
                  {c.description || '—'}
                </td>
                <td className="py-3 px-4 text-lbg-gray-400 text-sm">{formatDate(c.created_at)}</td>
                <td className="py-3 px-4">
                  {isOpen(c.status) ? (
                    <div className="flex gap-1 flex-wrap">
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
                      <Button
                        size="sm"
                        disabled={busyId === c.id}
                        onClick={() => void setStatus(c, 'approved')}
                      >
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
                    <span className="text-xs text-lbg-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>
    </AdminLayout>
  );
}
