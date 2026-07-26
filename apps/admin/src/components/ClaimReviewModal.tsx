import { useEffect, useState } from 'react';
import { ExternalLink, FileText, MessageSquare, X } from 'lucide-react';
import { adminApi, type AdminClaimRow, type ClaimDocumentRow, type ClaimQueryRow, type InternalPolicyRecord } from '../api';
import { Badge, Button } from './ui';

type Props = {
  claim: AdminClaimRow | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onReview: () => Promise<void>;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onSendQuery: (message: string, requiresDocuments: boolean) => Promise<void>;
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWhen(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function ClaimReviewModal({
  claim,
  open,
  busy,
  onClose,
  onReview,
  onApprove,
  onReject,
  onSendQuery,
}: Props) {
  const [documents, setDocuments] = useState<ClaimDocumentRow[]>(claim?.documents ?? []);
  const [queries, setQueries] = useState<ClaimQueryRow[]>(claim?.queries ?? []);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryMessage, setQueryMessage] = useState('');
  const [requiresDocuments, setRequiresDocuments] = useState(true);
  const [sendingQuery, setSendingQuery] = useState(false);
  const [policyCoverage, setPolicyCoverage] = useState<InternalPolicyRecord | null>(null);

  useEffect(() => {
    if (!open || !claim) return;
    setDocuments(claim.documents ?? []);
    setQueries(claim.queries ?? []);
    setError(null);
    setQueryMessage('');
    setRequiresDocuments(true);
    setLoadingDocs(true);
    setLoadingQueries(true);
    setPolicyCoverage(null);

    adminApi
      .getInternalPolicy(claim.policy_ref)
      .then((res) => setPolicyCoverage(res))
      .catch(() => setPolicyCoverage(null));

    adminApi
      .listClaimDocuments(claim.id)
      .then((res) => setDocuments(res.documents))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load documents'))
      .finally(() => setLoadingDocs(false));

    adminApi
      .listClaimQueries(claim.id)
      .then((res) => setQueries(res.queries))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load queries'))
      .finally(() => setLoadingQueries(false));
  }, [open, claim]);

  if (!open || !claim) return null;

  const isManual = claim.source !== 'parametric';
  const isOpen = ['submitted', 'pending_approval', 'in_review', 'awaiting_customer'].includes(claim.status);
  const hasDocuments = documents.length > 0;
  const openQueryCount = queries.filter((q) => q.status === 'open').length;
  const hasOpenQueries = openQueryCount > 0;

  async function handleSendQuery() {
    const message = queryMessage.trim();
    if (!message) return;
    setSendingQuery(true);
    setError(null);
    try {
      await onSendQuery(message, requiresDocuments);
      const res = await adminApi.listClaimQueries(claim!.id);
      setQueries(res.queries);
      setQueryMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send query');
    } finally {
      setSendingQuery(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-lbg-gray-100">
          <div>
            <p className="text-xs font-semibold text-lbg-gray-400 uppercase tracking-wide">Claim review</p>
            <h2 className="text-xl font-bold text-lbg-black mt-1">{claim.id}</h2>
            <p className="text-sm text-lbg-gray-500 mt-1">
              {claim.customer_name} · {claim.policy_ref} · {claim.category}
            </p>
          </div>
          <button type="button" className="p-2 rounded-lg hover:bg-lbg-gray-50" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-lbg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-lbg-gray-400 uppercase">Amount claimed</p>
              <p className="font-bold text-lg">£{Number(claim.amount_claimed).toFixed(2)}</p>
            </div>
            <div className="bg-lbg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-lbg-gray-400 uppercase">Status</p>
              <Badge variant="warning">{claim.status.replace(/_/g, ' ')}</Badge>
              {hasOpenQueries ? (
                <p className="text-xs text-amber-700 mt-1">{openQueryCount} open query(s)</p>
              ) : null}
            </div>
          </div>

          {claim.description ? (
            <div>
              <p className="text-sm font-semibold text-lbg-black mb-1">Customer description</p>
              <p className="text-sm text-lbg-gray-600 bg-lbg-gray-50 rounded-lg p-3">{claim.description}</p>
            </div>
          ) : null}

          {policyCoverage?.coverage_summary ? (
            <div className="bg-lbg-green-light/40 border border-lbg-green/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-lbg-black mb-1">Policy coverage</p>
              <p className="text-sm text-lbg-gray-600">{policyCoverage.coverage_summary}</p>
              <p className="text-xs text-lbg-gray-500 mt-1">
                {policyCoverage.cover_expires_at
                  ? `Expires ${formatWhen(policyCoverage.cover_expires_at)}`
                  : null}
                {policyCoverage.coverage_limit_gbp != null
                  ? ` · Limit £${Number(policyCoverage.coverage_limit_gbp).toLocaleString('en-GB')}`
                  : null}
                {policyCoverage.coverage_expired ? ' · EXPIRED' : ''}
              </p>
            </div>
          ) : null}

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-lbg-black">Supporting documents</p>
              <span className="text-xs text-lbg-gray-400">{documents.length} file(s)</span>
            </div>
            {loadingDocs ? <p className="text-sm text-lbg-gray-500">Loading documents…</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {!loadingDocs && documents.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                {isManual
                  ? 'No documents uploaded yet. Request evidence from the customer before approving.'
                  : 'Parametric auto-claim — no customer documents required.'}
              </p>
            ) : null}
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 border border-lbg-gray-100 rounded-lg p-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-lbg-green shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.label || doc.file_name}</p>
                      <p className="text-xs text-lbg-gray-400 truncate">
                        {doc.file_name} · {formatBytes(doc.file_size)} · {formatWhen(doc.uploaded_at)}
                        {doc.query_id ? ` · query ${doc.query_id}` : ''}
                      </p>
                    </div>
                  </div>
                  <a
                    href={adminApi.claimDocumentContentUrl(claim.id, doc.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-lbg-green hover:underline shrink-0"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {isManual ? (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-lbg-black inline-flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  Clarification queries
                </p>
                <span className="text-xs text-lbg-gray-400">{queries.length} total</span>
              </div>
              {loadingQueries ? <p className="text-sm text-lbg-gray-500">Loading queries…</p> : null}
              {queries.length === 0 && !loadingQueries ? (
                <p className="text-sm text-lbg-gray-500 bg-lbg-gray-50 rounded-lg p-3">
                  No queries yet. Ask the customer for clarification or additional documents before approving.
                </p>
              ) : null}
              <ul className="space-y-2 mb-4">
                {queries.map((query) => (
                  <li
                    key={query.id}
                    className={`border rounded-lg p-3 text-sm ${
                      query.status === 'open'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-lbg-gray-100 bg-lbg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs text-lbg-gray-500">{query.id}</span>
                      <Badge variant={query.status === 'open' ? 'warning' : 'success'}>{query.status}</Badge>
                    </div>
                    <p className="font-medium text-lbg-black">Admin: {query.admin_message}</p>
                    {query.requires_documents ? (
                      <p className="text-xs text-amber-700 mt-1">Documents required</p>
                    ) : null}
                    {query.customer_reply ? (
                      <p className="text-lbg-gray-600 mt-2">
                        <span className="font-medium">Customer:</span> {query.customer_reply}
                      </p>
                    ) : null}
                    <p className="text-[10px] text-lbg-gray-400 mt-2">
                      Sent {formatWhen(query.created_at)}
                      {query.answered_at ? ` · Answered ${formatWhen(query.answered_at)}` : ''}
                      {(query.document_count ?? 0) > 0 ? ` · ${query.document_count} doc(s)` : ''}
                    </p>
                  </li>
                ))}
              </ul>

              {isOpen ? (
                <div className="border border-lbg-gray-100 rounded-lg p-3 space-y-3">
                  <p className="text-sm font-semibold text-lbg-black">Send new query</p>
                  <textarea
                    className="w-full min-h-[88px] rounded-lg border border-lbg-gray-200 p-3 text-sm"
                    placeholder="Ask for clarification or list the documents you need…"
                    value={queryMessage}
                    onChange={(e) => setQueryMessage(e.target.value)}
                    disabled={busy || sendingQuery}
                  />
                  <label className="flex items-center gap-2 text-sm text-lbg-gray-600">
                    <input
                      type="checkbox"
                      checked={requiresDocuments}
                      onChange={(e) => setRequiresDocuments(e.target.checked)}
                      disabled={busy || sendingQuery}
                    />
                    Customer must attach documents before replying
                  </label>
                  <Button
                    variant="outline"
                    disabled={busy || sendingQuery || !queryMessage.trim()}
                    onClick={() => void handleSendQuery()}
                  >
                    {sendingQuery ? 'Sending…' : 'Send query to customer'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="p-5 border-t border-lbg-gray-100 flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Close
          </Button>
          {isOpen && claim.status !== 'in_review' && claim.status !== 'awaiting_customer' ? (
            <Button variant="outline" disabled={busy} onClick={() => void onReview()}>
              Mark in review
            </Button>
          ) : null}
          {isOpen ? (
            <>
              <Button variant="outline" disabled={busy} onClick={() => void onReject()}>
                Reject
              </Button>
              <Button
                disabled={busy || (isManual && !hasDocuments) || hasOpenQueries || policyCoverage?.coverage_expired}
                onClick={() => void onApprove()}
                title={
                  policyCoverage?.coverage_expired
                    ? 'Policy coverage has expired'
                    : hasOpenQueries
                      ? 'Resolve open customer queries before approving'
                      : isManual && !hasDocuments
                        ? 'Upload documents required before approval'
                        : undefined
                }
              >
                {busy ? 'Processing…' : 'Approve & pay'}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
