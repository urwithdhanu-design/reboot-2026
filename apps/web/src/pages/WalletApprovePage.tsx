import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { AssistantBar, StepHeader } from "../components";
import { useSession } from "../session";

export function WalletApprovePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const approvalToken = (params.get("token") ?? "").trim();
  const { token, user, updateUser } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [approvedAt, setApprovedAt] = useState<string | null>(null);

  async function approveWallet() {
    if (!approvalToken) {
      setError("This approval link is missing a token. Create your wallet again to receive a new email.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.approveWalletConsent(approvalToken);
      setMessage(res.message);
      setAddress(res.address ?? null);
      setApprovedAt(res.consent_approved_at ?? new Date().toISOString());

      if (token && user) {
        const wallet = await api.getWallet(token);
        updateUser({
          ...user,
          wallet: {
            address: wallet.address ?? res.address ?? "",
            status: wallet.status,
            balance_gbp: wallet.balance_gbp ?? 0,
            currency: wallet.currency ?? "GBP",
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve wallet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <StepHeader title="Wallet approval" />
      <div className="hero-copy">
        <h1>Approve your wallet</h1>
        <p>Confirm consent to link this wallet for policies and payouts.</p>
      </div>

      {!message && !error ? (
        <div className="stack">
          <p className="manage-notice" role="status">
            Click the button below to approve your wallet. This calls the wallet consent API and
            records your approval in the database.
          </p>
          <button
            className="btn-primary"
            type="button"
            disabled={loading || !approvalToken}
            onClick={() => void approveWallet()}
          >
            {loading ? "Approving…" : "Approve wallet"}
          </button>
          {!approvalToken ? (
            <p className="error" role="alert">
              This approval link is missing a token. Create your wallet again to receive a new email.
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <div className="stack">
          <p className="manage-notice" role="status">
            {message}
          </p>
          {approvedAt ? (
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              Consent recorded at {new Date(approvedAt).toLocaleString()}
            </p>
          ) : null}
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

      {error ? (
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
