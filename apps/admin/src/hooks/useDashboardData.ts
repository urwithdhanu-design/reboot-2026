import { useCallback, useEffect, useState } from 'react';
import {
  adminApi,
  type AdminClaimRow,
  type AdminPolicyRow,
  type ChainObservabilityResponse,
  type KycQueueItem,
  type PaymentLedgerRow,
  type TokenizationView,
} from '../api';

const OPEN_CLAIM_STATUSES = new Set([
  'submitted',
  'pending_approval',
  'in_review',
  'approved',
  'payment_pending',
]);

const SETTLED_CLAIM_STATUSES = new Set(['settled', 'paid_out', 'paid']);

export type DashboardActivity = {
  id: string;
  kind: 'kyc' | 'claim' | 'mint' | 'payment';
  title: string;
  subtitle: string;
  status: string;
  at?: string;
};

export type DashboardCharts = {
  premiumsByMonth: Array<{ month: string; value: number }>;
  policiesByCategory: Array<{ name: string; value: number }>;
  claimsByMonth: Array<{ month: string; automated: number; manual: number }>;
  mintsByMonth: Array<{ month: string; minted: number }>;
  throughput24h: Array<{ hour: string; count: number }>;
};

export type DashboardMetrics = {
  customers: {
    total: number;
    kycVerified: number;
    kycInProgress: number;
    kycNotStarted: number;
    pendingReview: number;
  };
  policies: {
    totalQuotes: number;
    issued: number;
    active: number;
    minted: number;
    tokenizationRate: number;
  };
  claims: {
    total: number;
    open: number;
    settled: number;
    rejected: number;
    totalClaimed: number;
    totalPaidOut: number;
  };
  payments: {
    count: number;
    paidCount: number;
    totalPremium: number;
    mtdPremium: number;
  };
  tokenization: TokenizationView['stats'] | null;
  blockchain: TokenizationView['blockchain'] | null;
  standards: TokenizationView['standards'];
  registry: TokenizationView['registry'];
  mintQueue: TokenizationView['mint_queue'];
  observability: ChainObservabilityResponse | null;
  charts: DashboardCharts;
  recentActivity: DashboardActivity[];
  kycQueue: KycQueueItem[];
  recentClaims: AdminClaimRow[];
  recentPayments: PaymentLedgerRow[];
};

type DashboardState = {
  loading: boolean;
  error: string | null;
  refreshedAt: Date | null;
  metrics: DashboardMetrics | null;
};

function monthKey(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-GB', { month: 'short', year: '2-digit' });
}

function isCurrentMonth(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function groupPremiumsByMonth(payments: PaymentLedgerRow[]) {
  const map = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== 'paid') continue;
    const key = monthKey(p.created_at);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + Number(p.amount || 0));
  }
  return [...map.entries()]
    .map(([month, value]) => ({ month, value }))
    .slice(-6);
}

