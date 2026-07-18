import { useState } from "react";
import { api, type QuoteEstimate } from "../api";

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

export function PayQuoteButton({
  quote,
  label = "Pay with Stripe",
  className = "btn-primary btn-dark",
}: {
  quote: QuoteEstimate;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setLoading(true);
    try {
      stashQuote(quote);
      const session = await api.createCheckout(quote.quote_id);
      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL");
      }
      window.location.href = session.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setLoading(false);
    }
  }

  return (
    <div className="pay-block">
      <button
        type="button"
        className={className}
        disabled={loading}
        onClick={() => void startCheckout()}
      >
        {loading ? "Redirecting to Stripe…" : label}
      </button>
      <p className="pay-hint muted">
        Secure checkout for your first £{quote.estimated_premium.toFixed(2)} /{" "}
        {quote.price_unit} premium
      </p>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
