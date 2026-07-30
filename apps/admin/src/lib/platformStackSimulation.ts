import { adminApi, getAdminToken } from '../api';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
export const CUSTOMER_APP_ORIGIN =
  (import.meta.env.VITE_CUSTOMER_APP_URL as string | undefined)?.trim() || 'http://localhost:5174';

export type StackSimStepId =
  | 'customer-auth'
  | 'customer-kyc'
  | 'customer-wallet'
  | 'customer-quote-pay'
  | 'open-customer-policies'
  | 'admin-policies'
  | 'admin-wallet-ops'
  | 'admin-mint'
  | 'open-customer-claims'
  | 'customer-claim'
  | 'admin-claim-approve'
  | 'open-customer-wallet'
  | 'verify-wallet-credit';

export type StackSimStepState = 'pending' | 'running' | 'done' | 'error' | 'skipped';

export type StackSimLogLevel = 'info' | 'ok' | 'warn' | 'error';

export type StackSimLogLine = {
  at: string;
  level: StackSimLogLevel;
  text: string;
};

export type StackSimStep = {
  id: StackSimStepId;
  label: string;
  state: StackSimStepState;
  detail?: string;
};

export const STACK_SIM_STEPS: Omit<StackSimStep, 'state'>[] = [
  { id: 'customer-auth', label: 'Customer sign-in / register' },
  { id: 'customer-kyc', label: 'KYC ready for wallet' },
  { id: 'customer-wallet', label: 'Wallet funded' },
  { id: 'customer-quote-pay', label: 'Quote + wallet premium payment' },
  { id: 'open-customer-policies', label: 'Open customer policies' },
  { id: 'admin-policies', label: 'Admin policies check' },
  { id: 'admin-wallet-ops', label: 'Admin wallet ops (premium)' },
  { id: 'admin-mint', label: 'Approve policy mint (tokenization)' },
  { id: 'open-customer-claims', label: 'Open customer claims' },
  { id: 'customer-claim', label: 'File claim' },
  { id: 'admin-claim-approve', label: 'Approve claim payout' },
  { id: 'open-customer-wallet', label: 'Open customer wallet' },
  { id: 'verify-wallet-credit', label: 'Verify wallet credited' },
];

type CustomerUser = {
  id: string;
  full_name: string;
  email: string;
  mobile_number?: string;
  kyc_status: string;
};

type SimContext = {
  token: string;
  user: CustomerUser;
  policyId?: string;
  policyNumber?: string;
  quoteId?: string;
  premiumPaid?: number;
  balanceBeforeClaim?: number;
  balanceAfterClaim?: number;
  claimId?: string;
  claimAmount?: number;
};

export type StackSimOptions = {
  customerEmail?: string;
  customerPassword?: string;
  registerNew?: boolean;
  openTabs?: boolean;
  onStep?: (step: StackSimStep) => void;
  onLog?: (line: StackSimLogLine) => void;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeUserPayload(user: unknown): string {
  return btoa(
    unescape(encodeURIComponent(JSON.stringify(user))),
  );
}

export function customerBootstrapUrl(token: string, user: unknown, next = '/policies') {
  const params = new URLSearchParams({
    token,
    user: encodeUserPayload(user),
    next,
  });
  return `${CUSTOMER_APP_ORIGIN}/simulate/bootstrap?${params.toString()}`;
}

function logLine(level: StackSimLogLevel, text: string): StackSimLogLine {
  return { at: new Date().toISOString(), level, text };
}

async function customerJson<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
    const body = (data ?? {}) as { detail?: string; message?: string; error?: string };
    throw new Error(body.detail ?? body.message ?? body.error ?? res.statusText);
  }
  return data as T;
}

async function demoJpegBlob(): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#006a4d';
    ctx.fillRect(0, 0, 4, 4);
  }
  return await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create demo image'))), 'image/jpeg', 0.92);
  });
}

async function uploadDemoKyc(token: string) {
  const blob = await demoJpegBlob();
  const doc = new File([blob], 'demo-passport.jpg', { type: 'image/jpeg' });
  const selfie = new File([blob], 'demo-selfie.jpg', { type: 'image/jpeg' });

  const upload = async (path: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text.slice(0, 200) || res.statusText);
    }
  };

  await upload('/api/kyc/document', doc);
  await sleep(300);
  await upload('/api/kyc/selfie', selfie);
}

