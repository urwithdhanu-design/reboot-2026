import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, type AuthUser, type ClaimDocumentRow, type ClaimQueryRow, type CustomerPolicyRecord, type InsuranceClaim, type QuoteEstimate } from "../api";
import { buildClaimDemoForPolicy, sleep } from "../claimsDemoFill";
import { saveQuoteToCompare } from "../compareBasket";
import {
  buildIssuedQuoteIdSet,
  getUnpaidSavedQuotes,
  mergeDisplayQuotes,
  isClaimablePolicy,
  loadIssuedCustomerPolicies,
  markQuotePaid,
  quoteToPolicyRef,
  readPaidQuoteIds,
  type CustomerPolicy,
} from "../customerPolicies";
import { AssistantBar, CustomerAppShell, CustomerPageHeader, CustomerPanel, CustomerTabs, HeaderIconClaims, HeaderIconPolicies, HeaderIconProfile } from "../components";
import { CancelPolicyWizard } from "../components/CancelPolicyWizard";
import { KycOnboardingPrompt } from "../components/KycOnboardingPrompt";
import { isCancelledPolicy } from "../customerPolicies";
import { needsKycAttention } from "../kycStatus";
import { useSession } from "../session";

const PRIMARY_ACTIONS: { id: string; label: string; to?: string }[] = [
  { id: "compare", label: "Compare policies & quotes", to: "/compare" },
  { id: "renewal", label: "Manage renewal" },
  { id: "claim", label: "Make a claim", to: "/claims" },
  { id: "cancel", label: "Cancel policy" },
];

const ACTION_MESSAGES: Record<string, string> = {
  renewal: "Renewal options will appear here when your policy is due.",
};

const RENEWAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function policyExpiresWithinRenewalWindow(policy: CustomerPolicyRecord): boolean {
  if (!policy.cover_expires_at) return false;
  try {
    const expiresAt = new Date(policy.cover_expires_at).getTime();
    if (Number.isNaN(expiresAt)) return false;
    const now = Date.now();
    if (expiresAt < now) return false;
    return expiresAt - now <= RENEWAL_WINDOW_MS;
  } catch {
    return false;
  }
}

function visiblePrimaryActions(
  policies: CustomerPolicyRecord[],
): typeof PRIMARY_ACTIONS {
  const hasPolicies = policies.length > 0;
  const showRenewal = policies.some(policyExpiresWithinRenewalWindow);
  return PRIMARY_ACTIONS.filter((action) => {
    if (action.id === "compare") return !hasPolicies;
    if (action.id === "renewal") return showRenewal;
    return true;
  });
}

function policyMintStatusLabel(policy: CustomerPolicyRecord): string {
  const mint = (policy.mint_status ?? "").toUpperCase();
  if (mint === "MINTED") {
    return "Active digital policy";
  }
  if (mint === "PENDING_WALLET") return "Premium paid · Awaiting wallet link";
  if (mint === "PENDING") return "Premium paid · Policy being issued";
  if (mint === "FAILED") return "Premium paid · Policy issue failed — contact support";
  return "Premium paid · Issued";
}

function policyCoverStatus(policy: CustomerPolicyRecord): string {
  if (isCancelledPolicy(policy)) return "Cancelled";
  const mint = (policy.mint_status ?? "").toUpperCase();
  if (mint !== "MINTED") return "Policy being issued";
  if (policy.coverage_pending_mint || !policy.cover_start_at) {
    return "Awaiting cover activation";
  }
  if (policy.coverage_expired) return "Cover expired";
  if (policy.cover_expires_at) {
    try {
      if (new Date(policy.cover_expires_at).getTime() < Date.now()) return "Cover expired";
    } catch {
      // ignore
    }
  }
  if (policy.coverage_active || policy.cover_start_at) {
    return "Cover active";
  }
  return policy.status;
}

function formatPolicyDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function policyStatusTone(coverLabel: string): "active" | "pending" | "expired" | "default" {
  const lower = coverLabel.toLowerCase();
  if (lower.includes("cancelled")) return "expired";
  if (lower.includes("active")) return "active";
  if (lower.includes("expired")) return "expired";
  if (lower.includes("awaiting") || lower.includes("being issued") || lower.includes("activating")) {
    return "pending";
  }
  return "default";
}

function policySortRank(policy: CustomerPolicyRecord): number {
  const tone = policyStatusTone(policyCoverStatus(policy));
  if (tone === "active") return 0;
  if (tone === "pending") return 1;
  if (tone === "expired") return 2;
  return 3;
}

