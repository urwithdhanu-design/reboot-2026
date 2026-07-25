import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type QuoteEstimate } from "../api";
import { markQuotePaid } from "../customerPolicies";
import { useSession } from "../session";

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
  const navigate = useNavigate();
  const { token } = useSession();
  const [loading, setLoading] = useState<"stripe" | "wallet" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);

  const premium = quote.estimated_premium;
  const canPayWithWallet =
    walletConnected && walletBalance != null && walletBalance + 0.001 >= premium;

  useEffect(() => {
    if (!token) return;
    api
      .getWallet(token)
      .then((res) => {
        setWalletConnected(res.status === "connected");
        setWalletBalance(res.balance_gbp ?? 0);
      })
      .catch(() => {
        setWalletConnected(false);
        setWalletBalance(null);
      });
  }, [token]);

  async function startCheckout() {
    setError(null);
    setLoading("stripe");
    try {
      stashQuote(quote);
      const session = await api.createCheckout(quote.quote_id);
      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL");
      }
      window.location.href = session.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setLoading(null);
    }
  }

  async function payWithWallet() {
    if (!token) {
      navigate("/login");
      return;
    }
    setError(null);
    setLoading("wallet");
    try {
      stashQuote(quote);
      const res = await api.payWithWallet(token, quote.quote_id);
      if (!res.paid) {
        throw new Error("Wallet payment was not completed");
      }
      markQuotePaid(res.quote_id);
      navigate("/policies", {
        state: {
          quote,
          payment: {
            paid: true,
            quote_id: res.quote_id,
            payment_method: "wallet",
            policy_id: res.policy_id,
            balance_gbp: res.balance_gbp,
          },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet payment failed");
      setLoading(null);
    }
  }

  return (
    <div className="pay-block">
      {canPayWithWallet ? (
        <button
          type="button"
          className="btn-primary"
          disabled={loading !== null}
          onClick={() => void payWithWallet()}
        >
          {loading === "wallet"
            ? "Processing wallet payment…"
            : `Pay £${premium.toFixed(2)} from wallet`}
        </button>
      ) : null}

      {walletConnected && walletBalance != null && walletBalance < premium ? (
        <p className="pay-hint muted">
          Wallet balance £{walletBalance.toFixed(2)} — recharge at{" "}
          <Link to="/wallet">Wallet</Link> or pay with Stripe below.
        </p>
      ) : null}

      <button
        type="button"
        className={canPayWithWallet ? "btn-secondary" : className}
        disabled={loading !== null}
        onClick={() => void startCheckout()}
        style={canPayWithWallet ? { marginTop: 10 } : undefined}
      >
        {loading === "stripe" ? "Redirecting to Stripe…" : label}
      </button>

      {!canPayWithWallet ? (
        <p className="pay-hint muted">
          Secure checkout for your first £{premium.toFixed(2)} / {quote.price_unit} premium
        </p>
      ) : (
        <p className="pay-hint muted" style={{ marginTop: 8 }}>
          Or pay with Stripe instead
        </p>
      )}

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
