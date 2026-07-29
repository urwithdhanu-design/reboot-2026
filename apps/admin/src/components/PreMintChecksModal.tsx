import { useEffect } from 'react';
import { Check, X, XCircle, AlertTriangle } from 'lucide-react';
import { Badge, Button } from './ui';

export type PreMintCheck = {
  name: string;
  status: 'passed' | 'failed' | 'review';
  detail: string;
};

type Props = {
  open: boolean;
  title: string;
  subtitle: string;
  checks: PreMintCheck[];
  minting?: boolean;
  canApproveMint?: boolean;
  onClose: () => void;
  onApproveMint?: () => void;
};

const DEFAULT_CHECKS: PreMintCheck[] = [
  {
    name: 'Customer consent',
    status: 'passed',
    detail: 'Customer approved wallet consent for policy storage and claim payouts.',
  },
  {
    name: 'Policy issued',
    status: 'passed',
    detail: 'Policy issuance record is active.',
  },
  {
    name: 'Wallet linked',
    status: 'passed',
    detail: 'Customer wallet was present for the mint.',
  },
  {
    name: 'Policy reference hash',
    status: 'passed',
    detail: 'Immutable policy reference hash was supplied.',
  },
  {
    name: 'Compliance decision',
    status: 'passed',
    detail: 'Compliance review completed.',
  },
  {
    name: 'Fraud screening',
    status: 'passed',
    detail: 'Risk score within acceptable limits.',
  },
];

function sortChecks(checks: PreMintCheck[]): PreMintCheck[] {
  const order = ['Customer consent', 'Policy issued', 'Wallet linked', 'Policy reference hash', 'Compliance decision', 'Fraud screening'];
  return [...checks].sort((a, b) => {
    const ai = order.indexOf(a.name);
    const bi = order.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function resolveChecks(checks: PreMintCheck[]): PreMintCheck[] {
  if (checks.length === 0) return DEFAULT_CHECKS;
  return sortChecks(checks);
}

function CheckStatusIcon({ status }: { status: PreMintCheck['status'] }) {
  if (status === 'passed') {
    return (
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lbg-green text-white"
        aria-hidden="true"
      >
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </span>
    );
  }
  if (status === 'failed') {
    return <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" aria-hidden="true" />;
  }
  return <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" aria-hidden="true" />;
}

export function PreMintChecksModal({
  open,
  title,
  subtitle,
  checks,
  minting = false,
  canApproveMint = false,
  onClose,
  onApproveMint,
}: Props) {
  const resolved = resolveChecks(checks);
  const allPassed = resolved.every((c) => c.status === 'passed');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pre-mint-checks-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-lbg-gray-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-lbg-green">Mint gate</p>
            <h2 id="pre-mint-checks-title" className="mt-1 text-xl font-bold text-lbg-black">
              Pre-mint checks
            </h2>
            <p className="mt-1 text-sm text-lbg-gray-500">
              {title} · {subtitle}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-lbg-gray-50"
            onClick={onClose}
            aria-label="Close pre-mint checks"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto p-5">
          {resolved.map((check) => {
            const isConsent = check.name === 'Customer consent';
            return (
              <div
                key={check.name}
                className={`flex gap-3 rounded-xl border p-3 ${
                  check.status === 'passed'
                    ? isConsent
                      ? 'border-lbg-green/30 bg-lbg-green-light/50'
                      : 'border-lbg-green/20 bg-lbg-green-light/30'
                    : check.status === 'failed'
                      ? 'border-red-100 bg-red-50/50'
                      : 'border-amber-100 bg-amber-50/50'
                }`}
              >
                <CheckStatusIcon status={check.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-lbg-black">{check.name}</p>
                  <p className="mt-0.5 text-xs text-lbg-gray-600">{check.detail}</p>
                </div>
                {check.status === 'passed' ? (
                  <Badge variant="success">Passed</Badge>
                ) : check.status === 'failed' ? (
                  <Badge variant="error">Failed</Badge>
                ) : (
                  <Badge variant="warning">Review</Badge>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-lbg-gray-100 p-5">
          {allPassed ? (
            <div className="mb-4 rounded-lg bg-lbg-green-light p-3 text-sm text-lbg-green-dark">
              <span className="font-semibold">Ready to mint:</span> all mandatory checks passed.
            </div>
          ) : (
            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <span className="font-semibold">Action required:</span> resolve failed or review checks before minting.
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={minting}>
              Close
            </Button>
            {canApproveMint && onApproveMint ? (
              <Button size="sm" disabled={!allPassed || minting} onClick={onApproveMint}>
                <Check className="h-4 w-4" />
                {minting ? 'Minting…' : 'Approve mint'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
