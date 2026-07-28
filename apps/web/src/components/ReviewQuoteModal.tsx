import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type QuoteEstimate } from "../api";
import { markQuotePaid, quoteToPolicyRef } from "../customerPolicies";
import { stashQuote } from "./PayQuoteButton";

type ReviewQuoteModalProps = {
  open: boolean;
  quote: QuoteEstimate | null;
  token: string | null;
  onClose: () => void;
  onPurchased: (result: {
    quote_id: string;
    policy_id?: string;
    balance_gbp: number;
  }) => void;
};

function formatAnswerLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatAnswerValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function ReviewQuoteModal({
  open,
  quote,
  token,
  onClose,
  onPurchased,
}: ReviewQuoteModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"wallet" | "stripe" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  const premium = quote?.estimated_premium ?? 0;
  const canPayWithWallet =
    walletConnected && walletBalance != null && walletBalance + 0.001 >= premium;

  const answerRows = useMemo(() => {
    if (!quote?.answers) return [];
    return Object.entries(quote.answers).filter(
      ([, value]) => value != null && String(value).trim() !== "",
    );
  }, [quote?.answers]);

  useEffect(() => {
    if (!open || !quote) return;
    setError(null);
    setLoading(null);
  }, [open, quote?.quote_id]);

  useEffect(() => {
    if (!open || !token) {
      setWalletConnected(false);
      setWalletBalance(null);
      return;
    }
    setWalletLoading(true);
    api
      .getWallet(token)
      .then((res) => {
        setWalletConnected(res.status === "connected");
        setWalletBalance(res.balance_gbp ?? 0);
      })
      .catch(() => {
        setWalletConnected(false);
        setWalletBalance(null);
      })
      .finally(() => setWalletLoading(false));
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !quote) return null;

  async function payWithWallet() {
    if (!token) {
      navigate("/login");
      return;
    }
    setError(null);
    setLoading("wallet");
    try {
      stashQuote(quote!);
      const res = await api.payWithWallet(token, quote!.quote_id);
      if (!res.paid) {
        throw new Error("Wallet payment was not completed");
      }
      markQuotePaid(res.quote_id);
      onPurchased({
        quote_id: res.quote_id,
        policy_id: res.policy_id,
        balance_gbp: res.balance_gbp,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet payment failed");
      setLoading(null);
    }
  }

  async function startCheckout() {
    setError(null);
    setLoading("stripe");
    try {
      stashQuote(quote!);
      const session = await api.createCheckout(quote!.quote_id);
      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL");
      }
      window.location.href = session.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setLoading(null);
    }
  }

  return (
    <div className="cancel-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cancel-wizard review-quote-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-quote-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cancel-wizard-header">
          <div>
            <p className="cancel-wizard-eyebrow">Saved quote</p>
            <h2 id="review-quote-title">Review &amp; purchase</h2>
          </div>
          <button type="button" className="cancel-wizard-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="review-quote-body">
          <div className="review-quote-summary">
            <div className="review-quote-summary-head">
              <strong>{quote.product_title}</strong>
              <span className="review-quote-price">
                £{premium.toFixed(2)}
                <span>/{quote.price_unit}</span>
              </span>
            </div>
            <p className="review-quote-meta">
              {quote.category} · Ref {quoteToPolicyRef(quote.quote_id)}
            </p>
            {quote.message ? <p className="review-quote-message">{quote.message}</p> : null}
          </div>

          {answerRows.length > 0 ? (
            <div className="review-quote-details">
              <p className="review-quote-details-label">Quote details</p>
              <dl className="review-quote-details-grid">
                {answerRows.map(([key, value]) => (
                  <div key={key} className="review-quote-detail-row">
                    <dt>{formatAnswerLabel(key)}</dt>
                    <dd>{formatAnswerValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="review-quote-wallet-box">
            <p className="review-quote-details-label">Wallet payment</p>
            {!token ? (
              <p className="muted">
                <Link to="/login">Sign in</Link> to pay from your wallet balance.
              </p>
            ) : walletLoading ? (
              <p className="muted">Loading wallet balance…</p>
            ) : !walletConnected ? (
              <p className="muted">
                Connect and approve your wallet at <Link to="/wallet">Wallet</Link> to pay from
                balance, or use Stripe below.
              </p>
            ) : (
              <>
                <p className="review-quote-wallet-balance">
                  Available balance:{" "}
                  <strong>£{(walletBalance ?? 0).toFixed(2)}</strong>
                </p>
                {walletBalance != null && walletBalance < premium ? (
                  <p className="error review-quote-wallet-shortfall" role="alert">
                    Insufficient balance — you need £{premium.toFixed(2)}. Recharge at{" "}
                    <Link to="/wallet">Wallet</Link> or pay with Stripe.
                  </p>
                ) : null}
              </>
            )}
          </div>

          {error ? (
            <p className="error review-quote-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="review-quote-actions">
            {token && walletConnected ? (
              <button
                type="button"
                className="btn-primary"
                disabled={loading !== null || !canPayWithWallet}
                onClick={() => void payWithWallet()}
              >
                {loading === "wallet"
                  ? "Processing…"
                  : `Purchase · £${premium.toFixed(2)} from wallet`}
              </button>
            ) : null}
            <button
              type="button"
              className={canPayWithWallet ? "btn-secondary" : "btn-primary"}
              disabled={loading !== null}
              onClick={() => void startCheckout()}
            >
              {loading === "stripe" ? "Redirecting to Stripe…" : `Pay £${premium.toFixed(2)} with Stripe`}
            </button>
            <button type="button" className="btn-link" onClick={onClose} disabled={loading !== null}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
