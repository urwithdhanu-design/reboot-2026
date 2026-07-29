import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Radio, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import {
  PageHeader,
  FilterTabs,
  ContentPanel,
  AlertBanner,
  Badge,
  Button,
} from '../components/ui';
import {
  adminApi,
  type ObservabilityEventRow,
  type ObservabilityServiceHealth,
  type ObservabilityTraceRow,
  type PlatformObservabilityDashboard,
} from '../api';

type Tab = 'services' | 'traces' | 'events';

const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  ok: 'success',
  degraded: 'warning',
  down: 'error',
};

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function PlatformObservabilityPage() {
  const [tab, setTab] = useState<Tab>('services');
  const [dash, setDash] = useState<PlatformObservabilityDashboard | null>(null);
  const [traces, setTraces] = useState<ObservabilityTraceRow[]>([]);
  const [events, setEvents] = useState<ObservabilityEventRow[]>([]);
  const [flow, setFlow] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);

  const load = useCallback(() => {
    Promise.all([
      adminApi.platformObservabilityDashboard(),
      adminApi.platformObservabilityTraces({ limit: 120 }),
      adminApi.platformObservabilityEvents({ limit: 120, flow: flow || undefined }),
    ])
      .then(([dashboard, traceRes, eventRes]) => {
        setDash(dashboard);
        setTraces(traceRes.traces);
        setEvents(eventRes.events);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load observability'))
      .finally(() => setLoading(false));
  }, [flow]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(load, 8000);
    return () => window.clearInterval(id);
  }, [live, load]);

  const services = useMemo(
    () => dash?.services ?? [],
    [dash],
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Platform observability"
        subtitle="Live service health, API traces, and domain events (Firestore-backed)"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              variant={live ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setLive((v) => !v)}
            >
              <Radio className="h-4 w-4 mr-1" />
              {live ? 'Live' : 'Paused'}
            </Button>
          </div>
        }
      />

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}

      {dash ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <ContentPanel className="p-4">
            <p className="text-xs text-lbg-muted">API traces</p>
            <p className="text-2xl font-semibold">{dash.trace_count}</p>
          </ContentPanel>
          <ContentPanel className="p-4">
            <p className="text-xs text-lbg-muted">Domain events</p>
            <p className="text-2xl font-semibold">{dash.event_count}</p>
          </ContentPanel>
          <ContentPanel className="p-4">
            <p className="text-xs text-lbg-muted">Services degraded</p>
            <p className="text-2xl font-semibold text-amber-700">{dash.services_degraded}</p>
          </ContentPanel>
          <ContentPanel className="p-4">
            <p className="text-xs text-lbg-muted">Storage</p>
            <p className="text-sm font-medium mt-1">
              {dash.firestore_enabled ? `Firestore · ${dash.firestore_project ?? ''}` : dash.storage_backend}
            </p>
          </ContentPanel>
        </div>
      ) : null}

      <FilterTabs
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: 'services', label: 'Services' },
          { value: 'traces', label: 'API traces' },
          { value: 'events', label: 'Domain events' },
        ]}
      />

      {tab === 'services' && (
        <ContentPanel className="mt-4 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-lbg-surface text-left text-xs uppercase text-lbg-muted">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">HTTP</th>
                <th className="px-4 py-3">Checked</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc: ObservabilityServiceHealth) => (
                <tr key={svc.service_id} className="border-t border-lbg-border/60">
                  <td className="px-4 py-3 font-medium">{svc.service_id}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[svc.status] ?? 'neutral'}>{svc.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{svc.latency_ms ?? '—'} ms</td>
                  <td className="px-4 py-3">{svc.http_status ?? '—'}</td>
                  <td className="px-4 py-3 text-lbg-muted">{formatWhen(svc.checked_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {services.length === 0 && !loading ? (
            <p className="p-6 text-sm text-lbg-muted text-center">
              Start observability-service on :8093 (local-dev.cmd start).
            </p>
          ) : null}
        </ContentPanel>
      )}

      {tab === 'traces' && (
        <ContentPanel className="mt-4 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-lbg-surface text-left text-xs uppercase text-lbg-muted">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">ms</th>
              </tr>
            </thead>
            <tbody>
              {traces.map((row, idx) => (
                <tr key={row.id ?? `${row.path}-${idx}`} className="border-t border-lbg-border/60">
                  <td className="px-4 py-3 whitespace-nowrap">{formatWhen(row.occurred_at)}</td>
                  <td className="px-4 py-3">{row.service_id}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{row.method}</span> {row.path}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={row.status_code >= 400 ? 'error' : 'success'}>{row.status_code}</Badge>
                  </td>
                  <td className="px-4 py-3">{row.duration_ms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ContentPanel>
      )}

      {tab === 'events' && (
        <ContentPanel className="mt-4 p-4">
          <label className="text-sm font-medium text-lbg-ink block mb-3">
            Flow filter
            <select
              className="mt-1 block w-full max-w-xs rounded-lg border border-lbg-border px-3 py-2 text-sm"
              value={flow}
              onChange={(e) => setFlow(e.target.value)}
            >
              <option value="">All flows</option>
              <option value="kyc">KYC</option>
              <option value="wallet">Wallet</option>
              <option value="policy">Policy</option>
              <option value="payment">Payment</option>
              <option value="claims">Claims</option>
              <option value="blockchain">Blockchain</option>
            </select>
          </label>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-lbg-surface text-left text-xs uppercase text-lbg-muted">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Flow</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {events.map((row, idx) => (
                  <tr key={row.id ?? `${row.event_type}-${idx}`} className="border-t border-lbg-border/60">
                    <td className="px-4 py-3">{formatWhen(row.occurred_at)}</td>
                    <td className="px-4 py-3">{row.flow_category ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{row.source_event_type ?? row.event_type}</td>
                    <td className="px-4 py-3 text-lbg-muted">
                      {row.policy_id || row.claim_id || row.quote_id || row.customer_id || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-lbg-muted">{row.source_publisher ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentPanel>
      )}

      {dash?.recent_errors && dash.recent_errors.length > 0 ? (
        <ContentPanel className="mt-4 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Recent API errors
          </h3>
          <ul className="mt-2 text-sm text-lbg-muted space-y-1">
            {dash.recent_errors.map((t, i) => (
              <li key={i}>
                {t.service_id} · {t.method} {t.path} → {t.status_code}
              </li>
            ))}
          </ul>
        </ContentPanel>
      ) : null}
    </AdminLayout>
  );
}
