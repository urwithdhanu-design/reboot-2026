const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
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

export const adminApi = {
  listProducts: () =>
    request<{ categories: string[]; products: unknown[] }>('/api/products'),

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
