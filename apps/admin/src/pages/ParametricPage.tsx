import { useCallback, useEffect, useState } from 'react';
import { Plane, Plus, Radio, RefreshCw, Satellite, Zap, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  ContentPanel,
  PageHeader,
  StatCard,
} from '../components/ui';
import {
  adminApi,
  type ParametricOracleStatus,
  type ParametricRuleRow,
  type ParametricTriggerRow,
} from '../api';
import { formatGBP, formatWhen } from '../utils/format';

const oracleStatusBadge: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  monitoring: 'info',
  triggered: 'success',
  no_data: 'warning',
  error: 'error',
  idle: 'neutral',
};

function formatOracleStatus(status?: string) {
  return (status ?? 'idle').replace(/_/g, ' ');
}

export function ParametricPage() {
  const [rules, setRules] = useState<ParametricRuleRow[]>([]);
  const [triggers, setTriggers] = useState<ParametricTriggerRow[]>([]);
  const [oracleStatus, setOracleStatus] = useState<ParametricOracleStatus | null>(null);
  const [policies, setPolicies] = useState<Array<{ policy_ref?: string; product_title?: string; mint_status?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [policyRef, setPolicyRef] = useState('');
  const [flightNumber, setFlightNumber] = useState('BA117');
  const [travelDate, setTravelDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [delayMinutes, setDelayMinutes] = useState('270');
  const [threshold, setThreshold] = useState('240');
  const [payout, setPayout] = useState('250');
  const [cancellationPayout, setCancellationPayout] = useState('150');
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [selectedCancellationRuleId, setSelectedCancellationRuleId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, triggersRes, policiesRes, oracleRes] = await Promise.all([
        adminApi.listParametricRules(),
        adminApi.listParametricTriggers(),
        adminApi.listPolicies(),
        adminApi.getParametricOracleStatus(),
      ]);
      setRules(rulesRes.rules);
      setTriggers(triggersRes.triggers);
      setOracleStatus(oracleRes);
      const minted = policiesRes.policies.filter((p) => p.mint_status === 'MINTED');
      setPolicies(minted);
      setPolicyRef((prev) => prev || (minted[0]?.policy_ref ?? ''));
      setSelectedRuleId((prev) => prev || (rulesRes.rules.find((r) => r.rule_type === 'flight_delay')?.id ?? rulesRes.rules[0]?.id ?? ''));
      setSelectedCancellationRuleId(
        (prev) =>
          prev ||
          (rulesRes.rules.find((r) => r.rule_type === 'trip_cancellation')?.id ?? ''),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parametric data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const rule = rules.find((r) => r.id === selectedRuleId);
    if (!rule) return;
    if (rule.flight_number) setFlightNumber(rule.flight_number);
    if (rule.travel_date) setTravelDate(rule.travel_date);
    if (rule.threshold != null) setThreshold(String(rule.threshold));
    if (rule.payout_amount != null) setPayout(String(rule.payout_amount));
    if (rule.policy_ref) setPolicyRef(rule.policy_ref);
  }, [rules, selectedRuleId]);

  async function createFlightDelayRule() {
    if (!policyRef.trim()) {
      setError('Select a Canton-minted policy');
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const rule = await adminApi.createParametricRule({
        name: `Flight delay · ${flightNumber}`,
        rule_type: 'flight_delay',
        policy_ref: policyRef.trim(),
        flight_number: flightNumber.trim(),
        travel_date: travelDate,
        threshold: Number(threshold),
        payout_amount: Number(payout),
        product_category: 'Travel',
      });
      setSelectedRuleId(rule.id);
      setSuccess(
        rule.updated
          ? `Rule ${rule.id} updated — threshold ≥${rule.threshold} min, payout ${formatGBP(rule.payout_amount)}`
          : `Rule ${rule.id} created — oracle monitoring started for ${rule.flight_number}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create rule');
    } finally {
      setBusy(false);
    }
  }

  async function pollOracle(ruleId?: string) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = ruleId
        ? await adminApi.triggerParametricOracle({ rule_id: ruleId })
        : await adminApi.pollParametricOracle(ruleId ? { rule_id: ruleId } : undefined);

      if (result.claim_created && result.claim_id) {
        setSuccess(
          `Oracle auto-triggered claim ${result.claim_id} — ${result.oracle?.delay_minutes ?? '—'} min delay (${result.oracle?.provider})`,
        );
      } else if (result.triggered && result.triggered > 0) {
        setSuccess(`Oracle poll complete — ${result.triggered} claim(s) auto-settled`);
      } else if (result.oracle?.flight_found) {
        setSuccess(
          `Live oracle: ${result.oracle.delay_minutes} min delay (${result.oracle.flight_status}) — ${result.message ?? 'below threshold'}`,
        );
      } else if (result.polled !== undefined) {
        setSuccess(
          `Polled ${result.polled} rule(s) — ${result.triggered ?? 0} triggered, ${result.skipped_already_settled ?? 0} already settled`,
        );
      } else {
        setSuccess(result.message ?? 'Oracle poll complete');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oracle poll failed');
    } finally {
      setBusy(false);
    }
  }

  async function simulateDelay(ruleIdOverride?: string) {
    const ruleId = ruleIdOverride || selectedRuleId || flightRules[0]?.id;
    if (!ruleId) {
      setError('Create a flight delay rule first');
      return;
    }
    const rule = rules.find((r) => r.id === ruleId);
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await adminApi.simulateFlightDelay({
        rule_id: ruleId,
        flight_number: (rule?.flight_number || flightNumber).trim(),
        travel_date: rule?.travel_date || travelDate,
        flight_delay_minutes: Number(delayMinutes),
        threshold: Number(rule?.threshold ?? threshold),
        payout_amount: Number(rule?.payout_amount ?? payout),
      });
      if (result.claim_created && result.claim_id) {
        setSuccess(
          `Flight delay simulation on ${ruleId} — claim ${result.claim_id} auto-settled (${result.status}). Threshold was ≥${result.threshold ?? threshold} min.`,
        );
      } else if (result.status === 'already_settled') {
        setSuccess(result.message ?? 'Flight delay claim already settled for this rule and travel date');
      } else if (result.status === 'blocked') {
        setError(result.message ?? 'Flight delay blocked — trip cancellation already claimed for this flight and date');
      } else if (result.matched) {
        setSuccess(result.message ?? 'Threshold matched');
      } else {
        setError(
          result.message
            ?? `Threshold not met — observed ${result.observed_value ?? delayMinutes} min below ≥${result.threshold ?? threshold} min`,
        );
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setBusy(false);
    }
  }

  async function createTripCancellationRule() {
    if (!policyRef.trim()) {
      setError('Select a Canton-minted policy');
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const rule = await adminApi.createParametricRule({
        name: `Trip cancellation · ${flightNumber}`,
        rule_type: 'trip_cancellation',
        policy_ref: policyRef.trim(),
        flight_number: flightNumber.trim(),
        travel_date: travelDate,
        threshold: 1,
        payout_amount: Number(cancellationPayout),
        product_category: 'Travel',
      });
      setSelectedCancellationRuleId(rule.id);
      setSuccess(
        rule.updated
          ? `Cancellation rule ${rule.id} updated for ${policyRef.trim()}`
          : `Cancellation rule ${rule.id} created for ${policyRef.trim()}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create cancellation rule');
    } finally {
      setBusy(false);
    }
  }

  async function simulateCancellation(ruleIdOverride?: string) {
    const ruleId = ruleIdOverride || selectedCancellationRuleId || cancellationRules[0]?.id;
    if (!ruleId) {
      setError('Create or select a trip cancellation rule first');
      return;
    }
    const rule = rules.find((r) => r.id === ruleId);
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await adminApi.simulateTripCancellation({
        rule_id: ruleId,
        flight_number: (rule?.flight_number || flightNumber).trim(),
        travel_date: rule?.travel_date || travelDate,
      });
      if (result.claim_created && result.claim_id) {
        setSuccess(
          `Trip cancellation auto-triggered — claim ${result.claim_id} auto-settled (${result.status}).`,
        );
      } else if (result.status === 'already_settled') {
        setSuccess(result.message ?? 'Trip cancellation claim already settled for this rule and travel date');
      } else if (result.status === 'blocked') {
        setError(result.message ?? 'Trip cancellation blocked for this trip');
      } else if (result.matched) {
        setSuccess(result.message ?? 'Cancellation threshold matched');
      } else {
        setError(result.message ?? 'Simulation did not create a claim');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation simulation failed');
    } finally {
      setBusy(false);
    }
  }

  const flightRules = rules.filter((r) => r.rule_type === 'flight_delay' || r.metric === 'flight_delay_minutes');
  const cancellationRules = rules.filter(
    (r) => r.rule_type === 'trip_cancellation' || r.metric === 'trip_cancelled',
  );
  const autoSettled = triggers.filter((t) => t.claim_created).length;
  const oracleTriggered = triggers.filter((t) => t.trigger_source === 'oracle_poll' && t.claim_created).length;

  return (
    <AdminLayout>
      <PageHeader
        icon={Radio}
        title="Parametric insurance"
        subtitle="Flight delay oracle and trip cancellation simulation for Canton-minted travel policies"
        metrics={[
          { label: 'Active rules', value: rules.filter((r) => r.active).length },
          { label: 'Oracle triggers', value: oracleTriggered, tone: 'success' },
          { label: 'Minted policies', value: policies.length },
        ]}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void pollOracle()} disabled={loading || busy}>
              <Satellite className="w-4 h-4" />
              Poll all
            </Button>
            <Button size="sm" variant="hero" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}
      {success ? <AlertBanner variant="success">{success}</AlertBanner> : null}

      <Card className="p-5 mb-6 border-lbg-green/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="font-bold text-lbg-black flex items-center gap-2">
              <Satellite className="w-4 h-4 text-lbg-green" />
              Flight delay oracle
            </h3>
            <p className="text-xs text-lbg-gray-400 mt-1">
              Provider: <span className="font-mono">{oracleStatus?.provider ?? '—'}</span>
              {' · '}
              Poll every {oracleStatus ? Math.round(oracleStatus.poll_interval_ms / 60_000) : '—'} min
            </p>
            <p className="text-sm text-lbg-gray-500 mt-2">{oracleStatus?.message}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={oracleStatus?.configured ? 'success' : 'warning'}>
              {oracleStatus?.configured ? 'API connected' : 'API key missing'}
            </Badge>
            <Badge variant={oracleStatus?.enabled ? 'info' : 'neutral'}>
              {oracleStatus?.enabled ? 'Polling enabled' : 'Polling disabled'}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Flight delay rules" value={String(flightRules.length)} change="Travel parametric" icon={Plane} trend="neutral" />
        <StatCard label="Cancellation rules" value={String(cancellationRules.length)} change="Trip cancellation" icon={XCircle} trend="neutral" />
        <StatCard label="Total auto payouts" value={String(autoSettled)} change="Settled on-chain + wallet" icon={Radio} trend="up" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h3 className="font-bold text-lbg-black mb-1 flex items-center gap-2">
            <Plus className="w-4 h-4 text-lbg-green" /> Create flight delay rule
          </h3>
          <p className="text-xs text-lbg-gray-400 mb-4">
            Binds to a Canton-minted policy. Oracle polls AviationStack/AeroDataBox when travel date arrives.
          </p>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="font-medium">Policy (minted on Canton)</span>
              <select
                className="mt-1 w-full border border-lbg-gray-100 rounded-lg px-3 py-2 text-sm"
                value={policyRef}
                onChange={(e) => setPolicyRef(e.target.value)}
              >
                <option value="">Select policy…</option>
                {policies.map((p) => (
                  <option key={p.policy_ref} value={p.policy_ref ?? ''}>
                    {p.policy_ref} · {p.product_title}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium">Flight number</span>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Travel date</span>
                <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium">Delay threshold (min)</span>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Payout (£)</span>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={payout} onChange={(e) => setPayout(e.target.value)} />
              </label>
            </div>
            <Button onClick={() => void createFlightDelayRule()} disabled={busy || !policyRef}>
              Save flight delay rule
            </Button>
            <p className="text-xs text-lbg-gray-500">
              Re-saving updates threshold and payout on the existing rule for this policy. Trip cancellation on the same
              flight and date blocks a later flight delay claim.
            </p>
          </div>
        </Card>

        <Card className="p-5 border-lbg-green/30 bg-lbg-green-light/10">
          <h3 className="font-bold text-lbg-black mb-1 flex items-center gap-2">
            <Satellite className="w-4 h-4 text-lbg-green" /> Live oracle poll
          </h3>
          <p className="text-xs text-lbg-gray-400 mb-4">
            Fetches real delay from the configured provider and auto-settles when delay ≥ threshold.
          </p>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="font-medium">Rule</span>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
              >
                <option value="">Select rule…</option>
                {flightRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.policy_ref} (≥{r.threshold} min → {formatGBP(r.payout_amount)})
                  </option>
                ))}
              </select>
            </label>
            <Button variant="hero" onClick={() => void pollOracle(selectedRuleId)} disabled={busy || !selectedRuleId}>
              {busy ? 'Polling oracle…' : 'Poll live flight delay'}
            </Button>
            <details className="text-xs text-lbg-gray-500">
              <summary className="cursor-pointer font-medium text-lbg-gray-600">Manual simulation (demo override)</summary>
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-lbg-gray-500">
                  Applies to rule <span className="font-mono">{selectedRuleId || '—'}</span>. Threshold and observed delay
                  are saved to the rule before simulating.
                </p>
                <label className="block text-sm">
                  <span className="font-medium">Delay threshold (min)</span>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Observed delay (minutes)</span>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={delayMinutes} onChange={(e) => setDelayMinutes(e.target.value)} />
                </label>
                <Button variant="outline" size="sm" onClick={() => void simulateDelay()} disabled={busy || !selectedRuleId}>
                  <Zap className="w-3 h-3" /> Simulate delay on selected rule
                </Button>
              </div>
            </details>
            <p className="text-xs text-lbg-gray-500">
              View auto-claims in <Link to="/claims" className="text-lbg-green font-semibold hover:underline">Claims</Link>.
            </p>
          </div>
        </Card>

        <Card className="p-5 border-amber-200/60 bg-amber-50/30 xl:col-span-2">
          <h3 className="font-bold text-lbg-black mb-1 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-amber-600" /> Trip cancellation
          </h3>
          <p className="text-xs text-lbg-gray-400 mb-4">
            Create a cancellation rule for a minted Travel Protect Plus policy, then simulate to auto-trigger
            ClaimInitiated and auto-settle — same flow as flight delay simulation.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-lbg-gray-700">1. Create cancellation rule</p>
              <label className="block text-sm">
                <span className="font-medium">Policy (minted on Canton)</span>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={policyRef}
                  onChange={(e) => setPolicyRef(e.target.value)}
                >
                  <option value="">Select policy…</option>
                  {policies.map((p) => (
                    <option key={p.policy_ref} value={p.policy_ref ?? ''}>
                      {p.policy_ref} · {p.product_title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="font-medium">Flight number</span>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Travel date</span>
                  <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium">Payout (£)</span>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={cancellationPayout} onChange={(e) => setCancellationPayout(e.target.value)} />
              </label>
              <Button onClick={() => void createTripCancellationRule()} disabled={busy || !policyRef}>
                <Plus className="w-4 h-4" /> Create cancellation rule
              </Button>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-lbg-gray-700">2. Simulate cancellation event</p>
              <label className="block text-sm">
                <span className="font-medium">Cancellation rule</span>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={selectedCancellationRuleId}
                  onChange={(e) => setSelectedCancellationRuleId(e.target.value)}
                >
                  <option value="">Select rule…</option>
                  {cancellationRules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.policy_ref} → {formatGBP(r.payout_amount)}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="hero"
                onClick={() => void simulateCancellation()}
                disabled={busy || !selectedCancellationRuleId}
              >
                <Zap className="w-4 h-4" /> Simulate trip cancellation
              </Button>
              <p className="text-xs text-lbg-gray-500">
                Publishes ClaimInitiated, records on Canton, creates an auto-approved claim, and credits the customer wallet.
                A prior flight delay claim does not block cancellation if policy coverage limit remains.
              </p>
              {cancellationRules.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-100/60 rounded-lg p-3">
                  No cancellation rules yet — create one using a minted travel policy on the left, or complete a
                  Travel Protect Plus quote with cancellation cover and mint on Canton (rules are provisioned automatically).
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      <ContentPanel title="Parametric rules" description="Oracle monitoring status per Canton-minted policy">
        {loading ? (
          <p className="p-6 text-sm text-lbg-gray-500">Loading…</p>
        ) : rules.length === 0 ? (
          <p className="p-6 text-sm text-lbg-gray-500">No rules yet — create a flight delay rule above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-lbg-gray-400 border-b">
                  <th className="py-2 pr-4">Rule</th>
                  <th className="py-2 pr-4">Flight</th>
                  <th className="py-2 pr-4">Oracle status</th>
                  <th className="py-2 pr-4">Observed</th>
                  <th className="py-2 pr-4">Threshold</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-lbg-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs font-mono text-lbg-gray-400">{r.id} · {r.policy_ref}</p>
                    </td>
                    <td className="py-3 pr-4">
                      {r.flight_number || '—'}
                      <p className="text-xs text-lbg-gray-400">{r.travel_date || 'any date'}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={oracleStatusBadge[r.oracle_status ?? 'idle'] ?? 'neutral'}>
                        {formatOracleStatus(r.oracle_status)}
                      </Badge>
                      {r.oracle_message ? (
                        <p className="text-[10px] text-lbg-gray-400 mt-1 max-w-[200px]">{r.oracle_message}</p>
                      ) : null}
                      {r.last_polled_at ? (
                        <p className="text-[10px] text-lbg-gray-400 mt-0.5">Polled {formatWhen(r.last_polled_at)}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 font-bold">
                      {r.rule_type === 'trip_cancellation' || r.metric === 'trip_cancelled'
                        ? 'Cancellation'
                        : r.last_observed_delay != null
                          ? `${r.last_observed_delay} min`
                          : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      {r.rule_type === 'trip_cancellation' || r.metric === 'trip_cancelled'
                        ? `Cancelled → ${formatGBP(r.payout_amount)}`
                        : `≥${r.threshold} min → ${formatGBP(r.payout_amount)}`}
                    </td>
                    <td className="py-3">
                      {r.rule_type === 'trip_cancellation' || r.metric === 'trip_cancelled' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            setSelectedCancellationRuleId(r.id);
                            void simulateCancellation(r.id);
                          }}
                        >
                          Simulate
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              setSelectedRuleId(r.id);
                              void simulateDelay(r.id);
                            }}
                          >
                            Simulate
                          </Button>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => void pollOracle(r.id)}>
                            Poll
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentPanel>

      <ContentPanel title="Trigger log" description="Oracle polls and auto-settlement outcomes" className="mt-6">
        {triggers.length === 0 ? (
          <p className="p-6 text-sm text-lbg-gray-500">No triggers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-lbg-gray-400 border-b">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Policy</th>
                  <th className="py-2 pr-4">Flight</th>
                  <th className="py-2 pr-4">Observed</th>
                  <th className="py-2 pr-4">Result</th>
                  <th className="py-2">Claim</th>
                </tr>
              </thead>
              <tbody>
                {triggers.map((t) => {
                  const isCancellation =
                    t.rule_type === 'trip_cancellation'
                    || rules.find((r) => r.id === t.rule_id)?.rule_type === 'trip_cancellation'
                    || rules.find((r) => r.id === t.rule_id)?.metric === 'trip_cancelled';
                  return (
                  <tr key={t.id} className="border-b border-lbg-gray-50">
                    <td className="py-3 pr-4 whitespace-nowrap">{formatWhen(t.triggered_at)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={t.trigger_source === 'oracle_poll' ? 'info' : 'neutral'}>
                        {t.trigger_source === 'oracle_poll' ? 'oracle' : 'simulation'}
                      </Badge>
                      {t.oracle_provider ? (
                        <p className="text-[10px] text-lbg-gray-400 mt-0.5">{t.oracle_provider}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">{t.policy_ref}</td>
                    <td className="py-3 pr-4">
                      {t.flight_number || '—'}
                      {t.flight_status ? (
                        <p className="text-[10px] text-lbg-gray-400">{t.flight_status}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">{isCancellation ? 'Trip cancelled' : `${t.observed_value} min`}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={t.claim_created ? 'success' : t.matched ? 'warning' : t.status === 'already_settled' ? 'info' : t.status === 'blocked' ? 'error' : 'neutral'}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-xs">
                      {t.claim_id ? (
                        <Link to="/claims" className="text-lbg-green hover:underline">{t.claim_id}</Link>
                      ) : '—'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ContentPanel>
    </AdminLayout>
  );
}
