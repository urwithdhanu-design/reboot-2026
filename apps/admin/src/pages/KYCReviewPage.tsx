import { useEffect, useState } from 'react';
import { Check, X, Eye, FileText } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { adminApi, type KycQueueItem } from '../api';

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function KYCReviewPage() {
  const [queue, setQueue] = useState<KycQueueItem[]>([]);
  const [selected, setSelected] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    adminApi
      .listKycQueue()
      .then((res) => {
        setQueue(res.queue);
        if (!selected && res.queue[0]) setSelected(res.queue[0].id);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load KYC queue'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = queue.find((k) => k.id === selected);

  const setStatus = async (status: 'verified' | 'rejected') => {
    if (!item) return;
    setBusy(true);
    try {
      await adminApi.updateCustomerKyc(item.id, status);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="KYC Review"
        subtitle="Customers with onboarding in progress (live from KYC service)"
        actions={<Badge variant="warning">{queue.length} in queue</Badge>}
      />

      {error ? (
        <p className="text-sm text-red-600 font-semibold mb-4" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {queue.length === 0 ? (
            <Card>
              <p className="text-sm text-lbg-gray-500">No customers awaiting KYC review.</p>
            </Card>
          ) : null}
          {queue.map((k) => (
            <Card
              key={k.id}
              className={`cursor-pointer transition-colors ${selected === k.id ? 'border-lbg-green ring-1 ring-lbg-green/20' : 'hover:border-lbg-gray-200'}`}
              padding
            >
              <button type="button" onClick={() => setSelected(k.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{k.customer_name}</p>
                  <Badge variant="warning">{k.status.replace(/_/g, ' ')}</Badge>
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
                <Badge variant="warning">{item.status.replace(/_/g, ' ')}</Badge>
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

              <div className="flex gap-3 flex-wrap">
                <Button className="flex-1 min-w-[140px]" disabled={busy} onClick={() => setStatus('verified')}>
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
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
