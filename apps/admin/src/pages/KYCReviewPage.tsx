import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, X, Eye, FileText, RefreshCw, Bot, ShieldCheck } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, FilterTabs, AlertBanner, Badge, Button, TablePagination, usePaginatedList } from '../components/ui';
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

  const kycList = usePaginatedList(filtered, {
    defaultSortKey: 'submitted_at',
    defaultSortDir: 'desc',
    pageSize: 8,
  });

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
        icon={ShieldCheck}
        title="KYC review"
        subtitle="Identity verification queue — auto-approve agent or manual adjudication"
        metrics={[
          { label: 'Submissions', value: queue.length },
          { label: 'Pending', value: queue.filter((k) => k.status === 'in_progress').length, tone: 'warning' },
          { label: 'Verified', value: queue.filter((k) => k.status === 'verified').length, tone: 'success' },
          { label: 'Rejected', value: queue.filter((k) => k.status === 'rejected').length, tone: 'danger' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {cacheLabel ? (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
                Cached · {cacheLabel}
              </span>
            ) : null}
            <label className="flex items-center gap-2 text-sm font-medium text-white/90 bg-white/10 border border-white/25 rounded-lg px-3 py-1.5 cursor-pointer backdrop-blur-sm">
              <Bot className="w-4 h-4" aria-hidden />
              <span>Auto-approve</span>
              <button
                type="button"
                role="switch"
                aria-checked={autoApprove}
                disabled={settingsBusy}
                onClick={() => void toggleAutoApprove()}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  autoApprove ? 'bg-white' : 'bg-white/30'
                } ${settingsBusy ? 'opacity-60' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow transition ${
                    autoApprove ? 'translate-x-5 bg-lbg-green' : 'translate-x-0 bg-white'
                  }`}
                />
              </button>
            </label>
            <Button size="sm" variant="hero" onClick={() => load(true)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <FilterTabs
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: `All (${queue.length})` },
          { value: 'pending', label: `Pending (${queue.filter((k) => k.status === 'in_progress').length})` },
          { value: 'verified', label: `Approved (${queue.filter((k) => k.status === 'verified').length})` },
          { value: 'rejected', label: `Rejected (${queue.filter((k) => k.status === 'rejected').length})` },
        ]}
      />

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
          {!loading && filtered.length > 0 ? (
            <div className="flex items-center justify-between gap-2 px-1">
              <label className="text-xs text-lbg-gray-500 flex items-center gap-2">
                Sort
                <select
                  value={`${kycList.sortKey}:${kycList.sortDir}`}
                  onChange={(e) => {
                    const [key, dir] = e.target.value.split(':') as [string, 'asc' | 'desc'];
                    kycList.setSort(key, dir);
                  }}
                  className="rounded-lg border border-lbg-gray-200 bg-white px-2 py-1 text-xs font-medium"
                >
                  <option value="submitted_at:desc">Newest first</option>
                  <option value="submitted_at:asc">Oldest first</option>
                  <option value="customer_name:asc">Name A–Z</option>
                  <option value="customer_name:desc">Name Z–A</option>
                  <option value="status:asc">Status</option>
                </select>
              </label>
            </div>
          ) : null}
          {kycList.pageItems.map((k) => (
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
          {!loading && filtered.length > 0 ? (
            <TablePagination
              page={kycList.page}
              pageSize={kycList.pageSize}
              totalItems={kycList.totalItems}
              totalPages={kycList.totalPages}
              onPageChange={kycList.setPage}
              onPageSizeChange={kycList.setPageSize}
              pageSizeOptions={[8, 16, 32]}
            />
          ) : null}
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
