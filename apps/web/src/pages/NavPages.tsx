import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, type AuthUser, type QuoteEstimate } from "../api";
import { buildClaimDemoForPolicy, sleep } from "../claimsDemoFill";
import { saveQuoteToCompare, readCompareQuotes } from "../compareBasket";
import { getCustomerPolicies, quoteToPolicyRef, type CustomerPolicy } from "../customerPolicies";
import { AssistantBar, BottomNav, StepHeader } from "../components";
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
  const { user } = useSession();
  const quote = (location.state as { quote?: QuoteEstimate } | null)?.quote;
  const demoSubmitted = Boolean(
    (location.state as { demoSubmitted?: boolean } | null)?.demoSubmitted,
  );
  const payment = (
    location.state as { payment?: { paid?: boolean; session_id?: string } } | null
  )?.payment;
  const [notice, setNotice] = useState<string | null>(null);
  const [savedQuotes, setSavedQuotes] = useState<QuoteEstimate[]>([]);

  useEffect(() => {
    if (quote) saveQuoteToCompare(quote);
  }, [quote]);

  useEffect(() => {
    const mine = getCustomerPolicies(user?.email);
    setSavedQuotes(mine.map((p) => {
      const all = readCompareQuotes();
      return all.find((q) => q.quote_id === p.quote_id)!;
    }).filter(Boolean));
  }, [user?.email, quote]);

  function onAction(id: string, to?: string) {
    if (to) {
      navigate(to);
      return;
    }
    setNotice(ACTION_MESSAGES[id] ?? "We'll open this for you shortly.");
  }

  return (
    <div className="screen has-nav">
      <StepHeader title="Policies" />

      <section className="manage-hero" aria-label="Manage your policy online">
        <div className="manage-hero-panel">
          <h2>Manage your policy online</h2>
          <p>
            Existing customers can make a claim or change, renew and cancel their
            policy online.
          </p>
        </div>
      </section>

      <div className="manage-actions">
        <h3 className="manage-actions-title">What would you like to do today?</h3>

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

        <div className="manage-btn-grid manage-btn-grid-secondary">
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
          <p className="manage-notice" role="status">
            {notice}
          </p>
        ) : null}
      </div>

      <h2 className="section-title" style={{ marginTop: 8 }}>
        Your quotes
      </h2>
      {demoSubmitted ? (
        <p className="manage-notice" role="status">
          Demo quote submitted — saved under your account.
        </p>
      ) : null}
      {payment?.paid ? (
        <p className="manage-notice" role="status">
          Payment received{payment.session_id ? ` · ${payment.session_id}` : ""}. Your
          cover can now be treated as paid for this demo.
        </p>
      ) : null}
      {savedQuotes.length > 0 ? (
        <div className="stack" style={{ gap: 12, marginBottom: 16 }}>
          {savedQuotes.map((q) => (
            <div className="quote-card" key={q.quote_id}>
              <span className="muted">
                Saved quote
                {quote?.quote_id === q.quote_id ? " · Just added" : ""}
                {payment?.paid && quote?.quote_id === q.quote_id ? " · Paid" : ""}
              </span>
              <strong>{q.product_title}</strong>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                {q.category} · £{q.estimated_premium.toFixed(2)} / {q.price_unit}
              </p>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                Ref: {quoteToPolicyRef(q.quote_id)} · ID: {q.quote_id}
              </p>
            </div>
          ))}
        </div>
      ) : quote ? (
        <div className="quote-card">
          <span className="muted">Saved quote{payment?.paid ? " · Paid" : ""}</span>
          <strong>{quote.product_title}</strong>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {quote.category} · £{quote.estimated_premium.toFixed(2)} /{" "}
            {quote.price_unit}
          </p>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Ref: {quoteToPolicyRef(quote.quote_id)} · ID: {quote.quote_id}
          </p>
          <button
            type="button"
            className="btn-link"
            style={{ marginTop: 8 }}
            onClick={() => navigate("/compare")}
          >
            Compare with other quotes
          </button>
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          No saved quote yet. Browse the marketplace to get started.
        </p>
      )}

      {savedQuotes.length > 0 ? (
        <button
          type="button"
          className="btn-link"
          style={{ marginBottom: 16 }}
          onClick={() => navigate("/compare")}
        >
          Compare with other quotes
        </button>
      ) : null}

      <button
        className="btn-primary"
        type="button"
        onClick={() => navigate("/marketplace")}
      >
        Browse products
      </button>

      <AssistantBar screen="marketplace" />
      <BottomNav active="policies" />
    </div>
  );
}

export function ClaimsPage() {
  const { user } = useSession();
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
  const [error, setError] = useState<string | null>(null);
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
    const mine = getCustomerPolicies(user?.email);
    setPolicies(mine);
    if (mine.length > 0) {
      const first = mine[0];
      setSelectedQuoteId(first.quote_id);
      setPolicyRef(first.policy_ref);
      setCategory(first.category);
    }
  }, [user?.email]);

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
      setError(null);
    } catch (err) {
      setError(
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
    setError(null);
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
      setError(err instanceof Error ? err.message : "Demo fill failed");
    } finally {
      setDemoFilling(false);
    }
  }

  async function startClaim() {
    setSubmitting(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : "Could not submit claim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen has-nav">
      <StepHeader title="Claims" />
      <div className="claims-header-row">
        <div>
          <h2 className="section-title">Claims centre</h2>
          <p className="muted">
            Start or track a claim against your saved policies and quotes.
          </p>
        </div>
        <button
          type="button"
          className="demo-fill-btn"
          disabled={demoFilling || submitting || !user || policies.length === 0}
          onClick={() => void runDemoFill()}
        >
          {demoFilling ? "Filling…" : "Demo fill"}
        </button>
      </div>

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

      {error ? (
        <p className="error" role="alert">
          {error}
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
        disabled={submitting || demoFilling}
        onClick={() => void startClaim()}
      >
        {submitting ? "Submitting…" : "Start a claim"}
      </button>

      <h3 className="section-title" style={{ marginTop: 16 }}>
        Your claims
      </h3>
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
    <div className="screen has-nav">
      <StepHeader title="Profile" />

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
          <div className="profile-hero">
            <div className="profile-avatar" aria-hidden>
              {initials}
            </div>
            <div>
              <h2 className="profile-name">{profile.full_name}</h2>
              <p className="profile-kyc">
                KYC: {formatKyc(profile.kyc_status)}
              </p>
            </div>
          </div>

          <div className="profile-card">
            <h3>Account details</h3>
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
          </div>

          <div className="profile-card">
            <h3>Digital wallet</h3>
            {profile.wallet ? (
              <dl className="profile-dl">
                <div>
                  <dt>Status</dt>
                  <dd>{formatKyc(profile.wallet.status)}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd className="mono">{profile.wallet.address}</dd>
                </div>
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
              Open wallet
            </button>
          </div>

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
