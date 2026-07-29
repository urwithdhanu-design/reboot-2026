const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  kyc_status: string;
  kyc_approval_mode?: string;
  last_login_at?: string | null;
  wallet: { address: string; status: string; balance_gbp?: number; currency?: string } | null;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  tagline?: string;
  bullets?: string[];
  cta_label?: string;
  category: string;
  price_from: number;
  price_unit: string;
  currency: string;
  rating: number;
  review_count: number;
  best_seller: boolean;
  icon: string;
};

export type QuoteField = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "radio_cards" | "email" | "tel";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type QuoteStep = {
  step: number;
  title: string;
  subtitle?: string;
  fields: QuoteField[];
};

export type QuoteSchema = {
  category: string;
  flow: "form" | "wizard";
  title: string;
  total_steps: number;
  partner?: string;
  steps: QuoteStep[];
  fields: QuoteField[];
};

export type QuoteEstimate = {
  quote_id: string;
  product_id: string;
  product_title: string;
  category: string;
  currency: string;
  estimated_premium: number;
  price_unit: string;
  message: string;
  answers: Record<string, unknown>;
};

export type ClaimEvaluationStep = {
  id: string;
  label: string;
  status: string;
  detail?: string;
  at?: string | null;
};

export type InsuranceClaim = {
  id: string;
  policy_ref: string;
  customer_name: string;
  category: string;
  status: string;
  amount_claimed: number;
  approved_amount?: number | null;
  description?: string;
  source?: string;
  parametric_event_type?: string | null;
  payout_transaction_id?: string | null;
  settlement_transaction_id?: string | null;
  canton_contract_id?: string | null;
  validation_notes?: string | null;
  rejection_reason?: string | null;
  evaluation_steps?: ClaimEvaluationStep[];
  created_at?: string;
  updated_at?: string;
  documents?: ClaimDocumentRow[];
  document_count?: number;
  queries?: ClaimQueryRow[];
  open_query_count?: number;
};

export type ClaimDocumentRow = {
  id: string;
  claim_id: string;
  file_name: string;
  label?: string;
  content_type: string;
  file_size: number;
  query_id?: string | null;
  uploaded_at?: string;
};

export type ClaimQueryRow = {
  id: string;
  claim_id: string;
  status: "open" | "answered";
  admin_message: string;
  customer_reply?: string | null;
  requires_documents: boolean;
  created_at?: string;
  answered_at?: string | null;
  document_count?: number;
};

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string;
  funding_source?: string;
  created_at: string;
};

export type WalletInfo = {
  status: string;
  address: string | null;
  balance_gbp: number;
  currency: string;
  mode?: string;
  note?: string;
  provider?: string;
  consent_email_sent?: boolean;
  pending_approval?: boolean;
  dev_approve_url?: string;
};

export type SettlementReadinessCheck = {
  name: string;
  status: "passed" | "failed" | "review" | string;
  detail: string;
};

export type CustomerPolicyRecord = {
  policy_id: string;
  policy_number: string;
  quote_id: string;
  product_title?: string;
  status: string;
  wallet_address?: string | null;
  policy_reference_hash?: string;
  metadata_uri?: string;
  token_id?: string | null;
  transaction_hash?: string | null;
  contract_address?: string | null;
  block_number?: number | null;
  blockchain_network?: string | null;
  ledger_type?: "canton" | "simulated" | string;
  mint_status?: string;
  payment_status?: string;
  issued_at?: string;
  activated_at?: string | null;
  explorer_url?: string | null;
  product_category?: string | null;
  cover_start_at?: string | null;
  cover_expires_at?: string | null;
  coverage_limit_gbp?: number | null;
  coverage_used_gbp?: number | null;
  coverage_remaining_gbp?: number | null;
  coverage_summary?: string | null;
  coverage_items?: Array<{ code?: string; label?: string; limit_gbp?: number }>;
  coverage_expired?: boolean;
  coverage_active?: boolean;
  coverage_pending_mint?: boolean;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  cancellation_type?: string | null;
  refund_status?: string | null;
  refund_amount_gbp?: number | null;
  refund_payment_id?: string | null;
  product_id?: string | null;
  predecessor_policy_id?: string | null;
  renewed_by_policy_id?: string | null;
  compliance_decision?: string | null;
  compliance_fraud_score?: number | null;
  renewal_eligible?: boolean;
  settlement_readiness_checks?: SettlementReadinessCheck[];
};

