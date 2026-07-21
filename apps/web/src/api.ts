const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  kyc_status: string;
  wallet: { address: string; status: string } | null;
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

export type InsuranceClaim = {
  id: string;
  policy_ref: string;
  customer_name: string;
  category: string;
  status: string;
  amount_claimed: number;
  description?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
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
};

type AuthResponse = {
  access_token: string;
  user: AuthUser;
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
  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : null;
  if (!res.ok || data === null) {
    const body = (data ?? {}) as { detail?: string; message?: string; error?: string };
    const detail =
      body.detail ?? body.message ?? body.error ??
      (data === null ? "Invalid API response (expected JSON)" : res.statusText);
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
    request<{ status: string; progress: Record<string, string> }>(
      "/api/kyc/submit",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  getWallet: (token: string) =>
    request<{ status: string; address: string | null }>(
      "/api/wallet",
      {},
      token,
    ),

  me: (token: string) => request<AuthUser>("/api/auth/me", {}, token),

  createWallet: (token: string) =>
    request<{
      status: string;
      address: string;
      mode: string;
      note?: string;
    }>("/api/wallet/create", { method: "POST" }, token),

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

  getQuoteSchema: (category: string) =>
    request<QuoteSchema>(
      `/api/quotes/schema?category=${encodeURIComponent(category)}`,
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

  createClaim: (body: {
    policy_ref: string;
    customer_name?: string;
    category?: string;
    amount_claimed?: number;
    description?: string;
  }) =>
    request<InsuranceClaim>("/api/claims", {
      method: "POST",
      body: JSON.stringify(body),
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

  chatbotAsk: (message: string, sessionId?: string) =>
    request<ChatbotAskResponse>("/api/chatbot/ask", {
      method: "POST",
      body: JSON.stringify({ message, session_id: sessionId }),
    }),

  chatbotConfig: () =>
    request<{
      vector_store: string;
      embedding_model: string;
      top_k: number;
      documents_indexed: number;
      llm_enabled: boolean;
    }>("/api/chatbot/config"),
};
