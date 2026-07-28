import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type WalletTransaction } from "../api";
import {
  AssistantBar,
  CustomerAppShell,
  CustomerPageHeader,
  CustomerPanel,
  HeaderIconWallet,
} from "../components";
import { KycOnboardingPrompt, KycRequiredAlert } from "../components/KycOnboardingPrompt";
import {
  IconChevron,
  IconRefresh,
  IconWallet,
} from "../icons";
import {
  formatKycStatus,
  isKycRequiredMessage,
  isKycVerified,
  needsKycAttention,
} from "../kycStatus";
import { useSession } from "../session";

const RECHARGE_PRESETS = [25, 50, 100, 250];

const WALLET_STEPS = ["Verify identity", "Connect wallet", "Fund & manage"] as const;
type WalletStepLabel = (typeof WALLET_STEPS)[number];
type WalletStepState = "done" | "active" | "pending";

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

function useWalletStepStates(
  kycVerified: boolean,
  walletConnected: boolean,
): Record<WalletStepLabel, WalletStepState> {
  return useMemo(() => {
    if (walletConnected) {
      return {
        "Verify identity": "done",
        "Connect wallet": "done",
        "Fund & manage": "active",
      };
    }
    if (kycVerified) {
      return {
        "Verify identity": "done",
        "Connect wallet": "active",
        "Fund & manage": "pending",
      };
    }
    return {
      "Verify identity": "active",
      "Connect wallet": "pending",
      "Fund & manage": "pending",
    };
  }, [kycVerified, walletConnected]);
}

