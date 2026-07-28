import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { AssistantBar, StepHeader } from "../components";

export function WalletApprovePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("This approval link is missing a token. Create your wallet again to receive a new email.");
      return;
    }

    let cancelled = false;
    void api
      .approveWalletConsent(token)
      .then((res) => {
        if (cancelled) return;
        setMessage(res.message);
        setAddress(res.address ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not approve wallet");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="screen">
      <StepHeader title="Wallet approval" />
      <div className="hero-copy">
        <h1>Approve your wallet</h1>
        <p>Confirming your consent to link this wallet for policies and payouts.</p>
      </div>

      {loading ? (
        <p className="muted" role="status">
          Verifying your approval link…
        </p>
      ) : null}

      {!loading && message ? (
        <div className="stack">
          <p className="manage-notice" role="status">
            {message}
          </p>
          {address ? (
            <p className="muted" style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>
              Wallet address: {address}
            </p>
          ) : null}
          <button className="btn-primary" type="button" onClick={() => navigate("/wallet")}>
            Go to wallet
          </button>
          <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
            <Link to="/login">Sign in</Link> to view your balance and activity.
          </p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="stack">
          <p className="error" role="alert">
            {error}
          </p>
          <button className="btn-secondary" type="button" onClick={() => navigate("/wallet")}>
            Back to wallet
          </button>
        </div>
      ) : null}

      <AssistantBar screen="wallet" />
    </div>
  );
}
