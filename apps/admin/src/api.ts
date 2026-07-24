const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export const ADMIN_TOKEN_KEY = 'gcul-admin-token';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
    const body = data as { detail?: string; message?: string; error?: string };
    throw new Error(body.detail ?? body.message ?? body.error ?? res.statusText);
  }
  return data as T;
}

function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  if (!token) {
    return Promise.reject(new Error('Not signed in'));
  }
  return request<T>(path, options, token);
}

export type AdminAuthUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export type AdminAuthResponse = {
  access_token: string;
  token_type: string;
  user: AdminAuthUser;
};

export type Vendor = {
  id: string;
  name: string;
  code: string;
  categories: string;
  contact_email: string;
  contact_name?: string;
  status: string;
  description?: string;
  website_url?: string;
  ui_deploy_url?: string;
  ui_version?: string;
  services_config_json?: string;
  published_at?: string;
  created_at?: string;
  temp_password?: string;
};

export type AdminCustomer = {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  kyc_status: string;
  created_at?: string;
  kyc_document_type?: string;
  kyc_submitted_at?: string;
  wallet_status?: string;
  account_status?: string;
  wallet?: { address: string; status: string } | null;
};

export type KycQueueItem = {
  id: string;
  customer_name: string;
  email: string;
  mobile_number: string;
  status: string;
  approval_mode?: string;
  document_type: string;
  submitted_at: string;
  progress: Record<string, string>;
  documents: string[];
};

export type AdminPolicyRow = {
  id: string;
  quote_id: string;
  policy_number: string;
  product_id: string;
  product_title: string;
  category: string;
  premium: number;
  price_unit: string;
  currency: string;
  customer_name: string;
  customer_email: string;
  status: string;
  created_at?: string;
  payment_status?: string;
  policy_ref?: string;
};

export type PaymentLedgerRow = {
  id: string;
  quote_id: string;
  policy_ref: string;
  customer_email: string;
  amount: number;
  currency: string;
  status: string;
  created_at?: string;
};

export type InsuranceChainTx = {
  id: string;
  block_height: number | null;
  type: string;
  ledger: string;
  payload: string;
  document_hash?: string | null;
  actor_id?: string | null;
  actor_role?: string | null;
  fraud_score?: number | null;
  tx_hash: string;
  signature?: string;
  public_key?: string;
  created_at: string;
};

export type InsuranceChainBlock = {
  height: number;
  hash: string;
  previous_hash: string;
  merkle_root: string;
  transaction_count: number;
  mined_at: string;
  validator_id: string;
  transactions: InsuranceChainTx[];
};

export type InsuranceChainResponse = {
  network: {
    network_name: string;
    chain_id: number;
    consensus: string;
    hash_algorithm: string;
    block_height: number;
    transaction_count: number;
    validator_id: string;
    peers: string[];
  };
  validation: { valid: boolean; block_count: number; errors: string[] };
  blocks: InsuranceChainBlock[];
};

export type AdminProduct = {
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

export const adminApi = {
  adminLogin: (identifier: string, password: string) =>
    request<AdminAuthResponse>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  listProducts: () =>
    adminRequest<{ categories: string[]; products: AdminProduct[]; count: number }>(
      '/api/admin/products',
    ),

  updateProduct: (productId: string, body: Partial<AdminProduct>) =>
    adminRequest<AdminProduct>(`/api/admin/products/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  refreshProductCache: () =>
    adminRequest<{ ok: boolean; message: string }>('/api/admin/products/refresh-cache', {
      method: 'POST',
    }),

  listCustomers: (q?: string, kycStatus?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (kycStatus && kycStatus !== 'all') params.set('kyc_status', kycStatus);
    const qs = params.toString();
    return adminRequest<{ customers: AdminCustomer[]; count: number }>(
      `/api/admin/customers${qs ? `?${qs}` : ''}`,
    );
  },

  listKycQueue: () =>
    adminRequest<{ queue: KycQueueItem[]; count: number; pending_count: number }>(
      '/api/admin/kyc-queue',
    ),

  getKycSettings: () =>
    adminRequest<{ auto_approve_agent: boolean }>('/api/admin/kyc-settings'),

  updateKycSettings: (autoApproveAgent: boolean) =>
    adminRequest<{ auto_approve_agent: boolean; queue_auto_approved?: number }>(
      '/api/admin/kyc-settings',
      {
        method: 'PATCH',
        body: JSON.stringify({ auto_approve_agent: autoApproveAgent }),
      },
    ),

  updateCustomerKyc: (userId: string, status: string) =>
    adminRequest<AdminCustomer>(`/api/admin/customers/${encodeURIComponent(userId)}/kyc`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  customerStats: () =>
    adminRequest<{
      total_customers: number;
      kyc_verified: number;
      kyc_in_progress: number;
      kyc_not_started: number;
    }>('/api/admin/customer-stats'),

  listPolicies: () =>
    adminRequest<{ policies: AdminPolicyRow[]; count: number }>('/api/admin/policies'),

  policyStats: () =>
    adminRequest<{ total_quotes: number; total_applications: number }>('/api/admin/policy-stats'),

  listPayments: () =>
    adminRequest<{ payments: PaymentLedgerRow[]; count: number }>('/api/payment-ledger'),

  insuranceChain: () => request<InsuranceChainResponse>('/api/blockchain/chain'),

  insuranceChainCapabilities: () =>
    request<{ capabilities: Record<string, unknown> }>('/api/blockchain/chain/capabilities'),

  listVendors: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return adminRequest<{ vendors: Vendor[]; count: number }>(`/api/vendors${qs}`);
  },

  onboardVendor: (body: Record<string, string>) =>
    adminRequest<Vendor>('/api/vendors/onboard', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateVendor: (id: string, body: Record<string, string>) =>
    adminRequest<Vendor>(`/api/vendors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  publishVendor: (id: string, body?: Record<string, string>) =>
    adminRequest<Vendor>(`/api/vendors/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  resendVendorInvite: (id: string) =>
    adminRequest<{ ok: boolean; emailed_to: string; temp_password: string }>(
      `/api/vendors/${encodeURIComponent(id)}/resend-invite`,
      { method: 'POST' },
    ),

  vendorLogin: (email: string, password: string) =>
    request<{
      access_token: string;
      vendor: Vendor;
      account: { id: string; email: string; full_name: string; role: string };
    }>('/api/vendor-portal/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  vendorDashboard: (token: string) =>
    request<{
      vendor: Vendor;
      products: Array<Record<string, unknown>>;
      customers: Array<Record<string, unknown>>;
      claims: Array<Record<string, unknown>>;
      stats: Record<string, unknown>;
    }>('/api/vendor-portal/dashboard', {}, token),
};

/** Merge payment ledger onto policy rows for admin tables. */
export function enrichPoliciesWithPayments(
  policies: AdminPolicyRow[],
  payments: PaymentLedgerRow[],
): AdminPolicyRow[] {
  const byQuote = new Map<string, PaymentLedgerRow>();
  for (const p of payments) {
    if (!byQuote.has(p.quote_id)) byQuote.set(p.quote_id, p);
  }
  return policies.map((row) => {
    const pay = byQuote.get(row.quote_id);
    if (!pay) return row;
    return {
      ...row,
      payment_status: pay.status,
      policy_ref: pay.policy_ref,
      status: pay.status === 'paid' ? 'active' : row.status,
    };
  });
}

/** Count policies per customer email (paid or quoted). */
export function policyCountByEmail(
  policies: AdminPolicyRow[],
  email: string,
): number {
  const key = email.toLowerCase();
  return policies.filter((p) => p.customer_email?.toLowerCase() === key).length;
}
