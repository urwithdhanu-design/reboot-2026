import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, RefreshCw, Satellite } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { adminApi, type AdminClaimRow, type ParametricTriggerRow } from '../api';

type Filter = 'all' | 'open' | 'approved' | 'rejected' | 'settled' | 'parametric';

const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  submitted: 'warning',
  pending_approval: 'warning',
  in_review: 'info',
  approved: 'info',
  payment_pending: 'info',
  paid_out: 'success',
  settled: 'success',
  paid: 'success',
  rejected: 'error',
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

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function isOpen(status: string) {
  return ['submitted', 'pending_approval', 'in_review', 'approved', 'payment_pending'].includes(status);
}

function isSettled(status: string) {
  return status === 'settled' || status === 'paid_out' || status === 'paid';
}

export function ClaimsPage() {
  const [claims, setClaims] = useState<AdminClaimRow[]>([]);
  const [triggers, setTriggers] = useState<ParametricTriggerRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminApi.listClaims(), adminApi.listParametricTriggers()])
      .then(([claimsRes, triggersRes]) => {
        setClaims(claimsRes.claims);
        setTriggers(triggersRes.triggers);
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

  const triggerByClaimId = useMemo(() => {
    const map = new Map<string, ParametricTriggerRow>();
    for (const trigger of triggers) {
      if (trigger.claim_id) {
        map.set(trigger.claim_id, trigger);
      }
    }
    return map;
  }, [triggers]);

  const parametricCount = useMemo(
    () => claims.filter((c) => c.source === 'parametric').length,
    [claims],
  );

  const filtered = useMemo(() => {
    if (filter === 'parametric') return claims.filter((c) => c.source === 'parametric');
    if (filter === 'open') return claims.filter((c) => isOpen(c.status));
    if (filter === 'approved') return claims.filter((c) => ['approved', 'payment_pending', 'paid_out', 'paid'].includes(c.status));
    if (filter === 'settled') return claims.filter((c) => isSettled(c.status));
    if (filter === 'rejected') return claims.filter((c) => c.status === 'rejected');
    return claims;
  }, [claims, filter]);

  const openCount = useMemo(() => claims.filter((c) => isOpen(c.status)).length, [claims]);
  const settledCount = useMemo(() => claims.filter((c) => isSettled(c.status)).length, [claims]);
  const rejectedCount = useMemo(() => claims.filter((c) => c.status === 'rejected').length, [claims]);
  const totalClaimed = useMemo(
    () => claims.reduce((sum, c) => sum + Number(c.amount_claimed || 0), 0),
    [claims],
  );

  async function runAction(claimId: string, action: () => Promise<AdminClaimRow>, successMsg: string) {
    setBusyId(claimId);
    setError(null);
    setSuccess(null);
    try {
      const result = await action();
      setSuccess(successMsg.replace('{id}', result.id));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        icon={ClipboardList}
        title="Claims processing"
        subtitle="Review Canton-linked claims. Parametric auto-claims show live oracle trigger status."
        metrics={[
          { label: 'Total claims', value: claims.length },
          { label: 'Parametric auto', value: parametricCount, tone: 'success' },
          { label: 'Open', value: openCount, tone: 'warning' },
          { label: 'Settled', value: settledCount, tone: 'success' },
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
      {success ? <AlertBanner variant="success">{success}</AlertBanner> : null}

      <FilterTabs
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: `All (${claims.length})` },
          { value: 'parametric', label: `Parametric auto (${parametricCount})` },
          { value: 'open', label: `Open (${openCount})` },
          { value: 'approved', label: `In payout (${claims.filter((c) => ['approved', 'payment_pending', 'paid_out'].includes(c.status)).length})` },
          { value: 'settled', label: `Settled (${settledCount})` },
          { value: 'rejected', label: `Rejected (${rejectedCount})` },
        ]}
      />

      <ContentPanel
        title="Claims register"
        description="Approve runs validation against the Canton policy certificate, credits the customer wallet, and records settlement."
      >
        {loading ? (
          <p className="p-8 text-center text-sm text-lbg-gray-500">Loading claims…</p>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-lbg-black">No claims in this view</p>
            <p className="mt-1 text-sm text-lbg-gray-400">
              Customer claims appear here after submission against a Canton-minted policy.
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
              { key: 'source', label: 'Source / Oracle', sortable: true },
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
            renderRow={(c) => {
              const trigger = triggerByClaimId.get(c.id);
              const isParametric = c.source === 'parametric';
              return (
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
                    {formatStatus(c.status)}
                  </Badge>
                  {c.payout_transaction_id ? (
                    <p className="text-[10px] text-lbg-gray-400 mt-1 font-mono">{c.payout_transaction_id}</p>
                  ) : null}
                </td>
                <td className="py-3.5 px-4 text-sm">
                  {isParametric ? (
                    <div>
                      <Badge variant="success">
                        <span className="inline-flex items-center gap-1">
                          <Satellite className="w-3 h-3" />
                          parametric
                        </span>
                      </Badge>
                      {trigger ? (
                        <div className="mt-1.5 text-xs text-lbg-gray-500 space-y-0.5">
                          <p>
                            <span className="font-medium text-lbg-black">{trigger.trigger_source === 'oracle_poll' ? 'Oracle' : 'Simulation'}</span>
                            {trigger.oracle_provider ? ` · ${trigger.oracle_provider}` : ''}
                          </p>
                          <p>
                            {trigger.flight_number ? `Flight ${trigger.flight_number}` : 'Flight —'}
                            {' · '}
                            {trigger.observed_value} min delay
                            {trigger.flight_status ? ` (${trigger.flight_status})` : ''}
                          </p>
                          <p className="text-[10px] text-lbg-gray-400">{trigger.message}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-lbg-gray-400 mt-1">Auto-settled — see <Link to="/parametric" className="text-lbg-green hover:underline">Parametric</Link></p>
                      )}
                    </div>
                  ) : (
                    <span className="text-lbg-gray-500">{c.source ?? 'manual'}</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-sm text-lbg-gray-400 whitespace-nowrap">{formatDate(c.created_at)}</td>
                <td className="py-3.5 px-4">
                  {isParametric && isSettled(c.status) ? (
                    <span className="text-xs text-lbg-green-dark font-medium">Auto-settled</span>
                  ) : isOpen(c.status) ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {(c.status === 'submitted' || c.status === 'pending_approval') && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === c.id}
                          onClick={() => void runAction(
                            c.id,
                            () => adminApi.reviewClaim(c.id),
                            'Claim {id} moved to review',
                          )}
                        >
                          Review
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={busyId === c.id}
                        onClick={() => void runAction(
                          c.id,
                          () => adminApi.approveClaim(c.id, Number(c.amount_claimed)),
                          'Claim {id} approved — wallet credited and settlement recorded',
                        )}
                      >
                        {busyId === c.id ? 'Settling…' : 'Approve & pay'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === c.id}
                        onClick={() => void runAction(
                          c.id,
                          () => adminApi.rejectClaim(c.id, 'Rejected by admin'),
                          'Claim {id} rejected',
                        )}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : isSettled(c.status) ? (
                    <span className="text-xs text-lbg-green-dark font-medium">Settled</span>
                  ) : (
                    <span className="text-xs text-lbg-gray-400">Closed</span>
                  )}
                </td>
              </tr>
            );}}
          />
        )}
      </ContentPanel>
    </AdminLayout>
  );
}
