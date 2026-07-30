import { adminApi, getAdminToken } from '../api';

export const CUSTOMER_APP_ORIGIN =
  (import.meta.env.VITE_CUSTOMER_APP_URL as string | undefined)?.trim() || 'http://localhost:5174';

export type StackSimStepId =
  | 'customer-register'
  | 'admin-customers'
  | 'customer-home-kyc'
  | 'customer-kyc'
  | 'customer-wallet'
  | 'customer-health-quote'
  | 'customer-pay-premium'
  | 'admin-wallet-premium'
  | 'admin-mint'
  | 'customer-cover-active'
  | 'customer-claim'
  | 'admin-claim-approve'
  | 'customer-wallet-claim'
  | 'admin-wallet-debit';

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
  { id: 'customer-register', label: 'Customer — register (demo fill)' },
  { id: 'admin-customers', label: 'Admin — verify new customer' },
  { id: 'customer-home-kyc', label: 'Customer — home → Start KYC' },
  { id: 'customer-kyc', label: 'Customer — KYC demo fill & consent' },
  { id: 'customer-wallet', label: 'Customer — wallet create & top-up' },
  { id: 'customer-health-quote', label: 'Customer — Critical illness quote' },
  { id: 'customer-pay-premium', label: 'Customer — pay premium from wallet' },
  { id: 'admin-wallet-premium', label: 'Admin — wallet ops premium credit' },
  { id: 'admin-mint', label: 'Admin — tokenization mint queue approve' },
  { id: 'customer-cover-active', label: 'Customer — cover active on policy' },
  { id: 'customer-claim', label: 'Customer — file claim' },
  { id: 'admin-claim-approve', label: 'Admin — claims review & approve' },
  { id: 'customer-wallet-claim', label: 'Customer — wallet claim credit' },
  { id: 'admin-wallet-debit', label: 'Admin — wallet ops pool debit' },
];

type SimContext = {
  email: string;
  password: string;
  userId?: string;
  policyId?: string;
  quoteId?: string;
  claimId?: string;
  premiumPaid?: number;
  balanceBeforeClaim?: number;
};

export type StackSimOptions = {
  customerEmail?: string;
  customerPassword?: string;
  openTabs?: boolean;
  onStep?: (step: StackSimStep) => void;
  onLog?: (line: StackSimLogLine) => void;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logLine(level: StackSimLogLevel, text: string): StackSimLogLine {
  return { at: new Date().toISOString(), level, text };
}

function buildAppUrl(origin: string, path: string, params: Record<string, string | undefined>) {
  const url = new URL(path, origin);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

function encodeUserPayload(user: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(user))));
}

export function customerBootstrapUrl(token: string, user: unknown, next = '/') {
  const params = new URLSearchParams({
    token,
    user: encodeUserPayload(user),
    next,
  });
  return `${CUSTOMER_APP_ORIGIN}/simulate/bootstrap?${params.toString()}`;
}

class SimTabManager {
  private customerWin: Window | null = null;
  private adminWin: Window | null = null;

  goCustomer(path: string, params: Record<string, string | undefined> = {}) {
    const url = buildAppUrl(CUSTOMER_APP_ORIGIN, path, params);
    if (!this.customerWin || this.customerWin.closed) {
      this.customerWin = window.open(url, 'gcul-sim-customer');
    } else {
      this.customerWin.location.href = url;
    }
    this.customerWin?.focus();
  }

  goAdmin(path: string, params: Record<string, string | undefined> = {}) {
    const url = buildAppUrl(window.location.origin, path, params);
    if (!this.adminWin || this.adminWin.closed) {
      this.adminWin = window.open(url, 'gcul-sim-admin');
    } else {
      this.adminWin.location.href = url;
    }
    this.adminWin?.focus();
  }

  focusCustomer() {
    this.customerWin?.focus();
  }

  focusAdmin() {
    this.adminWin?.focus();
  }
}

async function pollPolicyAfterPayment(email: string, maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const { policies } = await adminApi.listPolicies();
    const row = policies.find((p) => p.customer_email?.toLowerCase() === email.toLowerCase());
    if (row && (row.payment_status === 'paid' || row.status === 'active')) {
      return row;
    }
    await sleep(2000);
  }
  return null;
}

async function pollClaim(email: string, maxMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const { claims } = await adminApi.listClaims();
    const row = claims.find(
      (c) => c.customer_email?.toLowerCase() === email.toLowerCase() && c.status !== 'rejected',
    );
    if (row) return row;
    await sleep(2000);
  }
  return null;
}

