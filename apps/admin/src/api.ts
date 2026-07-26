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
  mint_status?: string;
  token_id?: string | null;
  product_category?: string;
  cover_start_at?: string | null;
  cover_expires_at?: string | null;
  coverage_limit_gbp?: number | null;
  coverage_summary?: string | null;
};

export type InternalPolicyRecord = {
  policy_id: string;
  product_category?: string;
  cover_start_at?: string | null;
  cover_expires_at?: string | null;
  coverage_limit_gbp?: number | null;
  coverage_summary?: string | null;
  coverage_items?: Array<{ code?: string; label?: string; limit_gbp?: number }>;
  coverage_expired?: boolean;
  mint_status?: string;
  status?: string;
};

export type TokenRegistryRow = {
  id: string;
  token_id?: string;
  name: string;
  policy_number: string;
  standard: string;
  type: 'policy_nft';
  owner: string;
  status: 'active' | 'minting' | 'frozen';
  contract_address: string;
  transaction_hash?: string;
  explorer_url?: string | null;
  minted_at?: string;
  wallet_address?: string;
  product_category?: string;
  coverage_summary?: string;
  cover_expires_at?: string;
  coverage_limit_gbp?: number;
};

export type TokenMintQueueRow = {
  id: string;
  policy_number: string;
  standard: string;
  status: 'pending' | 'pending_wallet' | 'failed';
  customer_name: string;
  customer_email: string;
  product_title: string;
  requested_at?: string;
  product_category?: string;
  coverage_summary?: string;
  cover_expires_at?: string;
  coverage_limit_gbp?: number;
};

export type TokenStandardRow = {
  standard: string;
  symbol: string;
  name: string;
  description: string;
  total_supply: number;
  circulating: number;
  enabled: boolean;
  contract_address: string;
};

