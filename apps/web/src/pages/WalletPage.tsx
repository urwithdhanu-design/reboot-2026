import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import {
  AssistantBar,
  BottomNav,
  CustomerPageHeader,
  CustomerPanel,
  CustomerTabs,
  HeaderIconWallet,
} from "../components";
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
  const [tab, setTab] = useState<"setup" | "status">("setup");
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
      setTab("status");
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
    <div className="screen has-nav screen-customer">
      <CustomerPageHeader
        title="Wallet"
        subtitle="Secure digital account for policies and payouts"
        icon={<HeaderIconWallet />}
        accent="teal"
        metrics={[
          { label: "Status", value: status === "connected" ? "Connected" : "Setup", tone: status === "connected" ? "success" : "warning" },
          { label: "Network", value: "Insure Chain" },
        ]}
      />

      <CustomerTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "setup", label: "Set up" },
          { value: "status", label: "Status" },
        ]}
      />

      {tab === "setup" && (
        <CustomerPanel title="Set up your digital account" description="We'll use this to store policy details and receive payouts">
          <button className="customer-wallet-3d" type="button" onClick={createWallet} disabled={loading}>
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

          <p className="options-label" style={{ marginTop: 16 }}>Other options</p>
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
        </CustomerPanel>
      )}

      {tab === "status" && (
        <CustomerPanel title="Wallet status" description="Your connected address on the insurance chain">
          <div className="wallet-status" style={{ marginBottom: 12 }}>
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
              <span className="customer-status-pill connected">Connected</span>
            ) : (
              <span className="customer-status-pill">Not connected</span>
            )}
          </div>

          {note ? <p className="muted" style={{ fontSize: "0.8rem", margin: "0 0 12px" }}>{note}</p> : null}
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
        </CustomerPanel>
      )}

      {tab === "setup" && error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <AssistantBar screen="wallet" />
      <BottomNav active="wallet" />
    </div>
  );
}