function WalletJourneyStepper({
  stepStates,
}: {
  stepStates: Record<WalletStepLabel, WalletStepState>;
}) {
  return (
    <section className="wallet-journey" aria-label="Wallet setup progress">
      <div className="wallet-journey-edge" aria-hidden />
      <div className="wallet-journey-inner">
        <p className="wallet-journey-eyebrow">Your wallet journey</p>
        <ol className="wallet-journey-stepper">
          {WALLET_STEPS.map((label, index) => {
            const state = stepStates[label];
            return (
              <li key={label} className={state}>
                <span className="wallet-journey-marker" aria-hidden>
                  {state === "done" ? "✓" : index + 1}
                </span>
                <span className="wallet-journey-label">{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function WalletError({ error }: { error: string | null }) {
  if (!error) return null;
  if (isKycRequiredMessage(error)) {
    return <KycRequiredAlert message={error} />;
  }
  return (
    <p className="error" role="alert">
      {error}
    </p>
  );
}

export function WalletPage() {
  const navigate = useNavigate();
  const { token, user, updateUser } = useSession();
  const [view, setView] = useState<"overview" | "recharge">("overview");
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
  const [linkAddress, setLinkAddress] = useState("");

  const kycStatus = user?.kyc_status;
  const kycVerified = isKycVerified(kycStatus);
  const kycBlocksWallet = needsKycAttention(kycStatus);
  const walletConnected = status === "connected";
  const stepStates = useWalletStepStates(kycVerified, walletConnected);

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
    void api
      .me(token)
      .then((res) => updateUser(res))
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    if (!token || !walletConnected) return;
    void loadTransactions();
  }, [token, walletConnected]);

  async function linkExistingWallet() {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(linkAddress.trim())) {
      setError("Enter a valid Ethereum address (0x + 40 hex characters)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.linkWallet(token, linkAddress.trim());
      setAddress(res.address);
      setStatus(res.status);
      setBalance(res.balance_gbp ?? 0);
      setCurrency(res.currency ?? "GBP");
      setView("overview");
      syncSessionWallet({
        address: res.address,
        status: res.status,
        balance_gbp: res.balance_gbp ?? 0,
        currency: res.currency ?? "GBP",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet link failed");
    } finally {
      setLoading(false);
    }
  }

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
      setView("overview");
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

  const headerMetrics = walletConnected
    ? [
        {
          label: "Balance",
          value: formatGbp(balance),
          tone: balance > 0 ? ("success" as const) : undefined,
        },
        {
          label: "Wallet",
          value: "Connected",
          tone: "success" as const,
        },
        {
          label: "Identity",
          value: "Verified",
          tone: "success" as const,
        },
        {
          label: "Currency",
          value: currency,
        },
      ]
    : [
        {
          label: "Step",
          value: kycBlocksWallet ? "1 of 3" : "2 of 3",
          tone: "warning" as const,
        },
        {
          label: "Identity",
          value: formatKycStatus(kycStatus),
          tone: kycVerified ? ("success" as const) : ("warning" as const),
        },
        {
          label: "Wallet",
          value: walletConnected ? "Connected" : "Not set up",
          tone: walletConnected ? ("success" as const) : undefined,
        },
      ];

  return (
    <CustomerAppShell active="wallet">
      <CustomerPageHeader
        title="Wallet"
        subtitle={
          walletConnected
            ? "Your balance, payments, and policy payouts"
            : "Verify identity, connect your wallet, then add funds"
        }
        icon={<HeaderIconWallet />}
        accent="teal"
        metrics={headerMetrics}
      />

      <WalletJourneyStepper stepStates={stepStates} />

      {kycBlocksWallet ? (
        <CustomerPanel
          title="Step 1 · Verify your identity"
          description="KYC is required before you can create or link a wallet"
        >
          <KycOnboardingPrompt status={kycStatus} variant="card" className="wallet-kyc-prompt" />
          <p className="muted wallet-kyc-hint">
            Once approved, return here to connect your wallet and add funds for premiums.
          </p>
        </CustomerPanel>
      ) : null}

      {!kycBlocksWallet && !walletConnected ? (
        <CustomerPanel
          title="Step 2 · Connect your wallet"
          description="Create a secure wallet or link an existing Ethereum address"
        >
          <button
            className="customer-wallet-3d"
            type="button"
            onClick={createWallet}
            disabled={loading}
          >
            <div style={{ width: "100%" }}>
              <span className="tag">Recommended</span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="wallet-icon">
                  <IconWallet />
                </div>
                <div>
                  <strong>Create secure wallet</strong>
                  <span>Fast, protected account for policies and payouts.</span>
                </div>
                <div className="wallet-go">
                  <IconChevron />
                </div>
              </div>
            </div>
          </button>

          <div className="wallet-link-section">
            <p className="options-label">Or link an existing Ethereum wallet</p>
            <div className="stack" style={{ gap: 8 }}>
              <input
                className="input"
                placeholder="0x..."
                value={linkAddress}
                onChange={(e) => setLinkAddress(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void linkExistingWallet()}
                disabled={loading}
              >
                Link wallet address
              </button>
            </div>
          </div>

          <WalletError error={error} />
        </CustomerPanel>
      ) : null}

      {walletConnected ? (
        <>
          <div className="customer-chip-row wallet-view-chips" role="tablist" aria-label="Wallet views">
            <button
              type="button"
              role="tab"
              aria-selected={view === "overview"}
              className={`customer-chip${view === "overview" ? " active" : ""}`}
              onClick={() => setView("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "recharge"}
              className={`customer-chip${view === "recharge" ? " active" : ""}`}
              onClick={() => setView("recharge")}
            >
              Top up & activity
            </button>
          </div>

          {view === "overview" ? (
            <div className="wallet-dashboard">
              <div className="wallet-balance-card wallet-balance-card--hero">
                <span className="muted">Available balance</span>
                <strong>{formatGbp(balance)}</strong>
                <span className="muted">{currency} · Demo account</span>
              </div>

              <CustomerPanel
                title="Wallet details"
                description="Your connected address for insurance payments"
                toolbar={
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Refresh wallet"
                    onClick={() => void loadWallet()}
                  >
                    <IconRefresh size={16} />
                  </button>
                }
              >
                <div className="wallet-status">
                  <div className="meta">
                    <span className="muted" style={{ fontSize: "0.8rem" }}>
                      Wallet address
                    </span>
                    <span className="addr">{address ?? "Not connected"}</span>
                  </div>
                  <span className="customer-status-pill connected">Connected</span>
                </div>

                {note ? (
                  <p className="muted wallet-note">{note}</p>
                ) : null}

                <div className="wallet-actions">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setView("recharge")}
                  >
                    Top up balance
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => navigate("/marketplace")}
                  >
                    Continue to Marketplace
                  </button>
                </div>
              </CustomerPanel>

              {transactions.length > 0 ? (
                <CustomerPanel title="Recent activity" description="Latest wallet transactions">
                  <ul className="wallet-tx-list">
                    {transactions.slice(0, 5).map((tx) => (
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
                  {transactions.length > 5 ? (
                    <button
                      type="button"
                      className="wallet-see-all"
                      onClick={() => setView("recharge")}
                    >
                      View all activity
                    </button>
                  ) : null}
                </CustomerPanel>
              ) : null}
            </div>
          ) : (
            <CustomerPanel
              title="Step 3 · Top up your wallet"
              description="Add demo funds to pay premiums from your wallet"
            >
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

              <label className="field wallet-recharge-field">
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
                className="btn-primary wallet-recharge-submit"
                type="button"
                disabled={rechargeLoading}
                onClick={submitRecharge}
              >
                {rechargeLoading ? "Processing…" : "Recharge wallet"}
              </button>

              <p className="pay-hint muted">
                Demo top-up — funds are stored in your wallet balance for future premium payments.
              </p>

              {transactions.length > 0 ? (
                <>
                  <p className="options-label wallet-activity-heading">Recent activity</p>
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

              <WalletError error={error} />
            </CustomerPanel>
          )}
        </>
      ) : null}

      {walletConnected && view === "overview" ? <WalletError error={error} /> : null}

      <AssistantBar screen="wallet" />
    </CustomerAppShell>
  );
}
