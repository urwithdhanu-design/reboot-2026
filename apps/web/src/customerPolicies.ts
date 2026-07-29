import { api, type CustomerPolicyRecord, type QuoteEstimate } from "./api";
import { readCompareQuotes } from "./compareBasket";

const PAID_QUOTES_KEY = "gcul_paid_quotes";

export type CustomerPolicy = {
  quote_id: string;
  policy_ref: string;
  product_title: string;
  category: string;
  premium: number;
  price_unit: string;
  paid: boolean;
  status?: string;
  mint_status?: string;
  token_id?: string | null;
  ledger_type?: string;
  product_category?: string;
  cover_start_at?: string | null;
  cover_expires_at?: string | null;
  coverage_limit_gbp?: number | null;
  coverage_used_gbp?: number | null;
  coverage_remaining_gbp?: number | null;
  coverage_summary?: string | null;
  coverage_expired?: boolean;
  coverage_active?: boolean;
  coverage_pending_mint?: boolean;
};

/** Matches policy-service admin numbering: POL-{quoteId without Q- prefix}. */
export function quoteToPolicyRef(quoteId: string): string {
  return `POL-${quoteId.replace(/^Q-/, "")}`;
}

export function readPaidQuoteIds(): string[] {
  const raw = localStorage.getItem(PAID_QUOTES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markQuotePaid(quoteId: string) {
  if (!quoteId) return;
  const ids = readPaidQuoteIds();
  if (ids.includes(quoteId)) return;
  localStorage.setItem(PAID_QUOTES_KEY, JSON.stringify([...ids, quoteId]));
}

function quoteMatchesUser(quote: QuoteEstimate, userEmail?: string): boolean {
  if (!userEmail) return true;
  const email = userEmail.toLowerCase();
  const qEmail = String(
    (quote.answers as Record<string, unknown> | undefined)?.email ?? "",
  ).toLowerCase();
  return qEmail === email || !qEmail;
}

export function issuedPolicyToCustomerPolicy(
  policy: CustomerPolicyRecord,
  quote?: QuoteEstimate,
): CustomerPolicy {
  return {
    quote_id: policy.quote_id,
    policy_ref: policy.policy_id || quoteToPolicyRef(policy.quote_id),
    product_title: policy.product_title || quote?.product_title || "Insurance policy",
    category: quote?.category ?? "",
    premium: quote?.estimated_premium ?? 0,
    price_unit: quote?.price_unit ?? "month",
    paid: true,
    status: policy.status,
    mint_status: policy.mint_status,
    token_id: policy.token_id,
    ledger_type: policy.ledger_type,
    product_category: policy.product_category ?? quote?.category ?? "",
    cover_start_at: policy.cover_start_at,
    cover_expires_at: policy.cover_expires_at,
    coverage_limit_gbp: policy.coverage_limit_gbp,
    coverage_used_gbp: policy.coverage_used_gbp,
    coverage_remaining_gbp: policy.coverage_remaining_gbp,
    coverage_summary: policy.coverage_summary,
    coverage_expired: policy.coverage_expired,
    coverage_active: policy.coverage_active,
    coverage_pending_mint: policy.coverage_pending_mint,
  };
}

export function isClaimablePolicy(policy: CustomerPolicy): boolean {
  if ((policy.status ?? "").toLowerCase() === "cancelled") return false;
  if (policy.mint_status !== "MINTED" && !policy.token_id) return false;
  if (policy.coverage_pending_mint) return false;
  if (policy.coverage_expired) return false;
  if (policy.cover_expires_at) {
    try {
      if (new Date(policy.cover_expires_at).getTime() < Date.now()) return false;
    } catch {
      // ignore parse errors
    }
  }
  return policy.coverage_active !== false;
}

export function isCancelledPolicy(policy: Pick<CustomerPolicyRecord, "status">): boolean {
  return (policy.status ?? "").toLowerCase() === "cancelled";
}

export function isCancellablePolicy(policy: CustomerPolicyRecord): boolean {
  return !isCancelledPolicy(policy);
}

export function isRenewablePolicy(policy: CustomerPolicyRecord): boolean {
  if (policy.renewal_eligible) return true;
  if (isCancelledPolicy(policy) || policy.renewed_by_policy_id) return false;
  if ((policy.mint_status ?? "").toUpperCase() !== "MINTED") return false;
  if (!policy.cover_expires_at) return false;
  const expiresAt = new Date(policy.cover_expires_at).getTime();
  if (Number.isNaN(expiresAt)) return false;
  const now = Date.now();
  const windowMs = 30 * 24 * 60 * 60 * 1000;
  const graceMs = 7 * 24 * 60 * 60 * 1000;
  return now >= expiresAt - windowMs && now <= expiresAt + graceMs;
}

export async function fetchIssuedPolicies(token: string): Promise<CustomerPolicyRecord[]> {
  const res = await api.getMyPolicies(token);
  return res.policies;
}

export function buildIssuedQuoteIdSet(
  issuedPolicies: CustomerPolicyRecord[],
  extraQuoteIds: string[] = [],
): Set<string> {
  const ids = new Set(extraQuoteIds);
  for (const policy of issuedPolicies) {
    if (policy.quote_id) ids.add(policy.quote_id);
  }
  return ids;
}

/** Keep the first occurrence of each quote_id (compare basket is newest-first). */
export function dedupeQuotesById(quotes: QuoteEstimate[]): QuoteEstimate[] {
  const byId = new Map<string, QuoteEstimate>();
  for (const q of quotes) {
    if (!byId.has(q.quote_id)) byId.set(q.quote_id, q);
  }
  return Array.from(byId.values());
}

/** Unpaid saved quotes for the Policies page (excludes issued/premium-paid policies). */
export function getUnpaidSavedQuotes(
  userEmail: string | undefined,
  issuedQuoteIds: Set<string>,
): QuoteEstimate[] {
  return dedupeQuotesById(readCompareQuotes()).filter(
    (q) => quoteMatchesUser(q, userEmail) && !issuedQuoteIds.has(q.quote_id),
  );
}

/**
 * Merge saved quotes with an optional navigation quote, deduplicating by quote_id.
 * Navigation quote wins when the same id appears in both sources.
 */
export function mergeDisplayQuotes(
  savedQuotes: QuoteEstimate[],
  navigationQuote: QuoteEstimate | undefined,
  issuedQuoteIds: Set<string>,
): QuoteEstimate[] {
  const byId = new Map<string, QuoteEstimate>();

  if (navigationQuote && !issuedQuoteIds.has(navigationQuote.quote_id)) {
    byId.set(navigationQuote.quote_id, navigationQuote);
  }

  for (const q of dedupeQuotesById(savedQuotes)) {
    if (issuedQuoteIds.has(q.quote_id)) continue;
    if (!byId.has(q.quote_id)) byId.set(q.quote_id, q);
  }

  return Array.from(byId.values());
}

/** Saved quotes for this customer — treated as policies they can claim on. */
export function getCustomerPolicies(userEmail?: string): CustomerPolicy[] {
  const paid = new Set(readPaidQuoteIds());
  return readCompareQuotes()
    .filter((q) => quoteMatchesUser(q, userEmail))
    .map((q) => ({
      quote_id: q.quote_id,
      policy_ref: quoteToPolicyRef(q.quote_id),
      product_title: q.product_title,
      category: q.category,
      premium: q.estimated_premium,
      price_unit: q.price_unit,
      paid: paid.has(q.quote_id),
    }));
}

export async function loadIssuedCustomerPolicies(
  token: string | undefined,
  userEmail?: string,
): Promise<CustomerPolicy[]> {
  if (!token) {
    return getCustomerPolicies(userEmail).filter((policy) => policy.paid);
  }

  try {
    const issued = await fetchIssuedPolicies(token);
    const quotesById = new Map(
      readCompareQuotes().map((quote) => [quote.quote_id, quote] as const),
    );
    return issued.map((policy) =>
      issuedPolicyToCustomerPolicy(policy, quotesById.get(policy.quote_id)),
    );
  } catch {
    return getCustomerPolicies(userEmail).filter((policy) => policy.paid);
  }
}
