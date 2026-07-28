import type { QuoteEstimate } from "../api";

const QUOTE_STORAGE_KEY = "gcul_pending_quote";

export function stashQuote(quote: QuoteEstimate) {
  sessionStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quote));
}

export function readStashedQuote(): QuoteEstimate | null {
  const raw = sessionStorage.getItem(QUOTE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuoteEstimate;
  } catch {
    return null;
  }
}

export function clearStashedQuote() {
  sessionStorage.removeItem(QUOTE_STORAGE_KEY);
}