function groupPoliciesByCategory(policies: AdminPolicyRow[]) {
  const map = new Map<string, number>();
  for (const p of policies) {
    const cat = p.category?.trim() || 'Other';
    map.set(cat, (map.get(cat) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function groupClaimsByMonth(claims: AdminClaimRow[]) {
  const map = new Map<string, { automated: number; manual: number }>();
  for (const c of claims) {
    const key = monthKey(c.created_at);
    if (!key) continue;
    const row = map.get(key) ?? { automated: 0, manual: 0 };
    if (c.source === 'parametric') row.automated += 1;
    else row.manual += 1;
    map.set(key, row);
  }
  return [...map.entries()]
    .map(([month, counts]) => ({ month, ...counts }))
    .slice(-6);
}

function groupMintsByMonth(registry: TokenizationView['registry']) {
  const map = new Map<string, number>();
  for (const row of registry) {
    const key = monthKey(row.minted_at);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([month, minted]) => ({ month, minted }))
    .slice(-6);
}

function buildActivity(
  kycQueue: KycQueueItem[],
  claims: AdminClaimRow[],
  mintQueue: TokenizationView['mint_queue'],
  payments: PaymentLedgerRow[],
): DashboardActivity[] {
  const items: DashboardActivity[] = [];

  for (const k of kycQueue.slice(0, 4)) {
    items.push({
      id: `kyc-${k.id}`,
      kind: 'kyc',
      title: k.customer_name,
      subtitle: `${k.document_type} · ${k.email}`,
      status: k.status,
      at: k.submitted_at,
    });
  }
  for (const c of claims.slice(0, 4)) {
    items.push({
      id: `claim-${c.id}`,
      kind: 'claim',
      title: c.id,
      subtitle: `${c.policy_ref} · £${Number(c.amount_claimed).toFixed(2)}`,
      status: c.status,
      at: c.created_at,
    });
  }
  for (const m of mintQueue.slice(0, 3)) {
    items.push({
      id: `mint-${m.id}`,
      kind: 'mint',
      title: m.policy_number,
      subtitle: `${m.product_title} · ${m.customer_email}`,
      status: m.status,
      at: m.requested_at,
    });
  }
  for (const p of payments.filter((x) => x.status === 'paid').slice(0, 3)) {
    items.push({
      id: `pay-${p.id}`,
      kind: 'payment',
      title: p.policy_ref || p.quote_id,
      subtitle: `${p.customer_email} · £${Number(p.amount).toFixed(2)}`,
      status: p.status,
      at: p.created_at,
    });
  }

  return items
    .sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0;
      const tb = b.at ? new Date(b.at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 10);
}

function computeMetrics(
  customerStats: Awaited<ReturnType<typeof adminApi.customerStats>>,
  policyStats: Awaited<ReturnType<typeof adminApi.policyStats>>,
  policies: AdminPolicyRow[],
  claims: AdminClaimRow[],
  payments: PaymentLedgerRow[],
  tokenization: TokenizationView | null,
  kycQueue: Awaited<ReturnType<typeof adminApi.listKycQueue>>,
  observability: ChainObservabilityResponse | null,
): DashboardMetrics {
  const issued = policies.filter((p) => p.payment_status === 'paid' || p.mint_status);
  const active = policies.filter((p) => p.status === 'active' || p.mint_status === 'MINTED');
  const minted = policies.filter((p) => p.mint_status === 'MINTED').length;
  const issuedCount = Number(policyStats.issued_policies ?? issued.length);
  const tokenizationRate = issuedCount > 0 ? Math.round((minted / issuedCount) * 1000) / 10 : 0;

  const openClaims = claims.filter((c) => OPEN_CLAIM_STATUSES.has(c.status));
  const settledClaims = claims.filter((c) => SETTLED_CLAIM_STATUSES.has(c.status));
  const rejectedClaims = claims.filter((c) => c.status === 'rejected');
  const totalClaimed = claims.reduce((s, c) => s + Number(c.amount_claimed || 0), 0);
  const totalPaidOut = settledClaims.reduce(
    (s, c) => s + Number(c.approved_amount ?? c.amount_claimed ?? 0),
    0,
  );

  const paidPayments = payments.filter((p) => p.status === 'paid');
  const totalPremium = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const mtdPremium = paidPayments
    .filter((p) => isCurrentMonth(p.created_at))
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const registry = tokenization?.registry ?? [];
  const mintQueue = tokenization?.mint_queue ?? [];
  const standards = tokenization?.standards ?? [];

  return {
    customers: {
      total: customerStats.total_customers,
      kycVerified: customerStats.kyc_verified,
      kycInProgress: customerStats.kyc_in_progress,
      kycNotStarted: customerStats.kyc_not_started,
      pendingReview: kycQueue.pending_count,
    },
    policies: {
      totalQuotes: policyStats.total_quotes,
      issued: issuedCount,
      active: active.length,
      minted,
      tokenizationRate,
    },
    claims: {
      total: claims.length,
      open: openClaims.length,
      settled: settledClaims.length,
      rejected: rejectedClaims.length,
      totalClaimed,
      totalPaidOut,
    },
    payments: {
      count: payments.length,
      paidCount: paidPayments.length,
      totalPremium,
      mtdPremium,
    },
    tokenization: tokenization?.stats ?? null,
    blockchain: tokenization?.blockchain ?? null,
    standards,
    registry,
    mintQueue,
    observability,
    charts: {
      premiumsByMonth: groupPremiumsByMonth(payments),
      policiesByCategory: groupPoliciesByCategory(policies),
      claimsByMonth: groupClaimsByMonth(claims),
      mintsByMonth: groupMintsByMonth(registry),
      throughput24h: observability?.throughput_24h ?? [],
    },
    recentActivity: buildActivity(kycQueue.queue, claims, mintQueue, payments),
    kycQueue: kycQueue.queue,
    recentClaims: claims.slice(0, 6),
    recentPayments: paidPayments.slice(0, 6),
  };
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    refreshedAt: null,
    metrics: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [
        customerStats,
        policyStats,
        policiesRes,
        claimsRes,
        paymentsRes,
        tokenization,
        kycQueue,
        observability,
      ] = await Promise.all([
        adminApi.customerStats(),
        adminApi.policyStats(),
        adminApi.listPolicies(),
        adminApi.listClaims(),
        adminApi.listPayments(),
        adminApi.tokenizationView().catch(() => null),
        adminApi.listKycQueue(),
        adminApi.chainObservability().catch(() => null),
      ]);

      const metrics = computeMetrics(
        customerStats,
        policyStats,
        policiesRes.policies,
        claimsRes.claims,
        paymentsRes.payments,
        tokenization,
        kycQueue,
        observability,
      );

      setState({
        loading: false,
        error: null,
        refreshedAt: new Date(),
        metrics,
      });
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard',
        refreshedAt: null,
        metrics: null,
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, refresh: load };
}
