import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, Play, Radio, TestTube2, TriangleAlert } from 'lucide-react';
import { Card, Badge } from '../ui';
import { runCantonKitTests, type CantonKitTestResult } from '../../data/cantonKitUnitTests';

type Filter = 'all' | 'unit' | 'live';

export function CantonKitTestRunner({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CantonKitTestResult[] | null>(null);

  const run = async (f: Filter) => {
    setFilter(f);
    setRunning(true);
    setResults(null);
    try {
      const out = await runCantonKitTests(f);
      setResults(out);
    } finally {
      setRunning(false);
    }
  };

  const passed = results?.filter((r) => r.pass).length ?? 0;
  const total = results?.length ?? 0;

  return (
    <Card className={`${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <TestTube2 className="w-5 h-5 text-lbg-green shrink-0" aria-hidden />
        <h3 className="font-bold text-lbg-black">Canton kit tests</h3>
        {results ? (
          <Badge variant={passed === total ? 'success' : 'warning'}>
            {passed}/{total} passed
          </Badge>
        ) : null}
      </div>

      <p className="text-sm text-lbg-gray-600 mb-4">
        Unit tests validate blueprint data and docs. Live smoke tests call the orchestrator Canton APIs
        (requires local-dev stack on :8088).
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          disabled={running}
          onClick={() => run('all')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-lbg-green text-white hover:bg-lbg-green-dark disabled:opacity-60"
        >
          {running && filter === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Run all
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => run('unit')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-lbg-gray-200 hover:bg-lbg-gray-50 disabled:opacity-60"
        >
          Unit only
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => run('live')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-lbg-gray-200 hover:bg-lbg-gray-50 disabled:opacity-60"
        >
          <Radio className="w-3.5 h-3.5" />
          Live smoke
        </button>
      </div>

      {results ? (
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={r.id}
              className={`flex gap-3 text-sm rounded-lg border p-3 ${r.pass ? 'border-lbg-green/30 bg-lbg-green-light/20' : 'border-amber-200 bg-amber-50/50'}`}
            >
              {r.pass ? (
                <CheckCircle2 className="w-4 h-4 text-lbg-green shrink-0 mt-0.5" aria-hidden />
              ) : (
                <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-lbg-black">{r.name}</span>
                  <Badge variant="neutral">{r.category}</Badge>
                  <span className="text-xs text-lbg-gray-400">{r.durationMs}ms</span>
                </div>
                <p className="text-lbg-gray-600 text-xs mt-0.5">{r.message}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : running ? (
        <div className="flex items-center gap-2 text-sm text-lbg-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Running tests…
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-lbg-gray-400">
          <Circle className="w-4 h-4" />
          No results yet — run tests to verify the kit.
        </div>
      )}
    </Card>
  );
}