export async function runPlatformStackSimulation(options: StackSimOptions = {}) {
  if (!getAdminToken()) {
    throw new Error('Sign in to the admin app before running the stack simulation.');
  }

  const emit = options.onLog;
  const tabs = new SimTabManager();
  const openTabs = options.openTabs ?? true;

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
    options.customerEmail?.trim() || `demo-customer-${Date.now()}@reboot2026.local`;

  const ctx: SimContext = { email, password };

  const customer = (path: string, params: Record<string, string | undefined> = {}) => {
    if (!openTabs) return;
    tabs.goCustomer(path, params);
  };

  const admin = (path: string, params: Record<string, string | undefined> = {}) => {
    if (!openTabs) return;
    tabs.goAdmin(path, params);
  };

  emit?.(logLine('info', `Onboarding simulation for ${email}`));

  await runStep('customer-register', async () => {
    customer('/register', { sim: 'register-demo', simEmail: email });
    await sleep(5500);
    return `Registered ${email}`;
  });

  await runStep('admin-customers', async () => {
    await adminApi.refreshKycAdminCache().catch(() => undefined);
    const { customers } = await adminApi.listCustomers();
    const row = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
    ctx.userId = row?.id;
    admin('/customers', { sim: 'highlight-customer', simEmail: email });
    await sleep(3500);
    return row ? `Customer visible: ${row.full_name}` : 'Open Customers — search for new registration';
  });

  await runStep('customer-home-kyc', async () => {
    customer('/', { sim: 'go-kyc' });
    await sleep(3500);
    return 'Home → KYC started';
  });

  await runStep('customer-kyc', async () => {
    customer('/kyc', { sim: 'kyc-complete' });
    await sleep(14000);
    if (ctx.userId) {
      try {
        await adminApi.updateCustomerKyc(ctx.userId, 'verified');
      } catch {
        // already verified via consent
      }
    }
    return 'KYC documents, consent, and verification';
  });

  await runStep('customer-wallet', async () => {
    customer('/wallet', { sim: 'wallet-setup' });
    await sleep(9000);
    return 'Wallet created and topped up';
  });

  await runStep('customer-health-quote', async () => {
    customer('/marketplace', { sim: 'browse-health' });
    await sleep(16000);
    return 'Critical illness quote saved';
  });

  await runStep('customer-pay-premium', async () => {
    customer('/policies', { sim: 'pay-quote' });
    await sleep(12000);
    const policyRow = await pollPolicyAfterPayment(email);
    if (policyRow) {
      ctx.policyId = policyRow.id;
      ctx.quoteId = policyRow.quote_id;
      ctx.premiumPaid = policyRow.premium;
    }
    return policyRow
      ? `Premium paid — policy ${policyRow.policy_number ?? policyRow.id}`
      : 'Premium payment sent — check Policies tab';
  });

  await runStep('admin-wallet-premium', async () => {
    admin('/wallet', {
      sim: 'highlight-premium',
      simEmail: email,
      simQuoteId: ctx.quoteId ?? '',
    });
    await sleep(4000);
    const view = await adminApi.walletOpsView();
    const premiumTx = view.transactions?.find(
      (t) => t.type === 'premium' && (t.customer_email === email || t.reference?.includes(ctx.quoteId ?? '')),
    );
    return premiumTx
      ? `Premium credit highlighted: £${premiumTx.amount}`
      : `Wallet ops — premium volume £${view.stats.premium_volume_gbp}`;
  });

  await runStep('admin-mint', async () => {
    if (!ctx.policyId) {
      const policyRow = await pollPolicyAfterPayment(email, 15000);
      ctx.policyId = policyRow?.id;
    }
    if (!ctx.policyId) {
      throw new Error('No policy id for mint approval');
    }
    admin('/tokenization', {
      sim: 'approve-mint',
      simTab: 'mint-queue',
      simPolicyId: ctx.policyId,
    });
    await sleep(12000);
    let view = await adminApi.tokenizationView();
    if (view.mint_queue.some((m) => m.id === ctx.policyId)) {
      await adminApi.approvePolicyMint(ctx.policyId!);
      view = await adminApi.tokenizationView();
    }
    const minted = view.registry?.some((r) => r.id === ctx.policyId || r.policy_number.includes(ctx.policyId!));
    return minted ? `Mint approved for ${ctx.policyId}` : `Mint flow completed for ${ctx.policyId}`;
  });

  await runStep('customer-cover-active', async () => {
    customer('/policies', { sim: 'highlight-cover-active' });
    await sleep(4000);
    return 'Active cover highlighted on policy card';
  });

  await runStep('customer-claim', async () => {
    customer('/claims', { sim: 'claim-submit' });
    await sleep(14000);
    const claim = await pollClaim(email);
    if (claim) ctx.claimId = claim.id;
    return claim ? `Claim ${claim.id} submitted` : 'Claim submitted — check Claims tab';
  });

  await runStep('admin-claim-approve', async () => {
    if (!ctx.claimId) {
      const claim = await pollClaim(email, 10000);
      ctx.claimId = claim?.id;
    }
    if (!ctx.claimId) {
      throw new Error('No claim to approve');
    }
    admin('/claims', { sim: 'approve-claim', simClaimId: ctx.claimId });
    await sleep(12000);
    const updated = await adminApi.getClaim(ctx.claimId);
    return `Claim ${ctx.claimId} — ${updated.status}`;
  });

  await runStep('customer-wallet-claim', async () => {
    customer('/wallet', { sim: 'highlight-wallet-claim' });
    await sleep(4000);
    return 'Wallet credited — claim payout highlighted';
  });

  await runStep('admin-wallet-debit', async () => {
    admin('/wallet', { sim: 'highlight-debit', simEmail: email });
    await sleep(4000);
    const view = await adminApi.walletOpsView();
    return `Claims pool £${view.stats.claims_pool_balance_gbp ?? '—'} — debit highlighted`;
  });

  emit?.(logLine('ok', 'Onboarding simulation completed'));

  return {
    email: ctx.email,
    password: options.customerEmail?.trim() ? undefined : password,
    policyId: ctx.policyId,
    claimId: ctx.claimId,
  };
}
