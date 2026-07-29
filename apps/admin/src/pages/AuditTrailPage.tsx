import { useEffect, useMemo, useState } from "react";
import { adminApi, type AuditEventRow } from "../api";
import { AdminLayout } from "../components/layout/AdminLayout";
import { PageHeader, ContentPanel } from "../components/ui";

const FLOW_OPTIONS = [
  { value: "", label: "All flows" },
  { value: "kyc", label: "KYC" },
  { value: "wallet", label: "Wallet" },
  { value: "policy", label: "Policy & mint" },
  { value: "payment", label: "Premium payment" },
  { value: "claims", label: "Claims & parametric" },
  { value: "blockchain", label: "Blockchain" },
];

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function AuditTrailPage() {
  const [flow, setFlow] = useState("");
  const [events, setEvents] = useState<AuditEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredLabel = useMemo(
    () => FLOW_OPTIONS.find((f) => f.value === flow)?.label ?? "All flows",
    [flow],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminApi
      .listAuditEvents({ flow: flow || undefined, limit: 150 })
      .then((res) => setEvents(res.events))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load audit trail"))
      .finally(() => setLoading(false));
  }, [flow]);

  return (
    <AdminLayout>
      <PageHeader
        title="Audit trail"
        subtitle="Immutable event log across KYC, wallet, policy, payment, claims, and Canton flows"
      />

      <ContentPanel className="mb-4 p-4">
        <label className="text-sm font-medium text-lbg-ink">
          Filter by platform flow
          <select
            className="mt-1 block w-full max-w-xs rounded-lg border border-lbg-border px-3 py-2 text-sm"
            value={flow}
            onChange={(e) => setFlow(e.target.value)}
          >
            {FLOW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-lbg-muted">
          Showing {events.length} events · {filteredLabel}
        </p>
      </ContentPanel>

      {error ? <p className="text-sm text-red-700 mb-4">{error}</p> : null}
      {loading ? <p className="text-sm text-lbg-muted">Loading audit events…</p> : null}

      <ContentPanel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-lbg-surface text-left text-xs uppercase tracking-wide text-lbg-muted">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Flow</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Policy / claim</th>
                <th className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {events.map((row) => (
                <tr key={row.id} className="border-t border-lbg-border/60 hover:bg-lbg-surface/60">
                  <td className="px-4 py-3 whitespace-nowrap">{formatWhen(row.occurred_at)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-lbg-green/10 px-2 py-0.5 text-xs font-medium text-lbg-green-dark">
                      {row.flow_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-lbg-ink">
                    {row.source_event_type || row.event_type}
                  </td>
                  <td className="px-4 py-3 text-lbg-muted">{row.customer_id || "—"}</td>
                  <td className="px-4 py-3 text-lbg-muted">
                    {row.policy_id || row.claim_id || row.quote_id || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-lbg-muted">
                    {row.source_publisher || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && events.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-lbg-muted">
              No audit events yet. Events appear when customers and admins use the platform (local dev requires audit-service on :8092).
            </p>
          ) : null}
        </div>
      </ContentPanel>
    </AdminLayout>
  );
}
