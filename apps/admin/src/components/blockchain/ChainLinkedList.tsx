import { ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { InsuranceChainBlock } from '../../api';
import { Badge } from '../ui';

function shortHash(hash: string, head = 8, tail = 6) {
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

type Props = {
  blocks: InsuranceChainBlock[];
};

export function ChainLinkedList({ blocks }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (value: string) => {
    void navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 2000);
  };

  if (blocks.length === 0) {
    return <p className="text-sm text-lbg-gray-500 py-6 text-center">No blocks mined yet.</p>;
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-stretch gap-0 min-w-max px-2">
        {blocks.map((block, index) => (
          <div key={block.height} className="flex items-center">
            <div
              className={`w-56 shrink-0 rounded-xl border-2 p-4 shadow-sm ${
                block.height === 0
                  ? 'border-lbg-purple/40 bg-lbg-purple-light/20'
                  : 'border-lbg-green/30 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase text-lbg-gray-500">
                  {block.height === 0 ? 'Genesis' : `Block #${block.height}`}
                </span>
                <Badge variant={block.transaction_count > 0 ? 'success' : 'neutral'}>
                  {block.transaction_count} tx
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => copy(block.hash)}
                className="flex items-center gap-1 font-mono text-[10px] text-lbg-green hover:underline w-full text-left"
                title={block.hash}
              >
                {shortHash(block.hash)}
                {copied === block.hash ? (
                  <Check className="w-3 h-3 shrink-0" aria-hidden />
                ) : (
                  <Copy className="w-3 h-3 shrink-0 opacity-60" aria-hidden />
                )}
              </button>
              <p className="text-[10px] text-lbg-gray-400 mt-2 truncate" title={block.previous_hash}>
                prev {shortHash(block.previous_hash, 6, 4)}
              </p>
              <p className="text-[10px] text-lbg-gray-400 truncate" title={block.merkle_root}>
                merkle {shortHash(block.merkle_root, 6, 4)}
              </p>
              <p className="text-[10px] text-lbg-gray-500 mt-2">{block.validator_id}</p>
              {block.transactions.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-lbg-gray-100 pt-2">
                  {block.transactions.slice(0, 3).map((tx) => (
                    <li key={tx.id} className="text-[10px] text-lbg-gray-600 truncate">
                      <span className="font-semibold">{tx.type}</span>
                      {tx.fraud_score != null && (
                        <span className="text-lbg-gray-400"> · fraud {tx.fraud_score}</span>
                      )}
                    </li>
                  ))}
                  {block.transactions.length > 3 && (
                    <li className="text-[10px] text-lbg-gray-400">+{block.transactions.length - 3} more</li>
                  )}
                </ul>
              )}
            </div>
            {index < blocks.length - 1 && (
              <div className="flex flex-col items-center px-2 text-lbg-green shrink-0" aria-hidden>
                <ArrowRight className="w-6 h-6" />
                <span className="text-[9px] uppercase tracking-wide text-lbg-gray-400">hash link</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
