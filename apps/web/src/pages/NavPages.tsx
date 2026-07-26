import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, type AuthUser, type CustomerPolicyRecord, type QuoteEstimate } from "../api";
import { buildClaimDemoForPolicy, sleep } from "../claimsDemoFill";
import { saveQuoteToCompare } from "../compareBasket";
import {
  buildIssuedQuoteIdSet,
  getUnpaidSavedQuotes,
  loadIssuedCustomerPolicies,
  markQuotePaid,
  quoteToPolicyRef,
  readPaidQuoteIds,
  type CustomerPolicy,
} from "../customerPolicies";
import { AssistantBar, BottomNav, CustomerPageHeader, CustomerPanel, CustomerTabs, HeaderIconClaims, HeaderIconPolicies, HeaderIconProfile } from "../components";
import { PayQuoteButton } from "../components/PayQuoteButton";
import { useSession } from "../session";

const PRIMARY_ACTIONS: { id: string; label: string; to?: string }[] = [
  { id: "compare", label: "Compare policies & quotes", to: "/compare" },
  { id: "renewal", label: "Manage renewal" },
  { id: "claim", label: "Make a claim", to: "/claims" },
  { id: "cancel", label: "Cancel policy" },
  { id: "cover", label: "View and change cover" },
];

const SECONDARY_ACTIONS: { id: string; label: string }[] = [
  { id: "proof", label: "Get proof of insurance" },
  { id: "documents", label: "View policy documents" },
];

const ACTION_MESSAGES: Record<string, string> = {
  renewal: "Renewal options will appear here when your policy is due.",
  cancel: "You can cancel online. We'll confirm any refunds before you finish.",
  cover: "Review your current cover and request changes from this screen.",
  proof: "Your digital proof of insurance is ready to download or share.",
  documents: "Policy schedule, terms, and certificates are available here.",
};

