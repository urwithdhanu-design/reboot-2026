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

export function PayQuoteButton({ quote }: { quote: QuoteEstimate }) {
  const navigate = useNavigate();
  const { token } = useSession();
  const [loading, setLoading] = useState(false);
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

  async function payWithWallet() {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!canPayWithWallet) {
      navigate("/wallet");
      return;
    }
    setError(null);
    setLoading(true);
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
      setLoading(false);
    }
  }

  return (
    <div className="pay-block">
      <button
        type="button"
        className="btn-primary"
        disabled={loading}
        onClick={() => void payWithWallet()}
      >
        {loading
          ? "Processing wallet payment…"
          : canPayWithWallet
            ? `Pay £${premium.toFixed(2)} from wallet`
            : "Pay from wallet"}
      </button>

      {!token ? (
        <p className="pay-hint muted">Sign in and connect a wallet to pay your premium.</p>
      ) : !walletConnected ? (
        <p className="pay-hint muted">
          Connect your wallet at <Link to="/wallet">Wallet</Link> before paying.
        </p>
      ) : walletBalance != null && walletBalance < premium ? (
        <p className="pay-hint muted">
          Wallet balance £{walletBalance.toFixed(2)} — recharge at{" "}
          <Link to="/wallet">Wallet</Link> to pay £{premium.toFixed(2)}.
        </p>
      ) : (
        <p className="pay-hint muted">
          Premium £{premium.toFixed(2)} / {quote.price_unit} will be debited from your wallet.
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