export type PolicyRenewalPreview = {
  eligible: boolean;
  policy_id: string;
  policy_number: string;
  product_id?: string;
  product_title?: string;
  current_cover_expires_at?: string | null;
  proposed_cover_start_at?: string;
  estimated_premium?: number | null;
  currency?: string;
  price_unit?: string;
  message?: string;
  premium_note?: string;
};

export type PolicyRenewalQuoteResponse = {
  quote: QuoteEstimate & { renewal_of_policy_id?: string };
  predecessor_policy_id: string;
  proposed_cover_start_at?: string;
};

export type PolicyCancelPreview = {
  policy_id: string;
  policy_number: string;
  product_title?: string;
  status: string;
  issued_at?: string | null;
  eligible: boolean;
  ineligible_reason?: string | null;
  refund_estimate_gbp: number;
  cancellation_type?: string | null;
  cooling_off?: boolean;
  cooling_off_days_remaining?: number;
  refund_message?: string | null;
  open_claims_count?: number;
};

export type PolicyCancelResponse = {
  policy: CustomerPolicyRecord;
  refund_estimate_gbp: number;
  refund_status: string;
  refund_payment_id?: string | null;
  message: string;
};

export type ChatbotPolicyCard = {
  policy_id?: string;
  policy_number?: string;
  product_title?: string;
  status?: string;
  issued_at?: string;
  product_category?: string;
  mint_status?: string;
};

export type ChatbotAskResponse = {
  answer: string;
  sources: {
    title?: string;
    source?: string;
    category?: string;
    score?: number;
  }[];
  vector_store: string;
  action?: string | null;
  policies?: ChatbotPolicyCard[];
  claims?: Record<string, unknown>[];
  requires_login?: boolean;
};

type AuthResponse = {
  access_token: string;
  user: AuthUser;
  emailed?: boolean;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const trimmed = text.trim();

  let data: unknown = null;
  if (trimmed.length > 0) {
    const looksJson =
      trimmed.startsWith("{") ||
      trimmed.startsWith("[") ||
      (res.headers.get("content-type") ?? "").toLowerCase().includes("json");
    if (looksJson) {
      try {
        data = JSON.parse(trimmed) as unknown;
      } catch {
        data = null;
      }
    }
  }

  if (trimmed.startsWith("<!") || trimmed.startsWith("<html")) {
    throw new Error(
      res.ok
        ? "Unexpected HTML from API (check hosting rewrites to Cloud Run)"
        : `API error (${res.status}): received HTML instead of JSON`,
    );
  }

  if (!res.ok || data === null) {
    const body = (data ?? {}) as { detail?: string; message?: string; error?: string; title?: string };
    let detail =
      body.detail ??
      body.message ??
      body.error ??
      body.title ??
      (data === null ? null : res.statusText);

    if (detail == null) {
      if (!trimmed) {
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          detail =
            path.startsWith("/api/chatbot")
              ? `Stallion is unavailable (${res.status}). Start chatbot-assistance-service on port 8090.`
              : `Service unavailable (${res.status}). Check that the API backend is running.`;
        } else {
          detail = `Empty response from API (${res.status})`;
        }
      } else {
        const snippet = trimmed.slice(0, 160).replace(/\s+/g, " ");
        detail = `Invalid API response (${res.status}): ${snippet}`;
      }
    }

    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  return data as T;
}

