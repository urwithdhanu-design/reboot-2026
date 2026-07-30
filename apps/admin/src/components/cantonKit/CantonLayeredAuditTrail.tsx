import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, ScrollText } from 'lucide-react';
import { adminApi, type AuditEventRow } from '../../api';
import {
  AUDIT_FLOW_OPTIONS,
  buildCantonAuditLayerTree,
  type CantonAuditLayerNode,
  type CantonLedgerLayer,
} from '../../data/cantonAuditLayers';

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function ledgerClass(ledger: CantonLedgerLayer) {
  switch (ledger) {
    case 'canton':
      return 'canton-audit-ledger canton-audit-ledger--canton';
    case 'hybrid':
      return 'canton-audit-ledger canton-audit-ledger--hybrid';
    case 'core-db':
      return 'canton-audit-ledger canton-audit-ledger--core';
    default:
      return 'canton-audit-ledger canton-audit-ledger--none';
  }
}

function statusLabel(status: CantonAuditLayerNode['status']) {
  switch (status) {
    case 'recorded':
      return 'Recorded';
    case 'inferred':
      return 'Inferred';
    case 'deferred':
      return 'Deferred';
    case 'skipped':
      return 'N/A';
    default:
      return status;
  }
}

function LayerRow({
  node,
  depth,
  expanded,
  onToggle,
}: {
  node: CantonAuditLayerNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isOpen = expanded.has(node.id);

  return (
    <>
      <tr
        className={`canton-audit-layer-row canton-audit-layer-row--depth-${Math.min(depth, 4)}`}
        onClick={() => (hasChildren ? onToggle(node.id) : undefined)}
      >
        <td className="canton-audit-layer-toggle">
          {hasChildren ? (
            <button
              type="button"
              className="canton-audit-expand-btn"
              aria-expanded={isOpen}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="canton-audit-expand-placeholder" aria-hidden />
          )}
        </td>
        <td className="canton-audit-layer-title">
          <span className="font-medium text-lbg-gray-800">{node.title}</span>
          {node.implementationPhase ? (
            <span className="canton-audit-phase">Phase {node.implementationPhase}</span>
          ) : null}
        </td>
        <td className="text-xs text-lbg-gray-500">
          {node.service}
          {node.port ? ` · :${node.port}` : ''}
        </td>
        <td>
          <span className={ledgerClass(node.ledger)}>
            {node.ledger === 'none' ? 'Off-ledger' : node.ledger}
          </span>
        </td>
        <td>
          <span className={`canton-audit-status canton-audit-status--${node.status}`}>
            {statusLabel(node.status)}
          </span>
        </td>
        <td className="text-xs text-lbg-gray-600 max-w-md">{node.detail}</td>
      </tr>
      {hasChildren && isOpen
        ? node.children!.map((child) => (
            <LayerRow key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
          ))
        : null}
    </>
  );
}

export function CantonLayeredAuditTrail() {
  const [flow, setFlow] = useState('');
  const [events, setEvents] = useState<AuditEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .listAuditEvents({ flow: flow || undefined, limit: 80 })
      .then((res) => setEvents(res.events))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load audit trail'))
      .finally(() => setLoading(false));
  }, [flow]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredLabel = useMemo(
    () => AUDIT_FLOW_OPTIONS.find((f) => f.value === flow)?.label ?? 'All flows',
    [flow],
  );

  const toggleEvent = (id: number) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLayer = (id: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="canton-audit-panel">
      <div className="canton-audit-header">
        <div className="flex items-start gap-2">
          <ScrollText className="w-5 h-5 text-lbg-green shrink-0 mt-0.5" aria-hidden />
          <div>
            <h3 className="text-sm font-bold text-lbg-black">Audit trail</h3>
            <p className="text-xs text-lbg-gray-500 mt-0.5">
              Immutable event log across KYC, wallet, policy, payment, claims, and Canton flows.
              Expand a row to see layered implementation nodes — platform → messaging → orchestrator → Canton.
            </p>
          </div>
        </div>
        <button type="button" className="stack-sim-btn stack-sim-btn--ghost" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5${loading ? ' animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      <div className="canton-audit-filters">
        <label className="stack-sim-field" style={{ maxWidth: 220 }}>
          <span>Platform flow</span>
          <select value={flow} onChange={(e) => setFlow(e.target.value)} disabled={loading}>
            {AUDIT_FLOW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <p className="text-xs text-lbg-gray-500">
          {events.length} events · {filteredLabel}
        </p>
      </div>

      {error ? <p className="stack-sim-error" role="alert">{error}</p> : null}

      {loading ? <p className="text-sm text-lbg-gray-500 py-4">Loading audit events…</p> : null}

      {!loading && events.length === 0 ? (
        <p className="text-sm text-lbg-gray-500 py-6 text-center">
          No audit events yet. Run the stack simulation or platform flows, then refresh. Ensure audit-service on :8092.
        </p>
      ) : null}

      {!loading && events.length > 0 ? (
        <div className="canton-audit-table-wrap">
          <table className="canton-audit-table">
            <thead>
              <tr>
                <th className="w-8" aria-label="Expand" />
                <th>When / layer</th>
                <th>Service</th>
                <th>Ledger</th>
                <th>Status</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const isOpen = expandedEvents.has(event.id);
                const layers = buildCantonAuditLayerTree(event);
                return (
                  <Fragment key={event.id}>
                    <tr
                      className={`canton-audit-event-row${isOpen ? ' canton-audit-event-row--open' : ''}`}
                      onClick={() => toggleEvent(event.id)}
                    >
                      <td className="canton-audit-layer-toggle">
                        <button
                          type="button"
                          className="canton-audit-expand-btn"
                          aria-expanded={isOpen}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEvent(event.id);
                          }}
                        >
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td>
                        <span className="text-xs text-lbg-gray-400 block">{formatWhen(event.occurred_at)}</span>
                        <span className="font-semibold text-lbg-black">
                          {event.source_event_type || event.event_type}
                        </span>
                      </td>
                      <td>
                        <span className="rounded-full bg-lbg-green/10 px-2 py-0.5 text-xs font-medium text-lbg-green-dark">
                          {event.flow_category}
                        </span>
                        <span className="block text-xs text-lbg-gray-400 mt-0.5">
                          {event.source_publisher ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span className="canton-audit-ledger canton-audit-ledger--hybrid">event</span>
                      </td>
                      <td>
                        <span className="canton-audit-status canton-audit-status--recorded">Recorded</span>
                      </td>
                      <td className="text-xs text-lbg-gray-600">
                        {event.customer_id ?? '—'}
                        {event.policy_id ? ` · policy ${event.policy_id}` : ''}
                        {event.claim_id ? ` · claim ${event.claim_id}` : ''}
                      </td>
                    </tr>
                    {isOpen
                      ? layers.map((layer) => (
                          <LayerRow
                            key={layer.id}
                            node={layer}
                            depth={1}
                            expanded={expandedLayers}
                            onToggle={toggleLayer}
                          />
                        ))
                      : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