export type TokenizationView = {
  registry: TokenRegistryRow[];
  mint_queue: TokenMintQueueRow[];
  stats: {
    policy_nfts: number;
    pending_mints: number;
    pending_wallet: number;
    failed_mints: number;
    total_issued: number;
  };
  blockchain: {
    network_name: string;
    chain_id: number;
    mode: string;
    live: boolean;
    contract_address: string;
    enabled: boolean;
    ledger_type?: string;
  };
  standards: TokenStandardRow[];
  count: number;
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

export type ParametricRuleRow = {
  id: string;
  name: string;
  rule_type: string;
  policy_ref: string;
  metric?: string;
  threshold: number;
  payout_amount: number;
  flight_number?: string;
  travel_date?: string;
  policy_expires_at?: string;
  product_category?: string;
  active: boolean;
  created_at?: string;
  last_polled_at?: string | null;
  last_observed_delay?: number | null;
  oracle_status?: string;
  oracle_provider?: string;
  oracle_message?: string;
};

export type ParametricTriggerRow = {
  id: string;
  rule_id: string;
  policy_ref: string;
  flight_number?: string;
  observed_value: number;
  threshold?: number;
  matched: boolean;
  claim_created: boolean;
  claim_id?: string | null;
  status: string;
  message?: string;
  trigger_source?: string;
  rule_type?: string;
  oracle_provider?: string;
  flight_status?: string;
  triggered_at?: string;
};

export type ParametricOracleStatus = {
  enabled: boolean;
  configured: boolean;
  provider: string;
  poll_interval_ms: number;
  api_key_set: boolean;
  message?: string;
};

export type ParametricOraclePollResult = {
  polled?: number;
  triggered?: number;
  skipped_already_settled?: number;
  errors?: number;
  active_rules?: number;
  polled_at?: string;
  rule_id?: string;
  matched?: boolean;
  claim_created?: boolean;
  claim_id?: string | null;
  status?: string;
  message?: string;
  oracle?: {
    provider?: string;
    delay_minutes?: number;
    flight_status?: string;
    scheduled_departure?: string;
    actual_departure?: string;
    flight_found?: boolean;
    message?: string;
  };
};

export type ParametricSimulateResult = ParametricOraclePollResult;

export type AdminClaimRow = {
  id: string;
  policy_ref: string;
  customer_name: string;
  customer_id?: string;
  customer_email?: string;
  category: string;
  status: string;
  amount_claimed: number;
  approved_amount?: number | null;
  description?: string;
  source?: string;
  parametric_event_type?: string | null;
  canton_contract_id?: string | null;
  payout_transaction_id?: string | null;
  settlement_transaction_id?: string | null;
  validation_notes?: string | null;
  rejection_reason?: string | null;
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
  status: 'open' | 'answered';
  admin_message: string;
  customer_reply?: string | null;
  requires_documents: boolean;
  created_at?: string;
  answered_at?: string | null;
  document_count?: number;
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

export type ChainObservabilityResponse = {
  generated_at: string;
  network: InsuranceChainResponse['network'];
  validation: InsuranceChainResponse['validation'];
  dashboard: {
    block_height: number;
    total_transactions: number;
    transactions_24h: number;
    mempool_pending: number;
    fraud_flags: number;
    chain_valid: boolean;
    ledgers_active: number;
  };
  performance: {
    avg_block_time_seconds: number;
    avg_tx_per_block: number;
    avg_confirmation_ms: number;
    mempool_size: number;
    validator_id: string;
  };
  security_alerts: Array<{
    severity: string;
    code: string;
    title: string;
    detail: string;
    at: string;
  }>;
  transaction_traces: Array<{
    trace_id: string;
    tx_hash: string;
    type: string;
    ledger: string;
    status: string;
    block_height: number | null;
    actor_id?: string | null;
    actor_role?: string | null;
    fraud_score?: number | null;
    created_at: string;
    payload_preview: string;
  }>;
  smart_contracts: Array<{
    name: string;
    standard: string;
    status: string;
    description: string;
    invocations: number;
    network: string;
  }>;
  throughput_24h: Array<{ hour: string; count: number }>;
};

export type CantonStatus = {
  enabled?: boolean;
  live?: boolean;
  reachable?: boolean;
  network?: string;
  jsonApiUrl?: string;
  insurerPartyHint?: string;
  mode?: string;
  templateId?: string;
  chainId?: number | string;
  contractAddress?: string;
  ledgerBackend?: string;
};

export type CantonPolicyRecord = {
  policyId: string;
  policyNumber?: string;
  customerId?: string;
  walletAddress?: string;
  tokenId?: string;
  contractId?: string;
  updateId?: string;
  templateId?: string;
  network?: string;
  mintStatus?: string;
  mintedAt?: string;
};

export type BlockchainLedgerTx = {
  id: string;
  type?: string;
  from_wallet?: string;
  to_wallet?: string;
  amount?: number;
  asset?: string;
  status?: string;
  reference?: string;
  created_at?: string;
};

export type WalletOpsTransactionRow = {
  id: string;
  user_id: string;
  customer_email?: string | null;
  customer_name?: string | null;
  wallet_address?: string | null;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string | null;
  method?: string;
  blockchain_tx?: string | null;
  created_at: string;
};

export type WalletOpsWalletRow = {
  user_id: string;
  email?: string | null;
  address?: string | null;
  status: string;
  provider?: string | null;
  mode?: string | null;
  balance_gbp: number;
  currency: string;
  updated_at?: string | null;
};

export type WalletOpsView = {
  stats: {
    connected_wallets: number;
    disconnected_wallets: number;
    total_wallets: number;
    total_balance_gbp: number;
    transaction_count: number;
    total_volume_gbp: number;
    claim_payouts_gbp: number;
    premium_volume_gbp: number;
    recharge_volume_gbp: number;
  };
  wallets: WalletOpsWalletRow[];
  transactions: WalletOpsTransactionRow[];
  count: number;
  transaction_count: number;
  generated_at: string;
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
    adminRequest<{
      total_quotes: number;
      total_applications: number;
      issued_policies?: number;
      minted_nfts?: number;
    }>('/api/admin/policy-stats'),

  tokenizationView: () =>
    adminRequest<TokenizationView>('/api/admin/tokenization'),

  approvePolicyMint: (policyId: string) =>
    adminRequest<{ policy_id: string; mint_status?: string; token_id?: string }>(
      `/api/admin/tokenization/mint-queue/${encodeURIComponent(policyId)}/approve`,
      { method: 'POST' },
    ),

  rejectPolicyMint: (policyId: string) =>
    adminRequest<{ policy_id: string; mint_status?: string }>(
      `/api/admin/tokenization/mint-queue/${encodeURIComponent(policyId)}/reject`,
      { method: 'POST' },
    ),

  listPayments: () =>
    adminRequest<{ payments: PaymentLedgerRow[]; count: number }>('/api/payment-ledger'),

  refreshKycAdminCache: () =>
    adminRequest<{
      ok: boolean;
      firestore_active: boolean;
      project_id: string;
      collection: string;
      documents: string[];
    }>('/api/admin/refresh-cache', { method: 'POST' }),

  refreshPolicyAdminCache: () =>
    adminRequest<{
      ok: boolean;
      firestore_active: boolean;
      project_id: string;
      collection: string;
      documents: string[];
    }>('/api/admin/policies/refresh-cache', { method: 'POST' }),

  refreshPaymentsAdminCache: () =>
    adminRequest<{
      ok: boolean;
      firestore_active: boolean;
      project_id: string;
      collection: string;
      document: string;
    }>('/api/payment-ledger/refresh-cache', { method: 'POST' }),

  listClaims: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return adminRequest<{ claims: AdminClaimRow[]; count: number }>(`/api/claims${qs}`);
  },

  getClaim: (claimId: string) =>
    adminRequest<AdminClaimRow>(`/api/claims/${encodeURIComponent(claimId)}`),

  listClaimDocuments: (claimId: string) =>
    adminRequest<{ documents: ClaimDocumentRow[]; count: number }>(
      `/api/claims/${encodeURIComponent(claimId)}/documents`,
    ),

  getInternalPolicy: (policyRef: string) =>
    adminRequest<InternalPolicyRecord>(`/api/internal/policies/${encodeURIComponent(policyRef)}`),

  claimDocumentContentUrl: (claimId: string, docId: string) =>
    `/api/claims/${encodeURIComponent(claimId)}/documents/${encodeURIComponent(docId)}/content`,

  listClaimQueries: (claimId: string) =>
    adminRequest<{ queries: ClaimQueryRow[]; count: number; open_count: number }>(
      `/api/claims/${encodeURIComponent(claimId)}/queries`,
    ),

  createClaimQuery: (claimId: string, body: { message: string; requires_documents?: boolean }) =>
    adminRequest<ClaimQueryRow>(`/api/claims/${encodeURIComponent(claimId)}/queries`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateClaimStatus: (claimId: string, status: string) =>
    adminRequest<AdminClaimRow>(`/api/claims/${encodeURIComponent(claimId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  reviewClaim: (claimId: string) =>
    adminRequest<AdminClaimRow>(`/api/claims/${encodeURIComponent(claimId)}/review`, { method: 'POST' }),

  approveClaim: (claimId: string, approvedAmount?: number) =>
    adminRequest<AdminClaimRow>(`/api/claims/${encodeURIComponent(claimId)}/approve`, {
      method: 'POST',
      body: JSON.stringify(approvedAmount != null ? { approved_amount: approvedAmount } : {}),
    }),

  rejectClaim: (claimId: string, reason?: string) =>
    adminRequest<AdminClaimRow>(`/api/claims/${encodeURIComponent(claimId)}/reject`, {
      method: 'POST',
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  listParametricRules: () =>
    adminRequest<{ rules: ParametricRuleRow[]; count: number }>('/api/parametric/rules'),

  createParametricRule: (body: Record<string, unknown>) =>
    adminRequest<ParametricRuleRow>('/api/parametric/rules', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listParametricTriggers: () =>
    adminRequest<{ triggers: ParametricTriggerRow[]; count: number }>('/api/parametric/triggers'),

  simulateFlightDelay: (body: {
    rule_id: string;
    flight_number?: string;
    travel_date?: string;
    flight_delay_minutes: number;
  }) =>
    adminRequest<ParametricSimulateResult>('/api/parametric/simulate/flight-delay', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  simulateTripCancellation: (body: {
    rule_id: string;
    flight_number?: string;
    travel_date?: string;
  }) =>
    adminRequest<ParametricSimulateResult>('/api/parametric/simulate/trip-cancellation', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getParametricOracleStatus: () =>
    adminRequest<ParametricOracleStatus>('/api/parametric/oracle/status'),

  pollParametricOracle: (body?: { rule_id?: string }) =>
    adminRequest<ParametricOraclePollResult>('/api/parametric/oracle/poll', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  triggerParametricOracle: (body: { rule_id: string }) =>
    adminRequest<ParametricOraclePollResult>('/api/parametric/trigger/oracle', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  insuranceChain: () => request<InsuranceChainResponse>('/api/blockchain/chain'),

  insuranceChainCapabilities: () =>
    request<{ capabilities: Record<string, unknown> }>('/api/blockchain/chain/capabilities'),

  chainObservability: () => request<ChainObservabilityResponse>('/api/blockchain/observability'),

  cantonStatus: () => request<CantonStatus>('/api/blockchain/canton/status'),

  cantonPolicies: () =>
    request<{ records: CantonPolicyRecord[]; count: number; live: boolean }>(
      '/api/blockchain/canton/policies',
    ),

  gculSidecarHealth: () => request<Record<string, unknown>>('/api/blockchain/gcul/health'),

  listBlockchainTransactions: () =>
    request<{ transactions: BlockchainLedgerTx[]; count: number }>('/api/blockchain/transactions'),

  walletOpsView: () => adminRequest<WalletOpsView>('/api/admin/wallet-ops'),

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
    const paymentStatus = pay?.status ?? row.payment_status;
    if (!paymentStatus) return row;
    return {
      ...row,
      payment_status: paymentStatus,
      policy_ref: pay?.policy_ref ?? row.policy_ref,
      status: paymentStatus === 'paid' ? 'active' : row.status,
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
