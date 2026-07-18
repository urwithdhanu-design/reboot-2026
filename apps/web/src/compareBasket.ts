import type { QuoteEstimate } from "./api";

const COMPARE_QUOTES_KEY = "gcul_compare_quotes";
const MAX_QUOTES = 12;

export function readCompareQuotes(): QuoteEstimate[] {
  const raw = localStorage.getItem(COMPARE_QUOTES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QuoteEstimate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQuoteToCompare(quote: QuoteEstimate) {
  const existing = readCompareQuotes().filter((q) => q.quote_id !== quote.quote_id);
  const next = [quote, ...existing].slice(0, MAX_QUOTES);
  localStorage.setItem(COMPARE_QUOTES_KEY, JSON.stringify(next));
  return next;
}

export function removeQuoteFromCompare(quoteId: string) {
  const next = readCompareQuotes().filter((q) => q.quote_id !== quoteId);
  localStorage.setItem(COMPARE_QUOTES_KEY, JSON.stringify(next));
  return next;
}

export function mergeCompareQuotes(serverQuotes: QuoteEstimate[]) {
  const local = readCompareQuotes();
  const byId = new Map<string, QuoteEstimate>();
  for (const q of [...serverQuotes, ...local]) {
    byId.set(q.quote_id, q);
  }
  const merged = Array.from(byId.values()).slice(0, MAX_QUOTES);
  localStorage.setItem(COMPARE_QUOTES_KEY, JSON.stringify(merged));
  return merged;
}
