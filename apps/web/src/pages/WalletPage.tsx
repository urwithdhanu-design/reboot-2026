import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type WalletTransaction } from "../api";
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

const RECHARGE_PRESETS = [25, 50, 100, 250];

function formatGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

function formatTxType(type: string) {
  if (type === "recharge") return "Top-up";
  if (type === "premium") return "Premium";
  return type.replace(/_/g, " ");
}

export function WalletPage() {
  const navigate = useNavigate();
  const { token, user, updateUser } = useSession();
  const [tab, setTab] = useState<"setup" | "status" | "recharge">("setup");
  const [address, setAddress] = useState(user?.wallet?.address ?? null);
  const [status, setStatus] = useState(user?.wallet?.status ?? "disconnected");
  const [balance, setBalance] = useState(user?.wallet?.balance_gbp ?? 0);
  const [currency, setCurrency] = useState(user?.wallet?.currency ?? "GBP");
  const [loading, setLoading] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("50");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  function syncSessionWallet(next: {
    address: string | null;
    status: string;
    balance_gbp: number;
    currency: string;
  }) {
    if (!user) return;
    updateUser({
      ...user,
      wallet: {
        address: next.address ?? "",
        status: next.status,
        balance_gbp: next.balance_gbp,
        currency: next.currency,
      },
    });
  }

  async function loadWallet() {
    if (!token) return;
    const res = await api.getWallet(token);
    setAddress(res.address);
    setStatus(res.status);
    setBalance(res.balance_gbp ?? 0);
    setCurrency(res.currency ?? "GBP");
    if (res.status === "connected") {
      setTab((current) => (current === "setup" ? "status" : current));
    }
    syncSessionWallet({
      address: res.address,
      status: res.status,
      balance_gbp: res.balance_gbp ?? 0,
      currency: res.currency ?? "GBP",
    });
  }

  async function loadTransactions() {
    if (!token) return;
    try {
      const res = await api.getWalletTransactions(token);
      setTransactions(res.transactions);
    } catch {
      setTransactions([]);
    }
  }

  useEffect(() => {
    if (!token) return;
    void loadWallet().catch(() => undefined);
  }, [token]);

  useEffect(() => {
    if (!token || tab !== "recharge" || status !== "connected") return;
    void loadTransactions();
  }, [token, tab, status]);

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
      setBalance(res.balance_gbp ?? 0);
      setCurrency(res.currency ?? "GBP");
      setNote(res.note ?? null);
      setTab("status");
      syncSessionWallet({
        address: res.address,
        status: res.status,
        balance_gbp: res.balance_gbp ?? 0,
        currency: res.currency ?? "GBP",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet creation failed");
    } finally {
      setLoading(false);
    }
  }

  async function rechargeWallet(amount: number) {
    if (!token) {
      navigate("/login");
      return;
    }
    if (status !== "connected") {
      setError("Create your wallet before recharging");
      return;
    }
    setRechargeLoading(true);
    setError(null);
    try {
      const res = await api.rechargeWallet(token, amount);
      setBalance(res.balance_gbp ?? 0);
      setCurrency(res.currency ?? "GBP");
      syncSessionWallet({
        address: res.address,
        status: res.status,
        balance_gbp: res.balance_gbp ?? 0,
        currency: res.currency ?? "GBP",
      });
      await loadTransactions();
      setRechargeAmount(String(amount));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recharge failed");
    } finally {
      setRechargeLoading(false);
    }
  }

  function submitRecharge() {
    const amount = Number.parseFloat(rechargeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid recharge amount");
      return;
    }
    void rechargeWallet(amount);
  }

  return (
    <div className="screen has-nav screen-customer">
      <CustomerPageHeader
        title="Wallet"
        subtitle="Secure digital account for policies and payouts"
        icon={<HeaderIconWallet />}
        accent="teal"
        metrics={[
          {
            label: "Status",
            value: status === "connected" ? "Connected" : "Setup",
            tone: status === "connected" ? "success" : "warning",
          },
          {
            label: "Balance",
            value: formatGbp(balance),
            tone: balance > 0 ? "success" : undefined,
          },
        ]}
      />

      <CustomerTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "setup", label: "Set up" },
          { value: "status", label: "Status" },
          { value: "recharge", label: "Recharge" },
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
          <div className="wallet-balance-card">
            <span className="muted">Available balance</span>
            <strong>{formatGbp(balance)}</strong>
            <span className="muted">{currency} · Demo ledger</span>
          </div>

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
                  onClick={() => void loadWallet()}
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

          <div className="wallet-actions">
            <button
              className="btn-secondary"
              type="button"
              onClick={() => setTab("recharge")}
              disabled={status !== "connected"}
            >
              Recharge balance
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={() => navigate("/marketplace")}
              disabled={status !== "connected"}
            >
              Continue to Marketplace
            </button>
          </div>
        </CustomerPanel>
      )}

      {tab === "recharge" && (
        <CustomerPanel title="Recharge wallet" description="Add demo funds to pay premiums from your wallet later">
          {status !== "connected" ? (
            <p className="muted">Set up your wallet first, then return here to add funds.</p>
          ) : (
            <>
              <div className="wallet-balance-card compact">
                <span className="muted">Current balance</span>
                <strong>{formatGbp(balance)}</strong>
              </div>

              <p className="options-label">Quick amounts</p>
              <div className="recharge-presets">
                {RECHARGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`recharge-preset-btn${Number(rechargeAmount) === preset ? " active" : ""}`}
                    disabled={rechargeLoading}
                    onClick={() => setRechargeAmount(String(preset))}
                  >
                    {formatGbp(preset)}
                  </button>
                ))}
              </div>

              <label className="field" style={{ marginTop: 16 }}>
                <span>Custom amount ({currency})</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  disabled={rechargeLoading}
                />
              </label>

              <button
                className="btn-primary"
                type="button"
                style={{ marginTop: 12 }}
                disabled={rechargeLoading}
                onClick={submitRecharge}
              >
                {rechargeLoading ? "Processing…" : "Recharge wallet"}
              </button>

              <p className="pay-hint muted" style={{ marginTop: 8 }}>
                Demo top-up — funds are stored in your wallet balance for future premium payments.
              </p>

              {transactions.length > 0 ? (
                <>
                  <p className="options-label" style={{ marginTop: 20 }}>Recent activity</p>
                  <ul className="wallet-tx-list">
                    {transactions.map((tx) => (
                      <li key={tx.id}>
                        <div>
                          <strong>{formatTxType(tx.type)}</strong>
                          <span className="muted">{tx.id}</span>
                        </div>
                        <div className="wallet-tx-amount">
                          <span className={tx.amount > 0 ? "positive" : ""}>
                            {tx.amount > 0 ? "+" : ""}
                            {formatGbp(tx.amount)}
                          </span>
                          <span className="muted">{new Date(tx.created_at).toLocaleString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
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
