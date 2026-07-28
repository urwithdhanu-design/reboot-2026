import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Eye, RefreshCw, Satellite } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ClaimReviewModal } from '../components/ClaimReviewModal';
import {
  PageHeader,
  FilterTabs,
  ContentPanel,
  AlertBanner,
  Badge,
  Button,
  PaginatedTable,
} from '../components/ui';
import { adminApi, type AdminClaimRow, type ParametricRuleRow, type ParametricTriggerRow } from '../api';

const REFRESH_MS = 15_000;

type Filter = 'all' | 'open' | 'approved' | 'rejected' | 'settled' | 'parametric';

const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  submitted: 'warning',
  pending_approval: 'warning',
  awaiting_customer: 'warning',
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
  return ['submitted', 'pending_approval', 'in_review', 'awaiting_customer', 'approved', 'payment_pending'].includes(status);
}

function isSettled(status: string) {
  return status === 'settled' || status === 'paid_out' || status === 'paid';
}

function formatParametricEventLabel(eventType?: string | null) {
  if (eventType === 'trip_cancellation') return 'Trip cancellation';
  if (eventType === 'flight_delay') return 'Flight delay';
  if (eventType === 'telematics_accident') return 'Telematics accident';
  return 'Parametric';
}

function resolveClaimCategoryLabel(claim: AdminClaimRow, eventType?: string | null) {
  if (claim.source === 'parametric' && eventType) {
    return formatParametricEventLabel(eventType);
  }
  return claim.category;
}

function resolveParametricEventType(
  claim: AdminClaimRow,
  trigger?: ParametricTriggerRow,
  rule?: ParametricRuleRow,
) {
  if (claim.parametric_event_type) return claim.parametric_event_type;
  if (trigger?.rule_type) return trigger.rule_type;
  if (rule?.rule_type) return rule.rule_type;
  if ((claim.description ?? '').toLowerCase().includes('trip cancel')) return 'trip_cancellation';
  if ((claim.description ?? '').toLowerCase().includes('telematics')) return 'telematics_accident';
  if ((claim.description ?? '').toLowerCase().includes('delayed')) return 'flight_delay';
  return null;
}