function PolicyCard({ policy }: { policy: CustomerPolicyRecord }) {
  const [showDigital, setShowDigital] = useState(false);
  const isCanton =
    policy.ledger_type === "canton"
    || (policy.blockchain_network?.toLowerCase().includes("canton") ?? false);
  const mintLabel = policyMintStatusLabel(policy);
  const coverLabel = policyCoverStatus(policy);
  const tone = policyStatusTone(coverLabel);
  const hasDigital =
    Boolean(policy.token_id)
    || Boolean(policy.transaction_hash && isCanton)
    || Boolean(policy.explorer_url)
    || Boolean(policy.wallet_address);

  return (
    <article className={`policy-card policy-card--${tone}`}>
      <div className="policy-card-head">
        <div className="policy-card-title-block">
          <div className="policy-card-eyebrow">
            {policy.product_category ?? "Insurance"}
          </div>
          <h3 className="policy-card-title">{policy.product_title ?? policy.policy_number}</h3>
          <p className="policy-card-ref">{policy.policy_number}</p>
        </div>
        <span className={`policy-status-badge policy-status-badge--${tone}`}>{coverLabel}</span>
      </div>

      <div className="policy-card-dates" aria-label="Cover period">
        <div className="policy-card-date">
          <span className="policy-card-date-label">From</span>
          <strong>
            {policy.cover_start_at
              ? formatPolicyDate(policy.cover_start_at)
              : policy.mint_status === "MINTED"
                ? "Activating…"
                : "When issued"}
          </strong>
        </div>
        <div className="policy-card-date-sep" aria-hidden />
        <div className="policy-card-date">
          <span className="policy-card-date-label">Until</span>
          <strong>{policy.cover_expires_at ? formatPolicyDate(policy.cover_expires_at) : "—"}</strong>
        </div>
      </div>

      {policy.coverage_summary ? (
        <p className="policy-card-summary">{policy.coverage_summary}</p>
      ) : null}

      <dl className="policy-meta-grid">
        {policy.coverage_limit_gbp != null ? (
          <div className="policy-meta-item">
            <dt>Cover limit</dt>
            <dd>£{Number(policy.coverage_limit_gbp).toLocaleString("en-GB")}</dd>
          </div>
        ) : null}
        <div className="policy-meta-item">
          <dt>Digital policy</dt>
          <dd>{mintLabel}</dd>
        </div>
      </dl>

      {hasDigital ? (
        <div className="policy-card-digital">
          <button
            type="button"
            className="policy-card-digital-toggle"
            aria-expanded={showDigital}
            onClick={() => setShowDigital((v) => !v)}
          >
            {showDigital ? "Hide" : "Show"} digital details
          </button>
          {showDigital ? (
            <div className="policy-card-digital-body">
              {policy.token_id ? (
                <p>
                  Policy ID #{policy.token_id}
                  {policy.wallet_address ? ` · ${policy.wallet_address.slice(0, 10)}…` : ""}
                </p>
              ) : null}
              {policy.transaction_hash && isCanton ? (
                <p>Reference: {policy.transaction_hash.slice(0, 18)}…</p>
              ) : null}
              {policy.explorer_url ? (
                <a className="btn-link" href={policy.explorer_url} target="_blank" rel="noreferrer">
                  View on Sepolia explorer
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

async function fetchMyPolicies(token: string): Promise<CustomerPolicyRecord[]> {
  const res = await api.getMyPolicies(token);
  return res.policies;
}

export function PoliciesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useSession();
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
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [issuedQuoteIds, setIssuedQuoteIds] = useState<string[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [cancelWizardOpen, setCancelWizardOpen] = useState(false);

  const displayQuotes = useMemo(() => {
    const issued = new Set(issuedQuoteIds);
    return mergeDisplayQuotes(savedQuotes, quote, issued);
  }, [savedQuotes, quote, issuedQuoteIds]);

  const freshlyAddedQuoteId = useMemo(() => {
    if (!quote) return null;
    if (issuedQuoteIds.includes(quote.quote_id)) return null;
    const alreadySaved = savedQuotes.some((q) => q.quote_id === quote.quote_id);
    return alreadySaved ? null : quote.quote_id;
  }, [quote, savedQuotes, issuedQuoteIds]);

  const sortedPolicies = useMemo(
    () => [...policies].sort((a, b) => policySortRank(a) - policySortRank(b)),
    [policies],
  );

  const selectedQuote = useMemo(
    () => displayQuotes.find((q) => q.quote_id === selectedQuoteId) ?? displayQuotes[0] ?? null,
    [displayQuotes, selectedQuoteId],
  );

  useEffect(() => {
    if (!token) {
      setPolicies([]);
      return;
    }
    setPoliciesLoading(true);
    void fetchMyPolicies(token)
      .then((rows) => setPolicies(rows))
      .catch(() => setPolicies([]))
      .finally(() => setPoliciesLoading(false));
  }, [token, payment?.paid]);

  useEffect(() => {
    if (!token || !payment?.paid) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void fetchMyPolicies(token)
        .then((rows) => setPolicies(rows))
        .catch(() => undefined);
      if (attempts >= 6) {
        window.clearInterval(timer);
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [token, payment?.paid, payment?.quote_id]);

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
            issuedPolicies = await fetchMyPolicies(token);
            if (!alive) return;
            setPolicies(issuedPolicies);
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
    if (id === "cancel") {
      if (!token) {
        setNotice("Sign in to cancel a policy online.");
        return;
      }
      setCancelWizardOpen(true);
      setNotice(null);
      return;
    }
    setNotice(ACTION_MESSAGES[id] ?? "We'll open this for you shortly.");
  }

  const activeCoverCount = policies.filter(
    (p) => policyStatusTone(policyCoverStatus(p)) === "active",
  ).length;

  const primaryActions = useMemo(
    () => visiblePrimaryActions(policies),
    [policies],
  );

  return (
    <CustomerAppShell active="policies">
      <CustomerPageHeader
        title="Policies"
        subtitle="Active cover, saved quotes, and policy actions in one place"
        icon={<HeaderIconPolicies />}
        accent="teal"
        metrics={[
          {
            label: "Active cover",
            value: activeCoverCount,
            tone: activeCoverCount > 0 ? "success" : undefined,
          },
          { label: "Total policies", value: policies.length },
          {
            label: "Saved quotes",
            value: displayQuotes.length,
            tone: displayQuotes.length > 0 ? "warning" : undefined,
          },
        ]}
      />

      <section className="policy-actions-bar" aria-label="Policy actions">
        <div className="policy-actions-primary">
          {primaryActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="policy-action-chip policy-action-chip--primary"
              onClick={() => onAction(action.id, action.to)}
            >
              {action.label}
            </button>
          ))}
        </div>
        {notice ? (
          <p className="manage-notice policy-actions-notice" role="status">
            {notice}
          </p>
        ) : null}
      </section>

      <CustomerPanel
        title="Active cover"
        description="Insurance you hold with us — live policies, cover dates, and digital certificates"
        padding
      >
        <p className="policy-section-intro">
          {policies.length > 0
            ? "These are your issued policies. Check status and cover dates at a glance."
            : "When you buy cover, your policies appear here with start dates and digital certificates."}
        </p>
        {policiesLoading ? (
          <p className="policy-empty muted">Loading your policies…</p>
        ) : sortedPolicies.length > 0 ? (
          <div className="policy-card-list">
            {sortedPolicies.map((policy) => (
              <PolicyCard key={policy.policy_id} policy={policy} />
            ))}
          </div>
        ) : (
          <div className="policy-empty policy-empty--card">
            <div className="policy-empty-icon" aria-hidden>
              <HeaderIconPolicies />
            </div>
            <p className="policy-empty-title">No active cover yet</p>
            <p className="policy-empty-hint">
              Get a quote from the marketplace, complete checkout, and your policy will show up here
              once issued.
            </p>
            <button type="button" className="btn-primary" onClick={() => navigate("/marketplace")}>
              Get a quote
            </button>
          </div>
        )}
      </CustomerPanel>

      <CustomerPanel
        title="Saved quotes"
        description={
          displayQuotes.length > 0
            ? `${displayQuotes.length} quote${displayQuotes.length === 1 ? "" : "s"} waiting for review — select one to continue`
            : "Quotes you've started but haven't purchased yet"
        }
        toolbar={
          <button type="button" className="btn-link" onClick={() => navigate("/marketplace")}>
            Browse products
          </button>
        }
        padding
      >
        {demoSubmitted ? (
          <p className="manage-notice" role="status">
            Demo quote submitted — saved under your account.
          </p>
        ) : null}
        {payment?.paid ? (
          <p className="manage-notice" role="status">
            Payment received{payment.session_id ? ` · ${payment.session_id}` : ""}. Your
            policy has been issued and moved to Active cover.
          </p>
        ) : null}
        {quotesLoading ? (
          <p className="policy-empty muted">Loading your quotes…</p>
        ) : displayQuotes.length > 0 ? (
          <>
            <div className="policy-quote-list">
              {displayQuotes.map((q) => {
                const isSelected = selectedQuote?.quote_id === q.quote_id;
                const isNew = freshlyAddedQuoteId === q.quote_id;
                return (
                  <button
                    type="button"
                    key={q.quote_id}
                    className={`policy-quote-card${isSelected ? " policy-quote-card--selected" : ""}`}
                    onClick={() => setSelectedQuoteId(q.quote_id)}
                    aria-pressed={isSelected}
                  >
                    <div className="policy-quote-card-inner">
                      <span className="policy-quote-card-check" aria-hidden>
                        {isSelected ? "✓" : ""}
                      </span>
                      <div className="policy-quote-card-body">
                        <div className="policy-quote-card-head">
                          <strong className="policy-quote-card-title">{q.product_title}</strong>
                          <span className="policy-quote-card-price">
                            £{q.estimated_premium.toFixed(2)}
                            <span className="policy-quote-card-unit">/{q.price_unit}</span>
                          </span>
                        </div>
                        <div className="policy-quote-card-meta-row">
                          <span className="policy-quote-card-category">{q.category}</span>
                          {isNew ? (
                            <span className="policy-quote-card-badge">New</span>
                          ) : null}
                        </div>
                        <p className="policy-quote-card-ref">
                          Ref {quoteToPolicyRef(q.quote_id)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedQuote ? (
              <div className="policy-quote-selected-bar">
                <div className="policy-quote-selected-summary">
                  <p className="policy-quote-selected-label">Selected quote</p>
                  <p className="policy-quote-selected-title">{selectedQuote.product_title}</p>
                  <p className="policy-quote-selected-price">
                    £{selectedQuote.estimated_premium.toFixed(2)}
                    <span>/{selectedQuote.price_unit}</span>
                  </p>
                </div>
                <div className="policy-quote-actions">
                  <button
                    type="button"
                    className="btn-primary policy-quote-review-btn"
                    onClick={() => navigate(`/quote/${selectedQuote.product_id}`)}
                  >
                    Review quote
                  </button>
                  {displayQuotes.length > 1 ? (
                    <button type="button" className="btn-link" onClick={() => navigate("/compare")}>
                      Compare all
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="policy-empty policy-empty--card">
            <p className="policy-empty-hint">
              No saved quotes right now. Start a quote from the marketplace — it will appear here
              until you purchase cover.
            </p>
          </div>
        )}
      </CustomerPanel>

      <AssistantBar screen="marketplace" />

      {token ? (
        <CancelPolicyWizard
          open={cancelWizardOpen}
          token={token}
          policies={policies}
          onClose={() => setCancelWizardOpen(false)}
          onCancelled={(rows) => setPolicies(rows)}
        />
      ) : null}
    </CustomerAppShell>
  );
}

function formatClaimStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatParametricEventLabel(eventType?: string | null, description?: string) {
  if (eventType === "trip_cancellation") return "Trip cancellation";
  if (eventType === "flight_delay") return "Flight delay";
  if ((description ?? "").toLowerCase().includes("trip cancel")) return "Trip cancellation";
  if ((description ?? "").toLowerCase().includes("delayed")) return "Flight delay";
  return "Parametric auto-claim";
}

const CLAIMS_REFRESH_MS = 15_000;

function queryRequiresDocuments(query: ClaimQueryRow): boolean {
  return query.requires_documents === true || String(query.requires_documents) === "true";
}

function ClaimQueryReplyPanel({
  claim,
  onReplied,
}: {
  claim: InsuranceClaim;
  onReplied: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [queries, setQueries] = useState<ClaimQueryRow[]>(claim.queries ?? []);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, ClaimDocumentRow[]>>({});
  const [uploadingCount, setUploadingCount] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const openQueries = queries.filter((q) => q.status === "open");
  const openCount = claim.open_query_count ?? openQueries.length;
  const hasQueries = openCount > 0 || queries.length > 0 || (claim.queries?.length ?? 0) > 0;

  useEffect(() => {
    setQueries(claim.queries ?? []);
  }, [claim.id, claim.queries, claim.open_query_count]);

  async function refreshUploadedDocs(queryId: string) {
    try {
      const res = await api.listClaimDocuments(claim.id);
      const forQuery = res.documents.filter((d) => d.query_id === queryId);
      setUploadedDocs((prev) => ({ ...prev, [queryId]: forQuery }));
    } catch {
      // keep existing state
    }
  }

  useEffect(() => {
    if (!expanded) return;
    let alive = true;
    setLoading(true);
    api
      .listClaimQueries(claim.id)
      .then(async (res) => {
        if (!alive) return;
        setQueries(res.queries);
        setError(null);
        for (const query of res.queries) {
          if (query.status === "open") {
            await refreshUploadedDocs(query.id);
          }
        }
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Could not load queries");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [expanded, claim.id]);

  if (!hasQueries) return null;

  function docsForQuery(query: ClaimQueryRow) {
    const uploaded = uploadedDocs[query.id] ?? [];
    if (uploaded.length > 0) return uploaded.length;
    return query.document_count ?? 0;
  }

  async function onFilesSelected(query: ClaimQueryRow, files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const selected = Array.from(files).slice(0, 5);
    setUploadingCount((prev) => ({
      ...prev,
      [query.id]: (prev[query.id] ?? 0) + selected.length,
    }));
    for (const file of selected) {
      try {
        const doc = await api.uploadClaimDocument(claim.id, file, file.name, query.id);
        setUploadedDocs((prev) => ({
          ...prev,
          [query.id]: [...(prev[query.id] ?? []), doc],
        }));
      } catch (err) {
        setError(
          `${file.name}: ${err instanceof Error ? err.message : "upload failed"}`,
        );
      } finally {
        setUploadingCount((prev) => ({
          ...prev,
          [query.id]: Math.max(0, (prev[query.id] ?? 1) - 1),
        }));
      }
    }
  }

  async function submitReply(query: ClaimQueryRow) {
    const message = (replyText[query.id] ?? "").trim();
    const docCount = docsForQuery(query);
    const stillUploading = (uploadingCount[query.id] ?? 0) > 0;

    if (stillUploading) {
      setError("Please wait for document uploads to finish.");
      return;
    }
    if (queryRequiresDocuments(query) && docCount < 1) {
      setError("Attach at least one document before submitting your reply.");
      return;
    }
    if (!message && !queryRequiresDocuments(query)) {
      setError("Enter a reply message before submitting.");
      return;
    }

    setSubmitting(query.id);
    setError(null);
    try {
      await api.replyToClaimQuery(
        claim.id,
        query.id,
        message || "Please find the requested documents attached.",
      );
      setReplyText((prev) => ({ ...prev, [query.id]: "" }));
      setUploadedDocs((prev) => ({ ...prev, [query.id]: [] }));
      const res = await api.listClaimQueries(claim.id);
      setQueries(res.queries);
      onReplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit reply");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="claim-query-panel">
      {openCount > 0 ? (
        <p className="claim-query-action-badge" role="status">
          Action required — {openCount} open quer{openCount === 1 ? "y" : "ies"} from admin
        </p>
      ) : null}
      <button
        type="button"
        className="claim-query-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? "Hide" : "View"} admin queries ({queries.length || openCount})
      </button>
      {expanded ? (
        <div className="claim-query-thread">
          {loading ? <p className="muted">Loading queries…</p> : null}
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {queries.map((query) => {
            const attached = uploadedDocs[query.id] ?? [];
            const uploading = (uploadingCount[query.id] ?? 0) > 0;
            const docCount = attached.length > 0 ? attached.length : (query.document_count ?? 0);
            return (
            <div
              key={query.id}
              className={`claim-query-card${query.status === "open" ? " claim-query-card--open" : ""}`}
            >
              <p className="claim-query-admin">
                <strong>Admin:</strong> {query.admin_message}
              </p>
              {queryRequiresDocuments(query) ? (
                <p className="claim-query-docs-hint">
                  Please attach the requested documents (PDF or images, max 8 MB each).
                </p>
              ) : null}
              {query.customer_reply ? (
                <p className="claim-query-reply">
                  <strong>Your reply:</strong> {query.customer_reply}
                </p>
              ) : null}
              {query.status === "open" ? (
                <div className="claim-query-reply-form">
                  <label>
                    Your response
                    <textarea
                      value={replyText[query.id] ?? ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [query.id]: e.target.value }))
                      }
                      placeholder={
                        queryRequiresDocuments(query)
                          ? "Optional note to accompany your documents…"
                          : "Explain or provide the information requested…"
                      }
                      disabled={submitting === query.id || uploading}
                    />
                  </label>
                  <div className="claim-query-upload">
                    <label
                      htmlFor={`query-file-${query.id}`}
                      className={`claim-query-file-btn${submitting === query.id || uploading ? " claim-query-file-btn--disabled" : ""}`}
                    >
                      {uploading ? "Uploading…" : "Choose files to attach"}
                    </label>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[query.id] = el;
                      }}
                      id={`query-file-${query.id}`}
                      type="file"
                      className="sr-only"
                      multiple
                      accept="application/pdf,image/jpeg,image/png,image/gif,image/webp,.pdf"
                      onChange={(e) => {
                        void onFilesSelected(query, e.target.files);
                        e.target.value = "";
                      }}
                      disabled={submitting === query.id || uploading}
                    />
                    <p className="claim-query-upload-hint muted">
                      {queryRequiresDocuments(query)
                        ? `${docCount} document(s) attached${docCount < 1 ? " — at least 1 required" : ""}`
                        : `${docCount} document(s) attached (optional)`}
                    </p>
                  </div>
                  {attached.length > 0 ? (
                    <ul className="claim-attachments-list">
                      {attached.map((doc) => (
                        <li key={doc.id}>
                          <span>{doc.label || doc.file_name}</span>
                          <span className="muted" style={{ fontSize: "0.8rem" }}>Uploaded</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={submitting === query.id || uploading}
                    onClick={() => void submitReply(query)}
                  >
                    {submitting === query.id ? "Submitting…" : "Submit reply"}
                  </button>
                </div>
              ) : null}
            </div>
          );})}
        </div>
      ) : null}
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
  const [attachments, setAttachments] = useState<File[]>([]);

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
      const claimable = mine.filter(isClaimablePolicy);
      if (!alive) return;
      setPolicies(claimable);
      if (claimable.length > 0) {
        const first = claimable[0];
        setSelectedQuoteId(first.quote_id);
        setPolicyRef(first.policy_ref);
        setCategory(first.product_category || first.category || "Property");
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
    setCategory(policy.product_category || policy.category || "Property");
  }

  const claimAmountMax = selectedPolicy?.coverage_limit_gbp ?? undefined;

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

  useEffect(() => {
    if (tab !== "track") return;
    void loadClaims();
    const timer = window.setInterval(() => {
      void loadClaims();
    }, CLAIMS_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [tab]);

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

  function onAttachmentsSelected(files: FileList | null) {
    if (!files?.length) return;
    const next = [...attachments];
    for (const file of Array.from(files)) {
      if (next.length >= 5) break;
      next.push(file);
    }
    setAttachments(next);
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function startClaim() {
    setSubmitting(true);
    setSubmitError(null);
    setNotice(null);
    try {
      const claim = await api.createClaim({
        policy_ref: policyRef.trim() || selectedPolicy?.policy_ref || "POL-HOME-001",
        customer_name: user?.full_name || "Customer",
        customer_id: user?.id,
        customer_email: user?.email,
        category,
        amount_claimed: Number(amount) || 0,
        description: description.trim() || "Claim submitted from the app",
      });

      const uploadErrors: string[] = [];
      for (const file of attachments) {
        try {
          await api.uploadClaimDocument(claim.id, file);
        } catch (err) {
          uploadErrors.push(
            `${file.name}: ${err instanceof Error ? err.message : "upload failed"}`,
          );
        }
      }

      if (uploadErrors.length > 0) {
        setNotice(
          `Claim ${claim.id} submitted, but some documents failed to upload: ${uploadErrors.join("; ")}`,
        );
      } else if (attachments.length > 0) {
        setNotice(
          `Claim ${claim.id} submitted with ${attachments.length} supporting document(s) — pending admin review.`,
        );
      } else {
        setNotice(`Claim ${claim.id} submitted — pending admin approval.`);
      }

      setDescription("");
      setAttachments([]);
      await loadClaims();
      setTab("track");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit claim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CustomerAppShell active="claims">
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

      {notice ? (
        <p className="manage-notice claims-notice" role="status">
          {notice}
        </p>
      ) : null}

      {tab === "new" && (
        <CustomerPanel title="Claims centre" description="Submit a claim against your saved policies">
          {demoFilling ? (
            <p className="demo-fill-banner" role="status">
              Filling claim for <strong>{selectedPolicy?.product_title}</strong>…
            </p>
          ) : null}

          {policies.length === 0 ? (
            <p className="manage-notice" role="status">
              You do not have an active policy yet. Complete your quote and payment first — once your
              policy is active on your account, return here to start a claim.
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

          {selectedPolicy?.coverage_summary ? (
            <div className="policy-coverage-panel" role="status">
              <strong>Coverage on this policy</strong>
              <p>{selectedPolicy.coverage_summary}</p>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                {selectedPolicy.cover_start_at
                  ? `Cover active from ${formatPolicyDate(selectedPolicy.cover_start_at)}`
                  : "Cover starts once your policy is approved and active"}
                {selectedPolicy.cover_expires_at
                  ? ` · Valid until ${formatPolicyDate(selectedPolicy.cover_expires_at)}`
                  : ""}
                {selectedPolicy.coverage_limit_gbp != null
                  ? ` · Max claim £${Number(selectedPolicy.coverage_limit_gbp).toLocaleString("en-GB")}`
                  : ""}
              </p>
            </div>
          ) : null}

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
                max={claimAmountMax}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Amount claimed"
                disabled={demoFilling}
              />
              {claimAmountMax != null ? (
                <span className="muted" style={{ display: "block", fontSize: "0.82rem", marginTop: 4 }}>
                  Must not exceed policy coverage limit of £{claimAmountMax.toLocaleString("en-GB")}
                </span>
              ) : null}
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
            <label>
              Supporting documents
              <span className="muted" style={{ display: "block", fontSize: "0.82rem", marginBottom: 6 }}>
                Upload receipts, photos, or PDFs (max 5 files, 8 MB each)
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => {
                  onAttachmentsSelected(e.target.files);
                  e.target.value = "";
                }}
                disabled={demoFilling || submitting || attachments.length >= 5}
                aria-label="Upload supporting documents"
              />
            </label>
            {attachments.length > 0 ? (
              <ul className="claim-attachments-list">
                {attachments.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="link-quiet"
                      onClick={() => removeAttachment(index)}
                      disabled={submitting}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {submitError ? (
            <p className="error" role="alert">
              {submitError}
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
            {visibleClaims.map((claim) => {
              const isParametric = claim.source === "parametric";
              const eventLabel = isParametric
                ? formatParametricEventLabel(claim.parametric_event_type, claim.description)
                : null;
              const needsAction = (claim.open_query_count ?? 0) > 0;
              return (
              <article className={`quote-card${needsAction ? " quote-card--action" : ""}`} key={claim.id}>
                <strong>{claim.id}</strong>
                {needsAction ? (
                  <span className="claim-action-pill">Action required</span>
                ) : null}
                {isParametric ? (
                  <p className="claims-parametric-badge" style={{ margin: "6px 0 0" }}>
                    Auto-settled · {eventLabel}
                  </p>
                ) : null}
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  {isParametric && eventLabel ? eventLabel : claim.category} · {formatClaimStatus(claim.status)} · £
                  {Number(claim.amount_claimed).toFixed(2)}
                  {claim.approved_amount != null && claim.approved_amount !== claim.amount_claimed
                    ? ` (approved £${Number(claim.approved_amount).toFixed(2)})`
                    : ""}
                </p>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  {claim.policy_ref}
                  {claim.payout_transaction_id ? ` · paid ${claim.payout_transaction_id}` : ""}
                  {(claim.document_count ?? claim.documents?.length ?? 0) > 0
                    ? ` · ${claim.document_count ?? claim.documents?.length} document(s) attached`
                    : ""}
                  {claim.description ? ` · ${claim.description}` : ""}
                </p>
                {!isParametric ? (
                  <ClaimQueryReplyPanel claim={claim} onReplied={() => void loadClaims()} />
                ) : null}
              </article>
            );})}
          </div>
        </CustomerPanel>
      )}

      <AssistantBar screen="marketplace" />
    </CustomerAppShell>
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
    <CustomerAppShell active="profile">
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
            <>
              {needsKycAttention(profile.kyc_status) ? (
                <KycOnboardingPrompt status={profile.kyc_status} variant="card" />
              ) : null}
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
            </>
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
    </CustomerAppShell>
  );
}
