import { useCallback, useMemo, useState } from 'react';
import { ExternalLink, Loader2, Play, RotateCcw } from 'lucide-react';
import {
  CUSTOMER_APP_ORIGIN,
  runPlatformStackSimulation,
  STACK_SIM_STEPS,
  type StackSimLogLine,
  type StackSimStep,
} from '../../lib/platformStackSimulation';

function stepTone(state: StackSimStep['state']) {
  switch (state) {
    case 'done':
      return 'text-lbg-green-dark bg-lbg-green/10 border-lbg-green/30';
    case 'running':
      return 'text-lbg-black bg-amber-50 border-amber-200';
    case 'error':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'skipped':
      return 'text-lbg-gray-500 bg-lbg-gray-50 border-lbg-gray-200';
    default:
      return 'text-lbg-gray-600 bg-white border-lbg-gray-100';
  }
}

export function PlatformStackSimulator() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('ChangeMe123!');
  const [openTabs, setOpenTabs] = useState(true);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StackSimStep[]>(
    () => STACK_SIM_STEPS.map((s) => ({ ...s, state: 'pending' })),
  );
  const [logs, setLogs] = useState<StackSimLogLine[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setSteps(STACK_SIM_STEPS.map((s) => ({ ...s, state: 'pending' })));
    setLogs([]);
    setSummary(null);
    setError(null);
  }, []);

  const appendLog = useCallback((line: StackSimLogLine) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  const onStep = useCallback((step: StackSimStep) => {
    setSteps((prev) => prev.map((s) => (s.id === step.id ? step : s)));
    if (step.state === 'running') {
      appendLog({ at: new Date().toISOString(), level: 'info', text: `→ ${step.label}` });
    } else if (step.state === 'done' && step.detail) {
      appendLog({ at: new Date().toISOString(), level: 'ok', text: step.detail });
    }
  }, [appendLog]);

  const run = useCallback(async () => {
    reset();
    setRunning(true);
    try {
      const result = await runPlatformStackSimulation({
        customerEmail: email.trim() || undefined,
        customerPassword: password,
        registerNew: !email.trim(),
        openTabs,
        onStep,
        onLog: appendLog,
      });
      const creds =
        result.password
          ? `Customer credentials: ${result.email} / ${result.password}`
          : `Customer: ${result.email}`;
      setSummary(
        `${creds}. Policy ${result.policyId ?? '—'}, claim ${result.claimId ?? '—'}, wallet £${result.balanceAfterClaim?.toFixed(2) ?? '—'}.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      appendLog({ at: new Date().toISOString(), level: 'error', text: message });
    } finally {
      setRunning(false);
    }
  }, [appendLog, email, onStep, openTabs, password, reset]);

  const doneCount = useMemo(() => steps.filter((s) => s.state === 'done').length, [steps]);

  return (
    <div className="stack-sim-panel">
      <div className="stack-sim-header">
        <div>
          <h3 className="text-sm font-bold text-lbg-black">Live stack simulation</h3>
          <p className="text-xs text-lbg-gray-500 mt-0.5">
            Runs premium purchase, admin mint, claim, and payout via APIs — opens customer ({CUSTOMER_APP_ORIGIN}) and
            admin tabs at each stage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="stack-sim-btn stack-sim-btn--ghost"
            onClick={reset}
            disabled={running}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
            Reset
          </button>
          <button
            type="button"
            className="stack-sim-btn stack-sim-btn--primary"
            onClick={() => void run()}
            disabled={running}
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Play className="w-4 h-4" aria-hidden />}
            {running ? 'Running…' : 'Simulate'}
          </button>
        </div>
      </div>

      <div className="stack-sim-fields">
        <label className="stack-sim-field">
          <span>Customer email (optional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Same as localhost:5174 session, or blank for new demo user"
            disabled={running}
          />
        </label>
        <label className="stack-sim-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={running}
          />
        </label>
        <label className="stack-sim-check">
          <input
            type="checkbox"
            checked={openTabs}
            onChange={(e) => setOpenTabs(e.target.checked)}
            disabled={running}
          />
          Open customer &amp; admin tabs during run
        </label>
      </div>

      {error ? (
        <p className="stack-sim-error" role="alert">{error}</p>
      ) : null}
      {summary ? (
        <p className="stack-sim-success">{summary}</p>
      ) : null}

      <p className="text-xs text-lbg-gray-500 mb-2">
        Progress {doneCount}/{steps.length}
      </p>

      <ol className="stack-sim-steps" aria-label="Simulation steps">
        {steps.map((step) => (
          <li key={step.id} className={`stack-sim-step ${stepTone(step.state)}`}>
            <span className="stack-sim-step-label">{step.label}</span>
            {step.detail ? <span className="stack-sim-step-detail">{step.detail}</span> : null}
          </li>
        ))}
      </ol>

      {logs.length > 0 ? (
        <div className="stack-sim-log-wrap">
          <p className="text-xs font-semibold text-lbg-gray-600 mb-1">Log</p>
          <pre className="stack-sim-log" aria-live="polite">
            {logs.map((l) => `[${l.level}] ${l.text}`).join('\n')}
          </pre>
        </div>
      ) : null}

      <p className="text-xs text-lbg-gray-500 mt-3 flex items-center gap-1">
        <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
        Customer app must be running at {CUSTOMER_APP_ORIGIN}. Admin APIs use your current admin session.
      </p>
    </div>
  );
}
