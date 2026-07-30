import { useEffect } from 'react';
import { Terminal, X } from 'lucide-react';
import { Button } from './ui';
import type { PhaseTestStep } from '../data/cantonKitBlueprint';

type Props = {
  open: boolean;
  onClose: () => void;
  phaseLabel: string;
  title?: string;
  subtitle: string;
  steps: PhaseTestStep[];
};

export function PhaseTestModal({
  open,
  onClose,
  phaseLabel,
  title = 'How to test locally',
  subtitle,
  steps,
}: Props) {
  const titleId = `phase-${phaseLabel.toLowerCase().replace(/\s+/g, '-')}-test-title`;

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
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-lbg-gray-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-lbg-green">{phaseLabel}</p>
            <h2 id={titleId} className="mt-1 text-xl font-bold text-lbg-black">{title}</h2>
            <p className="mt-1 text-sm text-lbg-gray-500">{subtitle}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-lbg-gray-50"
            onClick={onClose}
            aria-label="Close test guide"
          >
            <X className="w-5 h-5 text-lbg-gray-500" aria-hidden />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-xl border border-lbg-gray-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-lbg-gray-400 mb-1">
                Step {index + 1}
              </p>
              <h3 className="font-semibold text-lbg-black">{step.title}</h3>
              <p className="text-sm text-lbg-gray-600 mt-1">{step.description}</p>
              {step.commands?.length ? (
                <div className="mt-3 rounded-lg bg-lbg-gray-50 border border-lbg-gray-100 p-3">
                  <p className="text-xs font-semibold text-lbg-gray-500 flex items-center gap-1 mb-2">
                    <Terminal className="w-3.5 h-3.5" aria-hidden />
                    Commands
                  </p>
                  <pre className="text-xs font-mono text-lbg-gray-700 whitespace-pre-wrap break-all">
                    {step.commands.join('\n')}
                  </pre>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="border-t border-lbg-gray-100 p-4 flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
