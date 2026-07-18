import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { AssistantBar, BottomNav, StepHeader } from "../components";
import {
  IconBank,
  IconChevron,
  IconId,
  IconRefresh,
  IconShield,
  IconWallet,
} from "../icons";
import { useSession } from "../session";

export function WalletPage() {
  const navigate = useNavigate();
  const { token, user, updateUser } = useSession();
  const [address, setAddress] = useState(user?.wallet?.address ?? null);
  const [status, setStatus] = useState(user?.wallet?.status ?? "disconnected");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .getWallet(token)
      .then((res) => {
        setAddress(res.address);
        setStatus(res.status);
      })
      .catch(() => undefined);
  }, [token]);

  async function createWallet() {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.createWallet(token);
      setAddress(res.address);
      setStatus(res.status);
      setNote(res.note ?? null);
      if (user) {
        updateUser({
          ...user,
          wallet: { address: res.address, status: res.status },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen has-nav">
      <StepHeader title="Digital Account Setup" />
      <div>
        <h2 className="section-title">Set up your digital account</h2>
        <p className="section-sub">
          We'll use this to store your policy details and receive payouts.
        </p>
      </div>

      <button className="wallet-hero" type="button" onClick={createWallet} disabled={loading}>
        <div style={{ width: "100%" }}>
          <span className="tag">Recommended</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="wallet-icon">
              <IconWallet />
            </div>
            <div>
              <strong>Secure Wallet</strong>
              <span>Fast, secure and protected for your policy.</span>
            </div>
            <div className="wallet-go">
              <IconChevron />
            </div>
          </div>
        </div>
      </button>

      <p className="options-label">Other options</p>
      <div className="options-grid">
        <button type="button" className="option-tile">
          <span className="glyph">
            <IconBank />
          </span>
          Bank Account
        </button>
        <button type="button" className="option-tile">
          <span className="glyph">
            <IconId />
          </span>
          Digital ID
        </button>
        <button type="button" className="option-tile">
          <span className="glyph">
            <IconShield size={22} />
          </span>
          Security Vault
        </button>
      </div>

      <div className="wallet-status">
        <div className="meta">
          <span className="muted" style={{ fontSize: "0.8rem" }}>
            Your Wallet Address
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="addr">{address ?? "Not connected"}</span>
            <button
              type="button"
              className="icon-btn"
              aria-label="Refresh wallet"
              onClick={createWallet}
            >
              <IconRefresh size={16} />
            </button>
          </div>
        </div>
        {status === "connected" ? (
          <span className="badge-connected">Connected</span>
        ) : null}
      </div>

      {note ? <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>{note}</p> : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="btn-primary"
        type="button"
        onClick={() => navigate("/marketplace")}
        disabled={status !== "connected"}
      >
        Continue to Marketplace
      </button>

      <AssistantBar screen="wallet" />
      <BottomNav active="wallet" />
    </div>
  );
}