function travelQuoteAnswers(email: string): Record<string, string | number> {
  const departure = new Date();
  departure.setDate(departure.getDate() + 45);
  const returnDate = new Date(departure);
  returnDate.setDate(returnDate.getDate() + 7);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    destination: 'Spain',
    trip_type: 'Round trip',
    departure_date: fmt(departure),
    return_date: fmt(returnDate),
    travellers: 1,
    flight_number: 'BA117',
    coverage_flight_delay: 'No',
    coverage_cancellation: 'No',
    email,
  };
}

async function ensureKycVerified(ctx: SimContext, emit: StackSimOptions['onLog']) {
  let user = await customerJson<CustomerUser>('/api/auth/me', {}, ctx.token);
  if (user.kyc_status === 'verified') {
    ctx.user = user;
    return;
  }

  emit?.(logLine('info', 'Uploading demo KYC documents…'));
  await uploadDemoKyc(ctx.token);
  await customerJson('/api/kyc/submit', {
    method: 'POST',
    body: JSON.stringify({
      document_type: 'passport',
      document_uploaded: true,
      selfie_captured: true,
    }),
  }, ctx.token);

  user = await customerJson<CustomerUser>('/api/auth/me', {}, ctx.token);
  if (user.kyc_status === 'pending_consent') {
    emit?.(logLine('info', 'Accepting KYC digitisation consent…'));
    await customerJson('/api/kyc/consent', { method: 'POST' }, ctx.token);
    user = await customerJson<CustomerUser>('/api/auth/me', {}, ctx.token);
  }

  if (user.kyc_status !== 'verified') {
    emit?.(logLine('warn', 'KYC still not verified — approving via admin API…'));
    await adminApi.updateCustomerKyc(user.id, 'verified');
    user = await customerJson<CustomerUser>('/api/auth/me', {}, ctx.token);
  }

  ctx.user = user;
}

async function ensureWalletFunded(ctx: SimContext, emit: StackSimOptions['onLog']) {
  let wallet = await customerJson<{ status: string; balance_gbp: number; address?: string | null }>(
    '/api/wallet',
    {},
    ctx.token,
  );

  if (wallet.status !== 'connected' || !wallet.address) {
    emit?.(logLine('info', 'Creating demo wallet…'));
    wallet = await customerJson<{ status: string; balance_gbp: number; address?: string | null }>(
      '/api/wallet/create',
      { method: 'POST' },
      ctx.token,
    );
  }

  const targetBalance = 500;
  if (wallet.balance_gbp < targetBalance) {
    emit?.(logLine('info', `Recharging wallet to £${targetBalance}…`));
    const recharged = await customerJson<{ balance_gbp: number }>(
      '/api/wallet/recharge',
      {
        method: 'POST',
        body: JSON.stringify({ amount: targetBalance, bankAccount: 'Lloyds Bank' }),
      },
      ctx.token,
    );
    wallet.balance_gbp = recharged.balance_gbp;
  }
}

async function pollMintQueue(policyId: string, maxMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const view = await adminApi.tokenizationView();
    const row = view.mint_queue.find((r) => r.id === policyId);
    if (row) return row;
    await sleep(1500);
  }
  return null;
}

