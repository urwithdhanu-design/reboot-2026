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
  };
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

/** Unpaid saved quotes for the Policies page (excludes issued/premium-paid policies). */
export function getUnpaidSavedQuotes(
  userEmail: string | undefined,
  issuedQuoteIds: Set<string>,
): QuoteEstimate[] {
  return readCompareQuotes().filter(
    (q) => quoteMatchesUser(q, userEmail) && !issuedQuoteIds.has(q.quote_id),
  );
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
