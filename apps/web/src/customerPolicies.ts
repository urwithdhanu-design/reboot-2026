import type { QuoteEstimate } from "./api";
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
