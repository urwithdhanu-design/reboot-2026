const API_BASE = import.meta.env.VITE_API_BASE ?? '';

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

export const adminApi = {
  listProducts: () =>
    request<{ categories: string[]; products: unknown[] }>('/api/products'),

  listCustomers: (q?: string, kycStatus?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (kycStatus && kycStatus !== 'all') params.set('kyc_status', kycStatus);
    const qs = params.toString();
    return request<{ customers: AdminCustomer[]; count: number }>(
      `/api/admin/customers${qs ? `?${qs}` : ''}`,
    );
  },

  listKycQueue: () =>
    request<{ queue: KycQueueItem[]; count: number }>('/api/admin/kyc-queue'),

  updateCustomerKyc: (userId: string, status: string) =>
    request<AdminCustomer>(`/api/admin/customers/${encodeURIComponent(userId)}/kyc`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  customerStats: () =>
    request<{
      total_customers: number;
      kyc_verified: number;
      kyc_in_progress: number;
      kyc_not_started: number;
    }>('/api/admin/customer-stats'),

  listPolicies: () =>
    request<{ policies: AdminPolicyRow[]; count: number }>('/api/admin/policies'),

  policyStats: () =>
    request<{ total_quotes: number; total_applications: number }>('/api/admin/policy-stats'),

  listPayments: () =>
    request<{ payments: PaymentLedgerRow[]; count: number }>('/api/payment-ledger'),

  listVendors: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<{ vendors: Vendor[]; count: number }>(`/api/vendors${qs}`);
  },

  onboardVendor: (body: Record<string, string>) =>
    request<Vendor>('/api/vendors/onboard', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateVendor: (id: string, body: Record<string, string>) =>
    request<Vendor>(`/api/vendors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  publishVendor: (id: string, body?: Record<string, string>) =>
    request<Vendor>(`/api/vendors/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  resendVendorInvite: (id: string) =>
    request<{ ok: boolean; emailed_to: string; temp_password: string }>(
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