export function PoliciesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useSession();
  const [tab, setTab] = useState<"manage" | "quotes">("manage");
  const quote = (location.state as { quote?: QuoteEstimate } | null)?.quote;
  const demoSubmitted = Boolean(
    (location.state as { demoSubmitted?: boolean } | null)?.demoSubmitted,
  );
  const payment = (
    location.state as {
      payment?: { paid?: boolean; session_id?: string; quote_id?: string };
    } | null
  )?.payment;
  const [notice, setNotice] = useState<string | null>(null);
  const [savedQuotes, setSavedQuotes] = useState<QuoteEstimate[]>([]);
  const [policies, setPolicies] = useState<CustomerPolicyRecord[]>([]);
  const [issuedQuoteIds, setIssuedQuoteIds] = useState<string[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const displayQuotes = useMemo(() => {
    const issued = new Set(issuedQuoteIds);
    const byId = new Map<string, QuoteEstimate>();
    for (const q of savedQuotes) {
      if (!issued.has(q.quote_id)) byId.set(q.quote_id, q);
    }
    if (quote && !issued.has(quote.quote_id) && !byId.has(quote.quote_id)) {
      byId.set(quote.quote_id, quote);
    }
    return Array.from(byId.values());
  }, [savedQuotes, quote, issuedQuoteIds]);

  const selectedQuote = useMemo(
    () => displayQuotes.find((q) => q.quote_id === selectedQuoteId) ?? displayQuotes[0] ?? null,
    [displayQuotes, selectedQuoteId],
  );

  useEffect(() => {
    if (!token) {
      setPolicies([]);
      return;
    }
    void api.getMyPolicies(token)
      .then((res) => setPolicies(res.policies))
      .catch(() => setPolicies([]));
  }, [token, payment?.paid]);

  useEffect(() => {
    if (quote) saveQuoteToCompare(quote);
  }, [quote]);

  useEffect(() => {
    let alive = true;

    async function loadQuotes() {
      setQuotesLoading(true);
      try {
        const localPaid = readPaidQuoteIds();
        if (payment?.paid && payment.quote_id) {
          markQuotePaid(payment.quote_id);
        }

        let issuedPolicies: CustomerPolicyRecord[] = [];
        if (token) {
          try {
            const res = await api.getMyPolicies(token);
            if (!alive) return;
            issuedPolicies = res.policies;
            setPolicies(res.policies);
          } catch {
            issuedPolicies = [];
          }
        }

        const issuedSet = buildIssuedQuoteIdSet(issuedPolicies, localPaid);
        if (payment?.paid && payment.quote_id) {
          issuedSet.add(payment.quote_id);
        }

        if (!alive) return;
        setIssuedQuoteIds(Array.from(issuedSet));
        setSavedQuotes(getUnpaidSavedQuotes(user?.email, issuedSet));
      } finally {
        if (alive) setQuotesLoading(false);
      }
    }

    void loadQuotes();
    return () => {
      alive = false;
    };
  }, [user?.email, token, quote, payment?.paid, payment?.quote_id]);

  useEffect(() => {
    if (displayQuotes.length === 0) {
      setSelectedQuoteId(null);
      return;
    }
    setSelectedQuoteId((current) => {
      if (current && displayQuotes.some((q) => q.quote_id === current)) return current;
      if (quote && displayQuotes.some((q) => q.quote_id === quote.quote_id)) return quote.quote_id;
      return displayQuotes[0].quote_id;
    });
  }, [displayQuotes, quote]);

  function onAction(id: string, to?: string) {
    if (to) {
      navigate(to);
      return;
    }
    setNotice(ACTION_MESSAGES[id] ?? "We'll open this for you shortly.");
  }

  return (
    <div className="screen has-nav screen-customer">
      <CustomerPageHeader
        title="Policies"
        subtitle="Manage cover, renewals, and your saved quotes"
        icon={<HeaderIconPolicies />}
        accent="teal"
        metrics={[
          { label: "Saved quotes", value: displayQuotes.length, tone: "success" },
          {
            label: "Ready to pay",
            value: displayQuotes.length,
            tone: "warning",
          },
        ]}
      />

      <CustomerTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "manage", label: "Manage" },
          { value: "quotes", label: "Your quotes" },
        ]}
      />

      {tab === "manage" && (
        <>
          <section className="manage-hero" aria-label="Manage your policy online">
            <div className="manage-hero-panel">
              <h2>Manage your policy online</h2>
              <p>
                Existing customers can make a claim or change, renew and cancel their
                policy online.
              </p>
            </div>
          </section>

          <CustomerPanel title="Your policy NFTs" description="Tokenized insurance certificates on Ethereum Sepolia" padding>
            {policies.length > 0 ? (
              <div className="stack" style={{ gap: 12 }}>
                {policies.map((policy) => (
                  <div className="quote-card" key={policy.policy_id}>
                    <span className="muted">
                      {policy.mint_status === "MINTED" ? "NFT minted" : policy.mint_status ?? "Pending mint"}
                    </span>
                    <strong>{policy.product_title ?? policy.policy_number}</strong>
                    <p className="muted" style={{ margin: "4px 0 0" }}>
                      Policy {policy.policy_number} · {policy.status}
                    </p>
                    {policy.token_id ? (
                      <p className="muted" style={{ margin: "4px 0 0" }}>
                        Token #{policy.token_id}
                        {policy.wallet_address ? ` · ${policy.wallet_address.slice(0, 10)}…` : ""}
                      </p>
                    ) : null}
                    {policy.explorer_url ? (
                      <a className="btn-link" href={policy.explorer_url} target="_blank" rel="noreferrer">
                        View on Sepolia explorer
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                No tokenized policies yet. Complete payment after linking your wallet to mint your policy NFT.
              </p>
            )}
          </CustomerPanel>

          <CustomerPanel title="What would you like to do today?" padding>
            <div className="manage-btn-grid">
              {PRIMARY_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="manage-btn manage-btn-primary"
                  onClick={() => onAction(action.id, action.to)}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="manage-btn-grid manage-btn-grid-secondary" style={{ marginTop: 10 }}>
              {SECONDARY_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="manage-btn manage-btn-secondary"
                  onClick={() => onAction(action.id)}
                >
                  {action.label}
                </button>
              ))}
            </div>

            {notice ? (
              <p className="manage-notice" role="status" style={{ marginTop: 12 }}>
                {notice}
              </p>
            ) : null}
          </CustomerPanel>
        </>
      )}

      {tab === "quotes" && (
        <CustomerPanel
          title="Your quotes"
          description="Unpaid quotes linked to your account"
          toolbar={
            <button type="button" className="btn-link" onClick={() => navigate("/marketplace")}>
              Browse products
            </button>
          }
        >
          {demoSubmitted ? (
            <p className="manage-notice" role="status">
              Demo quote submitted — saved under your account.
            </p>
          ) : null}
          {payment?.paid ? (
            <p className="manage-notice" role="status">
              Payment received{payment.session_id ? ` · ${payment.session_id}` : ""}. Your
              policy has been issued and moved out of this list.
            </p>
          ) : null}
          {quotesLoading ? (
            <p className="muted" style={{ margin: 0 }}>
              Loading your quotes…
            </p>
          ) : displayQuotes.length > 0 ? (
            <div className="stack" style={{ gap: 12 }}>
              {displayQuotes.map((q) => {
                const isSelected = selectedQuote?.quote_id === q.quote_id;
                return (
                  <button
                    type="button"
                    key={q.quote_id}
                    className={`quote-card quote-card-selectable${isSelected ? " quote-card-selected" : ""}`}
                    onClick={() => setSelectedQuoteId(q.quote_id)}
                    aria-pressed={isSelected}
                  >
                    <span className="muted">
                      {isSelected ? "Selected quote" : "Saved quote"}
                      {quote?.quote_id === q.quote_id ? " · Just added" : ""}
                    </span>
                    <strong>{q.product_title}</strong>
                    <p className="muted" style={{ margin: "4px 0 0" }}>
                      {q.category} · £{q.estimated_premium.toFixed(2)} / {q.price_unit}
                    </p>
                    <p className="muted" style={{ margin: "4px 0 0" }}>
                      Ref: {quoteToPolicyRef(q.quote_id)} · ID: {q.quote_id}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              No unpaid quotes. Browse the marketplace for a new quote, or check the Manage tab
              for active cover.
            </p>
          )}

          {selectedQuote ? (
            <div style={{ marginTop: 14 }}>
              <CustomerPanel
                title="Pay first premium"
                description={`Complete payment for ${selectedQuote.product_title} using your wallet or Stripe.`}
                padding
              >
                <PayQuoteButton quote={selectedQuote} label="Pay first premium with Stripe" />
                <button
                  type="button"
                  className="btn-link"
                  style={{ marginTop: 10 }}
                  onClick={() => navigate(`/quote/${selectedQuote.product_id}`)}
                >
                  Review quote details
                </button>
              </CustomerPanel>
            </div>
          ) : null}

          {displayQuotes.length > 0 ? (
            <button
              type="button"
              className="btn-link"
              style={{ marginTop: 12 }}
              onClick={() => navigate("/compare")}
            >
              Compare with other quotes
            </button>
          ) : null}

          <button
            className="btn-primary"
            type="button"
            style={{ marginTop: 14 }}
            onClick={() => navigate("/marketplace")}
          >
            Browse products
          </button>
        </CustomerPanel>
      )}

      <AssistantBar screen="marketplace" />
      <BottomNav active="policies" />
    </div>
  );
}

export function ClaimsPage() {
  const { user, token } = useSession();
  const [tab, setTab] = useState<"new" | "track">("new");
  const [claims, setClaims] = useState<
    Awaited<ReturnType<typeof api.listClaims>>["claims"]
  >([]);
  const [policies, setPolicies] = useState<CustomerPolicy[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [policyRef, setPolicyRef] = useState("");
  const [category, setCategory] = useState("Property");
  const [amount, setAmount] = useState("250");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [demoFilling, setDemoFilling] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedPolicy = useMemo(
    () => policies.find((p) => p.quote_id === selectedQuoteId) ?? policies[0],
    [policies, selectedQuoteId],
  );

  const myPolicyRefs = useMemo(
    () => new Set(policies.map((p) => p.policy_ref)),
    [policies],
  );

  const visibleClaims = useMemo(() => {
    if (policies.length === 0) return claims;
    return claims.filter((c) => myPolicyRefs.has(c.policy_ref));
  }, [claims, policies, myPolicyRefs]);

  useEffect(() => {
    let alive = true;

    async function loadPolicies() {
      const mine = await loadIssuedCustomerPolicies(token ?? undefined, user?.email);
      if (!alive) return;
      setPolicies(mine);
      if (mine.length > 0) {
        const first = mine[0];
        setSelectedQuoteId(first.quote_id);
        setPolicyRef(first.policy_ref);
        setCategory(first.category || "Property");
      }
    }

    void loadPolicies();
    return () => {
      alive = false;
    };
  }, [user?.email, token]);

  function applyPolicy(policy: CustomerPolicy) {
    setSelectedQuoteId(policy.quote_id);
    setPolicyRef(policy.policy_ref);
    setCategory(policy.category);
  }

  async function loadClaims() {
    setLoading(true);
    try {
      const res = await api.listClaims();
      setClaims(res.claims);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Claims service unavailable. Start claims-service on port 8085.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClaims();
  }, []);

  async function runDemoFill() {
    if (!user || demoFilling || !selectedPolicy) return;
    setDemoFilling(true);
    setSubmitError(null);
    setNotice(null);
    const demo = buildClaimDemoForPolicy(selectedPolicy, user);
    try {
      setPolicyRef(demo.policy_ref);
      await sleep(280);
      setCategory(demo.category);
      await sleep(280);
      setAmount(demo.amount);
      await sleep(280);
      setDescription(demo.description);
      setNotice(
        `Demo claim filled for ${selectedPolicy.product_title} (${selectedPolicy.policy_ref}).`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Demo fill failed");
    } finally {
      setDemoFilling(false);
    }
  }

  async function startClaim() {
    setSubmitting(true);
    setSubmitError(null);
    setNotice(null);
    try {
      const claim = await api.createClaim({
        policy_ref: policyRef.trim() || selectedPolicy?.policy_ref || "POL-HOME-001",
        customer_name: user?.full_name || "Customer",
        category,
        amount_claimed: Number(amount) || 0,
        description: description.trim() || "Claim submitted from the app",
      });
      setNotice(`Claim ${claim.id} submitted.`);
      setDescription("");
      await loadClaims();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit claim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen has-nav screen-customer">
      <CustomerPageHeader
        title="Claims"
        subtitle="Start a new claim or track progress on existing ones"
        icon={<HeaderIconClaims />}
        metrics={[
          { label: "Your claims", value: visibleClaims.length, tone: "success" },
          { label: "Policies", value: policies.length },
        ]}
        actions={
          <button
            type="button"
            className="demo-fill-btn"
            style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.12)" }}
            disabled={demoFilling || submitting || !user || policies.length === 0}
            onClick={() => void runDemoFill()}
          >
            {demoFilling ? "Filling…" : "Demo fill"}
          </button>
        }
      />

      <CustomerTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "new", label: "Start claim" },
          { value: "track", label: "Track claims" },
        ]}
      />

      {tab === "new" && (
        <CustomerPanel title="Claims centre" description="Submit a claim against your saved policies">
          {demoFilling ? (
            <p className="demo-fill-banner" role="status">
              Filling claim for <strong>{selectedPolicy?.product_title}</strong>…
            </p>
          ) : null}

          {policies.length === 0 ? (
            <p className="manage-notice" role="status">
              No policies yet — get a quote from the marketplace first, then return here to
              start a claim.
            </p>
          ) : (
            <div className="claim-policy-picker">
              <label>
                Your policy
                <select
                  value={selectedQuoteId}
                  onChange={(e) => {
                    const policy = policies.find((p) => p.quote_id === e.target.value);
                    if (policy) applyPolicy(policy);
                  }}
                  aria-label="Select policy to claim on"
                  disabled={demoFilling}
                >
                  {policies.map((p) => (
                    <option key={p.quote_id} value={p.quote_id}>
                      {p.product_title} · {p.policy_ref}
                      {p.paid ? " · Paid" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="claim-form">
            <label>
              Policy reference
              <input
                value={policyRef}
                onChange={(e) => setPolicyRef(e.target.value)}
                aria-label="Policy reference"
                disabled={demoFilling}
                placeholder={selectedPolicy?.policy_ref ?? "POL-…"}
              />
            </label>
            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Claim category"
                disabled={demoFilling}
              >
                <option>Property</option>
                <option>Vehicle</option>
                <option>Health</option>
                <option>Pet</option>
                <option>Travel</option>
                <option>Life</option>
                <option>Parametric</option>
                <option>Home</option>
              </select>
            </label>
            <label>
              Amount claimed (£)
              <input
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Amount claimed"
                disabled={demoFilling}
              />
            </label>
            <label>
              What happened
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the incident"
                aria-label="Claim description"
                disabled={demoFilling}
              />
            </label>
          </div>

          {submitError ? (
            <p className="error" role="alert">
              {submitError}
            </p>
          ) : null}
          {notice ? (
            <p className="manage-notice" role="status">
              {notice}
            </p>
          ) : null}

          <button
            className="btn-primary"
            type="button"
            style={{ marginTop: 12 }}
            disabled={submitting || demoFilling}
            onClick={() => void startClaim()}
          >
            {submitting ? "Submitting…" : "Start a claim"}
          </button>
        </CustomerPanel>
      )}

      {tab === "track" && (
        <CustomerPanel title="Your claims" description="Status and details for claims on your policies">
          {loadError ? (
            <p className="error" role="alert">
              {loadError}
            </p>
          ) : null}
          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && visibleClaims.length === 0 ? (
            <p className="muted">No claims yet for your policies.</p>
          ) : null}
          <div className="claim-list">
            {visibleClaims.map((claim) => (
              <article className="quote-card" key={claim.id}>
                <strong>{claim.id}</strong>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  {claim.category} · {claim.status} · £
                  {Number(claim.amount_claimed).toFixed(2)}
                </p>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  {claim.policy_ref}
                  {claim.description ? ` · ${claim.description}` : ""}
                </p>
              </article>
            ))}
          </div>
        </CustomerPanel>
      )}

      <AssistantBar screen="marketplace" />
      <BottomNav active="claims" />
    </div>
  );
}

function formatKyc(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { token, user, updateUser, clear } = useSession();
  const [tab, setTab] = useState<"account" | "wallet">("account");
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    api
      .me(token)
      .then((res) => {
        if (!alive) return;
        setProfile(res);
        updateUser(res);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        if (user) {
          setProfile(user);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || tab !== "wallet") return;
    api
      .getWallet(token)
      .then((res) => {
        if (res.status !== "connected" || !res.address) return;
        setProfile((current) => {
          if (!current) return current;
          const next = {
            ...current,
            wallet: {
              address: res.address ?? "",
              status: res.status,
              balance_gbp: res.balance_gbp,
              currency: res.currency,
            },
          };
          updateUser(next);
          return next;
        });
      })
      .catch(() => undefined);
  }, [token, tab]);

  function logout() {
    clear();
    navigate("/login", { replace: true });
  }

  const initials =
    profile?.full_name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <div className="screen has-nav screen-customer">
      <CustomerPageHeader
        title={profile?.full_name ?? "Profile"}
        subtitle={profile?.email ?? "Your account and preferences"}
        icon={
          profile ? (
            <span className="customer-avatar-lg">{initials}</span>
          ) : (
            <HeaderIconProfile />
          )
        }
        accent="slate"
        metrics={
          profile
            ? [
                { label: "KYC", value: formatKyc(profile.kyc_status), tone: "success" },
                { label: "Wallet", value: profile.wallet ? "Linked" : "None" },
              ]
            : undefined
        }
      />

      <CustomerTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "account", label: "Account" },
          { value: "wallet", label: "Wallet" },
        ]}
      />

      {loading && !profile ? (
        <p className="muted">Loading your profile…</p>
      ) : null}

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {profile ? (
        <>
          {tab === "account" && (
            <CustomerPanel title="Account details" description="Personal information linked to your cover">
              <dl className="profile-dl">
                <div>
                  <dt>Full name</dt>
                  <dd>{profile.full_name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{profile.email}</dd>
                </div>
                <div>
                  <dt>Mobile</dt>
                  <dd>{profile.mobile_number}</dd>
                </div>
                <div>
                  <dt>Customer ID</dt>
                  <dd className="mono">{profile.id}</dd>
                </div>
              </dl>
            </CustomerPanel>
          )}

          {tab === "wallet" && (
            <CustomerPanel title="Digital wallet" description="Policy tokens and payout destination">
              {profile.wallet ? (
                <dl className="profile-dl">
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <span className={`customer-status-pill${profile.wallet.status === "connected" ? " connected" : ""}`}>
                        {formatKyc(profile.wallet.status)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd className="mono">{profile.wallet.address}</dd>
                  </div>
                  {typeof profile.wallet.balance_gbp === "number" ? (
                    <div>
                      <dt>Balance</dt>
                      <dd>
                        {new Intl.NumberFormat("en-GB", {
                          style: "currency",
                          currency: profile.wallet.currency ?? "GBP",
                        }).format(profile.wallet.balance_gbp)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No wallet connected yet.
                </p>
              )}
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: 12 }}
                onClick={() => navigate("/wallet")}
              >
                Open wallet setup
              </button>
            </CustomerPanel>
          )}

          <button className="btn-primary" type="button" onClick={logout}>
            Log out
          </button>
        </>
      ) : null}

      <AssistantBar screen="marketplace" />
      <BottomNav active="profile" />
    </div>
  );
}