export async function runPlatformStackSimulation(options: StackSimOptions = {}) {
  if (!getAdminToken()) {
    throw new Error('Sign in to the admin app before running the stack simulation.');
  }

  const emit = options.onLog;
  const stepStates = new Map<StackSimStepId, StackSimStep>(
    STACK_SIM_STEPS.map((s) => [s.id, { ...s, state: 'pending' as StackSimStepState }] as const),
  );

  const pushStep = (id: StackSimStepId, state: StackSimStepState, detail?: string) => {
    const base = stepStates.get(id);
    if (!base) return;
    const next = { ...base, state, detail };
    stepStates.set(id, next);
    options.onStep?.(next);
  };

  const runStep = async (id: StackSimStepId, fn: () => Promise<string | void>) => {
    pushStep(id, 'running');
    try {
      const detail = await fn();
      pushStep(id, 'done', detail ?? undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushStep(id, 'error', message);
      emit?.(logLine('error', message));
      throw err;
    }
  };

  const password = options.customerPassword?.trim() || 'ChangeMe123!';
  const email =
    options.customerEmail?.trim() ||
    `stack-demo-${Date.now()}@reboot2026.local`;

  const ctx: SimContext = {
    token: '',
    user: { id: '', full_name: '', email, kyc_status: 'not_started' },
  };

  const openCustomer = (next: string) => {
    if (!options.openTabs || !ctx.token) return;
    window.open(customerBootstrapUrl(ctx.token, ctx.user, next), '_blank', 'noopener,noreferrer');
  };

  const openAdmin = (path: string) => {
    if (!options.openTabs) return;
    window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer');
  };

  emit?.(logLine('info', `Starting stack simulation for ${email}`));

  await runStep('customer-auth', async () => {
    if (options.registerNew || !options.customerEmail?.trim()) {
      emit?.(logLine('info', `Registering demo customer ${email}`));
      const reg = await customerJson<{ access_token: string; user: CustomerUser }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            full_name: 'Stack simulation user',
            email,
            mobile_number: '+447700900123',
            terms_accepted: true,
            password,
          }),
        },
      );
      ctx.token = reg.access_token;
      ctx.user = reg.user;
    } else {
      emit?.(logLine('info', `Signing in as ${email}`));
      const login = await customerJson<{ access_token: string; user: CustomerUser }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ identifier: email, password }),
        },
      );
      ctx.token = login.access_token;
      ctx.user = login.user;
    }
    return `Signed in as ${ctx.user.email}`;
  });

  await runStep('customer-kyc', async () => {
    await ensureKycVerified(ctx, emit);
    return `KYC: ${ctx.user.kyc_status}`;
  });

  await runStep('customer-wallet', async () => {
    await ensureWalletFunded(ctx, emit);
    const wallet = await customerJson<{ balance_gbp: number }>('/api/wallet', {}, ctx.token);
    return `Balance £${wallet.balance_gbp.toFixed(2)}`;
  });

  await runStep('customer-quote-pay', async () => {
    const estimate = await customerJson<{
      quote_id: string;
      estimated_premium: number;
      product_title: string;
    }>('/api/quotes/estimate', {
      method: 'POST',
      body: JSON.stringify({
        product_id: 'travel-protect-plus',
        answers: travelQuoteAnswers(ctx.user.email),
      }),
    });

    ctx.quoteId = estimate.quote_id;
    const pay = await customerJson<{
      paid: boolean;
      policy_id?: string;
      amount: number;
      balance_gbp: number;
    }>('/api/payments/wallet', {
      method: 'POST',
      body: JSON.stringify({ quote_id: estimate.quote_id }),
    }, ctx.token);

    if (!pay.paid) {
      throw new Error('Wallet premium payment did not complete');
    }

    ctx.policyId = pay.policy_id;
    ctx.premiumPaid = pay.amount;

    if (!ctx.policyId) {
      const policies = await customerJson<{
        policies: Array<{ policy_id: string; policy_number: string }>;
      }>('/api/policies/me', {}, ctx.token);
      const match = policies.policies.find((p) => p.policy_id) ?? policies.policies[0];
      ctx.policyId = match?.policy_id;
      ctx.policyNumber = match?.policy_number;
    }

    return `${estimate.product_title} — paid £${pay.amount.toFixed(2)} (policy ${ctx.policyId ?? 'pending'})`;
  });

  await runStep('open-customer-policies', async () => {
    openCustomer('/policies');
    return 'Customer policies tab opened';
  });

  await runStep('admin-policies', async () => {
    const { policies } = await adminApi.listPolicies();
    const row = policies.find(
      (p) => p.id === ctx.policyId || p.policy_ref === ctx.policyId || p.quote_id === ctx.quoteId,
    );
    openAdmin('/policies');
    return row
      ? `Found policy ${row.policy_number ?? row.id} (${row.status}, mint ${row.mint_status ?? '—'})`
      : `Policies loaded (${policies.length} rows) — check newest issuance`;
  });

  await runStep('admin-wallet-ops', async () => {
    const view = await adminApi.walletOpsView();
    openAdmin('/wallet');
    const premiumTx = view.transactions?.find(
      (t) => t.type === 'premium' || (ctx.quoteId && t.reference?.includes(ctx.quoteId)),
    );
    const poolBalance = view.stats.claims_pool_balance_gbp;
    return premiumTx
      ? `Premium movement seen: £${premiumTx.amount}`
      : `Wallet ops loaded — claims pool £${poolBalance ?? '—'}, premium volume £${view.stats.premium_volume_gbp}`;
  });

  await runStep('admin-mint', async () => {
    if (!ctx.policyId) {
      throw new Error('No policy id from payment — cannot approve mint');
    }

    openAdmin('/tokenization');
    const queued = await pollMintQueue(ctx.policyId);
    if (!queued) {
      const approved = await adminApi.approvePolicyMint(ctx.policyId);
      return `Mint approved (${approved.mint_status ?? 'minted'})`;
    }

    const approved = await adminApi.approvePolicyMint(queued.id);
    return `Mint queue approved for ${queued.policy_number} (${approved.mint_status ?? 'minted'})`;
  });

  const walletBeforeClaim = await customerJson<{ balance_gbp: number }>('/api/wallet', {}, ctx.token);
  ctx.balanceBeforeClaim = walletBeforeClaim.balance_gbp;

  await runStep('open-customer-claims', async () => {
    openCustomer('/claims');
    return 'Customer claims tab opened';
  });

  await runStep('customer-claim', async () => {
    if (!ctx.policyId) {
      throw new Error('Missing policy id for claim');
    }

    const claimAmount = 150;
    const claim = await customerJson<{ id: string; status: string; amount_claimed: number }>(
      '/api/claims',
      {
        method: 'POST',
        body: JSON.stringify({
          policy_ref: ctx.policyId,
          customer_name: ctx.user.full_name,
          customer_id: ctx.user.id,
          customer_email: ctx.user.email,
          category: 'Travel',
          amount_claimed: claimAmount,
          description: 'Stack simulation — delayed baggage reimbursement',
        }),
      },
    );

    ctx.claimId = claim.id;
    ctx.claimAmount = claim.amount_claimed ?? claimAmount;
    return `Claim ${claim.id} filed (${claim.status}) for £${ctx.claimAmount}`;
  });

  await runStep('admin-claim-approve', async () => {
    if (!ctx.claimId) {
      throw new Error('No claim id to approve');
    }
    openAdmin('/claims');
    const approved = await adminApi.approveClaim(ctx.claimId, ctx.claimAmount);
    return `Claim approved — status ${approved.status}`;
  });

  await runStep('open-customer-wallet', async () => {
    openCustomer('/wallet');
    return 'Customer wallet tab opened';
  });

  await runStep('verify-wallet-credit', async () => {
    await sleep(800);
    const wallet = await customerJson<{ balance_gbp: number }>('/api/wallet', {}, ctx.token);
    ctx.balanceAfterClaim = wallet.balance_gbp;
    const before = ctx.balanceBeforeClaim ?? 0;
    const delta = wallet.balance_gbp - before;
    if (delta < (ctx.claimAmount ?? 1) - 0.01) {
      throw new Error(
        `Wallet balance £${wallet.balance_gbp.toFixed(2)} — expected credit of ~£${ctx.claimAmount} (delta £${delta.toFixed(2)})`,
      );
    }
    return `Wallet credited — £${before.toFixed(2)} → £${wallet.balance_gbp.toFixed(2)} (+£${delta.toFixed(2)})`;
  });

  emit?.(logLine('ok', 'Stack simulation completed successfully'));

  return {
    email: ctx.user.email,
    password: options.registerNew || !options.customerEmail?.trim() ? password : undefined,
    policyId: ctx.policyId,
    claimId: ctx.claimId,
    balanceAfterClaim: ctx.balanceAfterClaim,
  };
}