export function ClaimsPage() {
  const [claims, setClaims] = useState<AdminClaimRow[]>([]);
  const [triggers, setTriggers] = useState<ParametricTriggerRow[]>([]);
  const [rules, setRules] = useState<ParametricRuleRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const [parametricWarning, setParametricWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewClaim, setReviewClaim] = useState<AdminClaimRow | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const claimsRes = await adminApi.listClaims();
      setClaims(claimsRes.claims);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claims');
    }

    try {
      const [triggersRes, rulesRes] = await Promise.all([
        adminApi.listParametricTriggers(),
        adminApi.listParametricRules(),
      ]);
      setTriggers(triggersRes.triggers);
      setRules(rulesRes.rules);
      setParametricWarning(null);
    } catch {
      setTriggers([]);
      setRules([]);
      setParametricWarning(
        'Parametric oracle data is unavailable. Claims still load; start parametric-claim-service on port 8086 for trigger details.',
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    const timer = window.setInterval(() => load(true), REFRESH_MS);
    return () => window.clearInterval(timer);
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

  const ruleById = useMemo(() => {
    const map = new Map<string, ParametricRuleRow>();
    for (const rule of rules) {
      map.set(rule.id, rule);
    }
    return map;
  }, [rules]);

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
      load(false);
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
          <Button size="sm" variant="hero" onClick={() => load(false)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}
      {parametricWarning ? <AlertBanner variant="info">{parametricWarning}</AlertBanner> : null}
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
              { key: 'document_count', label: 'Documents', sortable: true },
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
              if (key === 'document_count') return Number(row.document_count ?? row.documents?.length ?? 0);
              if (key === '_actions') return '';
              const value = row[key as keyof AdminClaimRow];
              if (typeof value === 'string' || typeof value === 'number') return value;
              return '';
            }}
            emptyMessage="No claims in this view."
            renderRow={(c) => {
              const trigger = triggerByClaimId.get(c.id);
              const triggerRule = trigger ? ruleById.get(trigger.rule_id) : undefined;
              const isParametric = c.source === 'parametric';
              const eventType = resolveParametricEventType(c, trigger, triggerRule);
              const isCancellation = eventType === 'trip_cancellation';
              const categoryLabel = resolveClaimCategoryLabel(c, eventType);
              return (
              <tr key={c.id} className="hover:bg-lbg-green-light/30 transition-colors">
                <td className="py-3.5 px-4 font-mono text-sm font-semibold text-lbg-green-dark">{c.id}</td>
                <td className="py-3.5 px-4 font-semibold text-lbg-black">{c.customer_name}</td>
                <td className="py-3.5 px-4 font-mono text-xs text-lbg-gray-500">{c.policy_ref}</td>
                <td className="py-3.5 px-4">
                  <Badge variant={isCancellation ? 'warning' : isParametric ? 'success' : 'info'}>
                    {categoryLabel}
                  </Badge>
                  {isParametric && eventType ? (
                    <p className="text-[10px] text-lbg-gray-400 mt-1">Auto-settled parametric</p>
                  ) : null}
                </td>
                <td className="py-3.5 px-4 font-bold text-lbg-black">{formatGBP(Number(c.amount_claimed))}</td>
                <td className="py-3.5 px-4">
                  <Badge variant={statusBadge[c.status] ?? 'neutral'}>
                    {formatStatus(c.status)}
                  </Badge>
                  {(c.open_query_count ?? 0) > 0 ? (
                    <p className="text-[10px] text-amber-700 mt-1 font-semibold">
                      {c.open_query_count} open query{(c.open_query_count ?? 0) === 1 ? '' : 'ies'}
                    </p>
                  ) : null}
                  {c.payout_transaction_id ? (
                    <p className="text-[10px] text-lbg-gray-400 mt-1 font-mono">{c.payout_transaction_id}</p>
                  ) : null}
                </td>
                <td className="py-3.5 px-4 text-sm">
                  {c.source === 'parametric' ? (
                    <span className="text-lbg-gray-400">—</span>
                  ) : (
                    <button
                      type="button"
                      className="text-lbg-green font-semibold hover:underline"
                      onClick={() => setReviewClaim(c)}
                    >
                      {(c.document_count ?? c.documents?.length ?? 0) || 0} file(s)
                    </button>
                  )}
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
                            <span className="font-medium text-lbg-black">
                              {formatParametricEventLabel(eventType ?? trigger.rule_type)}
                            </span>
                            {' · '}
                            {trigger.trigger_source === 'oracle_poll' ? 'Oracle' : 'Simulation'}
                            {trigger.oracle_provider ? ` · ${trigger.oracle_provider}` : ''}
                          </p>
                          <p>
                            {trigger.flight_number ? `Flight ${trigger.flight_number}` : 'Flight —'}
                            {isCancellation
                              ? ' · Trip cancelled before departure'
                              : ` · ${trigger.observed_value} min delay${trigger.flight_status ? ` (${trigger.flight_status})` : ''}`}
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
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === c.id}
                        onClick={() => setReviewClaim(c)}
                      >
                        <Eye className="w-3 h-3" /> Review
                      </Button>
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
                          In review
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={
                          busyId === c.id
                          || (c.source !== 'parametric' && !(c.document_count ?? c.documents?.length))
                          || (c.open_query_count ?? 0) > 0
                        }
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

      <ClaimReviewModal
        claim={reviewClaim}
        open={reviewClaim != null}
        busy={busyId === reviewClaim?.id}
        onClose={() => setReviewClaim(null)}
        onReview={async () => {
          if (!reviewClaim) return;
          await runAction(reviewClaim.id, () => adminApi.reviewClaim(reviewClaim.id), 'Claim {id} moved to review');
          const updated = await adminApi.getClaim(reviewClaim.id);
          setReviewClaim(updated);
        }}
        onApprove={async () => {
          if (!reviewClaim) return;
          await runAction(
            reviewClaim.id,
            () => adminApi.approveClaim(reviewClaim.id, Number(reviewClaim.amount_claimed)),
            'Claim {id} approved — wallet credited and settlement recorded',
          );
          setReviewClaim(null);
        }}
        onReject={async () => {
          if (!reviewClaim) return;
          await runAction(
            reviewClaim.id,
            () => adminApi.rejectClaim(reviewClaim.id, 'Rejected by admin after document review'),
            'Claim {id} rejected',
          );
          setReviewClaim(null);
        }}
        onSendQuery={async (message, requiresDocuments) => {
          if (!reviewClaim) return;
          await adminApi.createClaimQuery(reviewClaim.id, {
            message,
            requires_documents: requiresDocuments,
          });
          const updated = await adminApi.getClaim(reviewClaim.id);
          setReviewClaim(updated);
          setSuccess(`Query sent on claim ${reviewClaim.id} — awaiting customer response`);
          load(true);
        }}
      />
    </AdminLayout>
  );
}
