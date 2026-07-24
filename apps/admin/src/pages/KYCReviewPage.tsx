import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, X, Eye, FileText, RefreshCw, Bot } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { adminApi, type KycQueueItem } from '../api';
import { formatCacheAge } from '../firestore/adminCache';
import { cachedAdminApi } from '../firestore/cachedAdminApi';

type Filter = 'all' | 'pending' | 'verified' | 'rejected';

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function approvalLabel(item: KycQueueItem): string {
  if (item.status === 'in_progress') return 'Pending review';
  if (item.status === 'rejected') return 'Rejected';
  if (item.approval_mode === 'auto_agent') return 'Auto-approved';
  if (item.approval_mode === 'manual_admin') return 'Manual approved';
  if (item.status === 'verified') return 'Verified';
  return item.status.replace(/_/g, ' ');
}

function approvalBadgeVariant(
  item: KycQueueItem,
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  if (item.status === 'in_progress') return 'warning';
  if (item.status === 'rejected') return 'error';
  if (item.approval_mode === 'auto_agent') return 'info';
  if (item.status === 'verified') return 'success';
  return 'neutral';
}

export function KYCReviewPage() {
  const [queue, setQueue] = useState<KycQueueItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selected, setSelected] = useState<string | undefined>();
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoApprove, setAutoApprove] = useState(true);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | undefined>();

  const load = useCallback((force = false) => {
    setLoading(true);
    cachedAdminApi
      .listKycQueue(force)
      .then((res) => {
        setQueue(res.data.queue);
        setPendingCount(res.data.pending_count ?? 0);
        setFromCache(res.fromCache);
        setCachedAt(res.cachedAt);
        setSelected((prev) => {
          if (prev && res.data.queue.some((k) => k.id === prev)) return prev;
          return res.data.queue[0]?.id;
        });
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load KYC queue'))
      .finally(() => setLoading(false));
  }, []);

  const loadSettings = useCallback(() => {
    adminApi
      .getKycSettings()
      .then((res) => setAutoApprove(res.auto_approve_agent))
      .catch(() => {
        /* default ON */
      });
  }, []);

  useEffect(() => {
    loadSettings();
    load(false);
  }, [load, loadSettings]);

  const filtered = useMemo(() => {
    if (filter === 'all') return queue;
    if (filter === 'pending') return queue.filter((k) => k.status === 'in_progress');
    if (filter === 'verified') return queue.filter((k) => k.status === 'verified');
    return queue.filter((k) => k.status === 'rejected');
  }, [queue, filter]);

  const item = queue.find((k) => k.id === selected);
  const isPending = item?.status === 'in_progress';
  const cacheLabel = fromCache ? formatCacheAge(cachedAt) : null;

  const setStatus = async (status: 'verified' | 'rejected') => {
    if (!item) return;
    setBusy(true);
    try {
      await adminApi.updateCustomerKyc(item.id, status);
      load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleAutoApprove = async () => {
    const next = !autoApprove;
    setSettingsBusy(true);
    setError(null);
    try {
      const res = await adminApi.updateKycSettings(next);
      setAutoApprove(res.auto_approve_agent);
      load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update auto-approve setting');
    } finally {
      setSettingsBusy(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="KYC Review"
        subtitle="All KYC submissions — Firestore cache (10 min) with live refresh"
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {cacheLabel ? (
              <Badge variant="info">Cached · {cacheLabel}</Badge>
            ) : null}
            <label className="flex items-center gap-2 text-sm font-medium text-lbg-gray-700 bg-white border border-lbg-gray-200 rounded-lg px-3 py-1.5 cursor-pointer">
              <Bot className="w-4 h-4 text-lbg-green" aria-hidden />
              <span>Auto-approve agent</span>
              <button
                type="button"
                role="switch"
                aria-checked={autoApprove}
                disabled={settingsBusy}
                onClick={() => void toggleAutoApprove()}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  autoApprove ? 'bg-lbg-green' : 'bg-lbg-gray-300'
                } ${settingsBusy ? 'opacity-60' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    autoApprove ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
            <Button size="sm" variant="outline" onClick={() => load(true)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant={autoApprove ? 'success' : 'warning'}>
              {autoApprove ? 'Agent ON' : 'Agent OFF'}
              {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
            </Badge>
          </div>
        }
      />

      {autoApprove ? (
        <Card className="mb-4 border-lbg-green/30 bg-lbg-green-light/20">
          <p className="text-sm text-lbg-gray-700">
            <strong>Auto-approve agent is on (default).</strong> New KYC submissions are verified
            immediately and appear here as <em>Auto-approved</em>.
          </p>
        </Card>
      ) : (
        <Card className="mb-4 border-amber-200 bg-amber-50/80">
          <p className="text-sm text-lbg-gray-700">
            <strong>Manual review mode.</strong> New submissions stay pending until you approve or
            reject them.
          </p>
        </Card>
      )}

      {error ? (
        <p className="text-sm text-red-600 font-semibold mb-4" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ['all', `All (${queue.length})`],
            ['pending', `Pending (${queue.filter((k) => k.status === 'in_progress').length})`],
            ['verified', `Approved (${queue.filter((k) => k.status === 'verified').length})`],
            ['rejected', `Rejected (${queue.filter((k) => k.status === 'rejected').length})`],
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <Card>
              <p className="text-sm text-lbg-gray-500">Loading KYC queue…</p>
            </Card>
          ) : null}
          {!loading && filtered.length === 0 ? (
            <Card>
              <p className="text-sm text-lbg-gray-500">No KYC records in this view.</p>
            </Card>
          ) : null}
          {filtered.map((k) => (
            <Card
              key={k.id}
              className={`cursor-pointer transition-colors ${selected === k.id ? 'border-lbg-green ring-1 ring-lbg-green/20' : 'hover:border-lbg-gray-200'}`}
              padding
            >
              <button type="button" onClick={() => setSelected(k.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{k.customer_name}</p>
                  <Badge variant={approvalBadgeVariant(k)}>{approvalLabel(k)}</Badge>
                </div>
                <p className="text-xs text-lbg-gray-400 mt-1">{k.document_type || 'Documents pending'}</p>
                <p className="text-[10px] text-lbg-gray-400 mt-2">{formatDate(k.submitted_at)}</p>
              </button>
            </Card>
          ))}
        </div>

        {item && (
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{item.customer_name}</h3>
                  <p className="text-sm text-lbg-gray-400">{item.email}</p>
                  <p className="text-xs text-lbg-gray-400">{item.mobile_number}</p>
                </div>
                <Badge variant={approvalBadgeVariant(item)}>{approvalLabel(item)}</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { l: 'Document', v: item.document_type || '—' },
                  { l: 'Submitted', v: formatDate(item.submitted_at) },
                  { l: 'Identity', v: item.progress?.identity ?? '—' },
                  { l: 'Liveness', v: item.progress?.liveness ?? '—' },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-lbg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-lbg-gray-400 uppercase font-medium">{l}</p>
                    <p className="text-sm font-semibold mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-bold mb-3">Uploaded Documents</h4>
              <div className="space-y-2 mb-6">
                {item.documents.map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-3 bg-lbg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-lbg-green" />
                      <span className="text-sm font-medium">{doc}</span>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                      <Eye className="w-4 h-4" /> Preview
                    </Button>
                  </div>
                ))}
              </div>

              {isPending ? (
                <div className="flex gap-3 flex-wrap">
                  <Button
                    className="flex-1 min-w-[140px]"
                    disabled={busy}
                    onClick={() => setStatus('verified')}
                  >
                    <Check className="w-4 h-4" /> Approve KYC
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 min-w-[140px]"
                    disabled={busy}
                    onClick={() => setStatus('rejected')}
                  >
                    <X className="w-4 h-4" /> Reject
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-lbg-gray-500">
                  This submission is <strong>{approvalLabel(item).toLowerCase()}</strong>. No further
                  action required.
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