export const api = {
  register: (body: {
    full_name: string;
    email: string;
    mobile_number: string;
    terms_accepted: boolean;
    password: string;
  }) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { identifier: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  forgotPassword: (identifier: string) =>
    request<{
      message: string;
      emailed: boolean;
      dev_reset_token?: string;
      dev_reset_url?: string;
    }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string; email: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    }),

  submitKyc: (
    token: string,
    body: {
      document_type: string;
      document_uploaded: boolean;
      selfie_captured: boolean;
    },
  ) =>
    request<{
      status: string;
      progress: Record<string, string>;
      auto_approved?: boolean;
      requires_consent?: boolean;
    }>(
      "/api/kyc/submit",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  acceptKycConsent: (token: string) =>
    request<{
      status: string;
      consent_accepted: boolean;
      consent_accepted_at?: string;
    }>("/api/kyc/consent", { method: "POST" }, token),

  uploadKycSelfie: async (token: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/kyc/selfie`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const text = await res.text();
    let data: unknown = {};
    if (text.trim()) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = {};
      }
    }
    if (!res.ok) {
      const body = data as { detail?: string; message?: string; error?: string; title?: string };
      throw new Error(
        body.detail ?? body.message ?? body.error ?? body.title ?? text.slice(0, 200) ?? res.statusText,
      );
    }
    return data as { uploaded: boolean; file_name: string; content_type: string; file_size: number };
  },

  uploadKycDocument: async (token: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/kyc/document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const text = await res.text();
    let data: unknown = {};
    if (text.trim()) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = {};
      }
    }
    if (!res.ok) {
      const body = data as { detail?: string; message?: string; error?: string; title?: string };
      throw new Error(
        body.detail ?? body.message ?? body.error ?? body.title ?? text.slice(0, 200) ?? res.statusText,
      );
    }
    return data as { uploaded: boolean; file_name: string; content_type: string; file_size: number };
  },

  getWallet: (token: string) =>
    request<WalletInfo>("/api/wallet", {}, token),

  me: (token: string) => request<AuthUser>("/api/auth/me", {}, token),

  createWallet: (token: string) =>
    request<WalletInfo & { ledger?: string; reused?: boolean }>(
      "/api/wallet/create",
      { method: "POST" },
      token,
    ),

  rechargeWallet: (token: string, amount: number, bankAccount: string) =>
    request<WalletInfo & { transaction: WalletTransaction }>(
      "/api/wallet/recharge",
      { method: "POST", body: JSON.stringify({ amount, bankAccount }) },
      token,
    ),

  getWalletTransactions: (token: string) =>
    request<{ transactions: WalletTransaction[]; count: number }>(
      "/api/wallet/transactions",
      {},
      token,
    ),

  linkWallet: (token: string, address: string) =>
    request<WalletInfo & { linked?: boolean }>(
      "/api/wallet/link",
      { method: "POST", body: JSON.stringify({ address }) },
      token,
    ),

  approveWalletConsent: (approvalToken: string) =>
    request<{ message: string; status: string; address: string; already_active?: boolean }>(
      `/api/wallet/consent/approve?token=${encodeURIComponent(approvalToken)}`,
      { method: "POST" },
    ),

  getMyPolicies: (token: string) =>
    request<{ policies: CustomerPolicyRecord[]; count: number }>(
      "/api/policies/me",
      {},
      token,
    ),

  previewPolicyCancel: (token: string, policyId: string) =>
    request<PolicyCancelPreview>(
      `/api/policies/${encodeURIComponent(policyId)}/cancel/preview`,
      { method: "POST" },
      token,
    ),

  cancelPolicy: (
    token: string,
    policyId: string,
    body: {
      reason?: string;
      customer_note?: string;
      confirm_refund_amount_gbp: number;
    },
  ) =>
    request<PolicyCancelResponse>(
      `/api/policies/${encodeURIComponent(policyId)}/cancel`,
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  previewPolicyRenewal: (token: string, policyId: string) =>
    request<PolicyRenewalPreview>(
      `/api/policies/${encodeURIComponent(policyId)}/renewal/preview`,
      { method: "POST" },
      token,
    ),

  createPolicyRenewalQuote: (token: string, policyId: string) =>
    request<PolicyRenewalQuoteResponse>(
      `/api/policies/${encodeURIComponent(policyId)}/renewal/quote`,
      { method: "POST" },
      token,
    ),

  listProducts: (category?: string, q?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    const qs = params.toString();
    return request<{ categories: string[]; products: Product[] }>(
      `/api/products${qs ? `?${qs}` : ""}`,
    );
  },

  getProduct: (productId: string) =>
    request<Product>(`/api/products/${encodeURIComponent(productId)}`),

  getQuoteSchema: (category: string, productId?: string) =>
    request<QuoteSchema>(
      `/api/quotes/schema?category=${encodeURIComponent(category)}${
        productId ? `&product_id=${encodeURIComponent(productId)}` : ""
      }`,
    ),

  estimateQuote: (body: {
    product_id: string;
    answers: Record<string, string | number>;
  }) =>
    request<QuoteEstimate>("/api/quotes/estimate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listQuotes: () =>
    request<{ quotes: QuoteEstimate[]; count: number }>("/api/quotes"),

  getQuote: (quoteId: string) =>
    request<QuoteEstimate>(`/api/quotes/${encodeURIComponent(quoteId)}`),

  assistant: (screen: string) =>
    request<{ title: string; message: string }>(
      `/api/assistant/message?screen=${encodeURIComponent(screen)}`,
    ),

  paymentConfig: () =>
    request<{
      configured: boolean;
      publishable_key: string;
      currency: string;
    }>("/api/payments/config"),

  createCheckout: (quoteId: string) =>
    request<{
      session_id: string;
      url: string;
      quote_id: string;
      amount: number;
      currency: string;
    }>("/api/payments/checkout", {
      method: "POST",
      body: JSON.stringify({ quote_id: quoteId }),
    }),

  payWithWallet: (token: string, quoteId: string) =>
    request<{
      paid: boolean;
      quote_id: string;
      amount: number;
      currency: string;
      wallet_address: string;
      balance_gbp: number;
      payment_method: string;
      policy_id?: string;
    }>(
      "/api/payments/wallet",
      { method: "POST", body: JSON.stringify({ quote_id: quoteId }) },
      token,
    ),

  getPaymentSession: (sessionId: string) =>
    request<{
      session_id: string;
      status: string;
      payment_status: string;
      quote_id: string | null;
      amount_total: number;
      currency: string;
      paid: boolean;
    }>(`/api/payments/session/${encodeURIComponent(sessionId)}`),

  listClaims: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<{ claims: InsuranceClaim[]; count: number }>(`/api/claims${qs}`);
  },

  createClaim: async (body: {
    policy_ref: string;
    customer_name?: string;
    customer_id?: string;
    customer_email?: string;
    category?: string;
    amount_claimed?: number;
    description?: string;
  }) => {
    const headers = new Headers({ "Content-Type": "application/json" });
    const res = await fetch(`${API_BASE}/api/claims`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown = null;
    if (text.trim()) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = null;
      }
    }
    if (!res.ok) {
      const payload = (data ?? {}) as {
        detail?: string;
        evaluation_step?: string;
        evaluation_label?: string;
        evaluation_steps?: ClaimEvaluationStep[];
      };
      const err = new Error(payload.detail ?? "Could not submit claim") as Error & {
        evaluationStep?: string;
        evaluationLabel?: string;
        evaluationSteps?: ClaimEvaluationStep[];
      };
      err.evaluationStep = payload.evaluation_step;
      err.evaluationLabel = payload.evaluation_label;
      err.evaluationSteps = payload.evaluation_steps;
      throw err;
    }
    return data as InsuranceClaim;
  },

  uploadClaimDocument: async (claimId: string, file: File, label?: string, queryId?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (label?.trim()) form.append("label", label.trim());
    if (queryId?.trim()) form.append("query_id", queryId.trim());
    const res = await fetch(`${API_BASE}/api/claims/${encodeURIComponent(claimId)}/documents`, {
      method: "POST",
      body: form,
    });
    const text = await res.text();
    let data: unknown = {};
    if (text.trim()) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = {};
      }
    }
    if (!res.ok) {
      const body = data as { detail?: string; message?: string; error?: string; title?: string };
      throw new Error(
        body.detail ?? body.message ?? body.error ?? body.title ?? text.slice(0, 200) ?? res.statusText,
      );
    }
    return data as ClaimDocumentRow;
  },

  listClaimDocuments: (claimId: string) =>
    request<{ documents: ClaimDocumentRow[]; count: number }>(
      `/api/claims/${encodeURIComponent(claimId)}/documents`,
    ),

  listClaimQueries: (claimId: string) =>
    request<{ queries: ClaimQueryRow[]; count: number; open_count: number }>(
      `/api/claims/${encodeURIComponent(claimId)}/queries`,
    ),

  replyToClaimQuery: (claimId: string, queryId: string, message: string) =>
    request<ClaimQueryRow>(`/api/claims/${encodeURIComponent(claimId)}/queries/${encodeURIComponent(queryId)}/reply`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  sendNotification: (body: {
    recipient: string;
    subject?: string;
    body: string;
    template?: string;
    channel?: string;
  }) =>
    request<{ id: string; status: string }>("/api/notifications/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  chatbotAsk: (
    message: string,
    options?: { sessionId?: string; policyId?: string; token?: string | null },
  ) =>
    request<ChatbotAskResponse>(
      "/api/chatbot/ask",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          session_id: options?.sessionId,
          policy_id: options?.policyId,
        }),
      },
      options?.token,
    ),

  chatbotConfig: () =>
    request<{
      vector_store: string;
      embedding_model: string;
      top_k: number;
      documents_indexed: number;
      llm_enabled: boolean;
    }>("/api/chatbot/config"),
};
