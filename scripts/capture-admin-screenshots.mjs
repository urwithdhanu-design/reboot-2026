/**
 * Capture screenshots of all admin app pages, tabs, and sub-tabs.
 * Usage: node scripts/capture-admin-screenshots.mjs
 * Requires: admin dev server on http://localhost:5175
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, access, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'admin-screenshots');
const BASE = process.env.ADMIN_URL || 'http://localhost:5175';
const ADMIN_EMAIL = 'admin@reboot2026.local';
const ADMIN_PASSWORD = 'Reboot2026!Admin';
const VENDOR_EMAIL = 'vendor.vitality@example.com';
const VENDOR_PASSWORD = 'VendorDemo123!';

const manifest = [];

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function capture(page, name, description) {
  const file = `${name}.png`;
  const filepath = path.join(OUT, file);
  if (process.env.SKIP_EXISTING === '1') {
    try {
      await access(filepath);
      console.log(`  · skip ${file}`);
      return;
    } catch {
      /* capture */
    }
  }
  // Viewport capture — fullPage hangs on very tall blueprint / kit pages.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.screenshot({ path: filepath, fullPage: false, timeout: 15000 });
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(800);
    }
  }
  manifest.push({ file, description, url: page.url() });
  console.log(`  ✓ ${file}`);
}

async function goto(page, url, waitMs = 1200) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(waitMs);
}

async function clickTabByText(page, text, partial = true) {
  const locator = partial
    ? page.locator('button').filter({ hasText: new RegExp(text, 'i') }).first()
    : page.getByRole('button', { name: text, exact: true });
  if ((await locator.count()) > 0) {
    await locator.click();
    await page.waitForTimeout(1200);
    return true;
  }
  return false;
}

async function clickRoleTab(page, label) {
  const tab = page.getByRole('tab', { name: new RegExp(label, 'i') }).first();
  if ((await tab.count()) > 0) {
    await tab.click();
    await page.waitForTimeout(1200);
    return true;
  }
  return false;
}

async function loginAdmin(page) {
  await goto(page, '/login', 1000);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30000 });
  await page.waitForTimeout(1500);
}

async function captureUrlTabs(page, basePath, tabQuery, tabIds, prefix) {
  for (const id of tabIds) {
    const q = tabQuery ? `${basePath}?${tabQuery}=${id}` : basePath;
    await goto(page, q);
    await capture(page, `${prefix}__${id}`, `${prefix} — ${id}`);
  }
}

async function captureFilterTabs(page, basePath, tabLabels, prefix) {
  await goto(page, basePath);
  for (const label of tabLabels) {
    await clickRoleTab(page, label);
    await capture(page, `${prefix}__${slug(label)}`, `${prefix} — ${label}`);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Public pages…');
  await goto(page, '/login');
  await capture(page, '00-login', 'Admin login');

  await goto(page, '/vendor/login');
  await capture(page, '00-vendor-login', 'Vendor login');

  console.log('Admin authenticated…');
  await loginAdmin(page);
  await capture(page, '01-dashboard__overview', 'Dashboard — overview (default)');

  const dashboardTabs = ['overview', 'financial', 'tokenization', 'operations'];
  for (const t of dashboardTabs) {
    await goto(page, `/?tab=${t}`);
    await capture(page, `01-dashboard__${t}`, `Dashboard — ${t}`);
  }

  const futureViews = ['oracles', 'compliance', 'document-ai', 'eligibility', 'zero-touch'];
  for (const v of futureViews) {
    await goto(page, `/?tab=future&view=${v}`);
    await capture(page, `01-dashboard__future__${v}`, `Dashboard — future — ${v}`);
  }

  await captureFilterTabs(
    page,
    '/customers',
    ['All customers', 'KYC verified', 'Pending KYC'],
    '02-customers',
  );

  await captureFilterTabs(
    page,
    '/kyc',
    ['All', 'Pending', 'Approved', 'Rejected'],
    '03-kyc',
  );

  await goto(page, '/policies');
  await capture(page, '04-policies', 'Policies');

  await captureFilterTabs(
    page,
    '/claims',
    ['All', 'Parametric auto', 'Open', 'In payout', 'Settled', 'Rejected'],
    '05-claims',
  );

  await goto(page, '/parametric');
  await capture(page, '06-parametric', 'Parametric');

  await goto(page, '/workflows');
  await clickTabByText(page, 'Workflow Definitions');
  await capture(page, '07-workflows__definitions', 'Workflows — definitions');
  await clickTabByText(page, 'Active Runs');
  await capture(page, '07-workflows__runs', 'Workflows — active runs');

  await goto(page, '/flows?tab=flows');
  await capture(page, '08-platform-flows__flows', 'Platform flows — flows');
  await goto(page, '/flows?tab=future');
  await capture(page, '08-platform-flows__future', 'Platform flows — future (default)');
  for (const v of futureViews) {
    await goto(page, `/flows?tab=future&view=${v}`);
    await capture(page, `08-platform-flows__future__${v}`, `Platform flows — future — ${v}`);
  }

  await captureFilterTabs(
    page,
    '/platform-observability',
    ['Services', 'API traces', 'Domain events'],
    '09-platform-observability',
  );

  await goto(page, '/audit');
  await capture(page, '10-audit__all-flows', 'Audit trail — all flows');
  const auditFlows = ['KYC', 'Wallet', 'Policy & mint', 'Premium payment', 'Claims & parametric', 'Blockchain'];
  for (const f of auditFlows) {
    await page.selectOption('select', { label: f });
    await page.waitForTimeout(1000);
    await capture(page, `10-audit__${slug(f)}`, `Audit trail — ${f}`);
  }

  await goto(page, '/services');
  await capture(page, '11-platform-services', 'Platform services');

  const tokenTabs = [
    { id: 'registry', label: 'Policy registry' },
    { id: 'mint-queue', label: 'Mint queue' },
    { id: 'failed-mints', label: 'Failed mints' },
    { id: 'standards', label: 'Standards' },
  ];
  await goto(page, '/tokenization');
  for (const t of tokenTabs) {
    await clickTabByText(page, t.label);
    await capture(page, `12-tokenization__${t.id}`, `Tokenization — ${t.label}`);
  }

  const capitalTabs = ['overview', 'home', 'motor', 'health', 'secondary', 'architecture', 'roadmap'];
  await captureUrlTabs(page, '/capital-market', 'view', capitalTabs, '13-capital-market');

  const blueprintTabs = [
    'layers', 'product', 'legal', 'daml', 'trading', 'dvp', 'privacy', 'lifecycle',
    'oracle', 'value', 'limits', 'build', 'scale',
  ];
  await captureUrlTabs(page, '/capital-market/blueprint', 'view', blueprintTabs, '14-canton-blueprint');

  const enterpriseTabs = ['lbg', 'challenges', 'mapping', 'solve-order', 'limits'];
  await captureUrlTabs(page, '/capital-market/enterprise', 'view', enterpriseTabs, '15-canton-enterprise');

  const kitTabs = ['overview', 'architecture', 'mapping', 'modules', 'phases', 'recommendation', 'limits'];
  await captureUrlTabs(page, '/capital-market/kit', 'view', kitTabs, '16-canton-kit-blueprint');

  const liveTabs = ['simulation', 'implementation', 'capital-market'];
  const simSubs = ['ledger', 'platform-flow', 'stack-simulation', 'audit-trail'];
  for (const view of liveTabs) {
    if (view === 'simulation') {
      for (const sub of simSubs) {
        await goto(page, `/capital-market/canton-live?view=${view}&sub=${sub}`);
        await capture(page, `17-canton-live__${view}__${sub}`, `Canton live — ${view} — ${sub}`);
      }
    } else {
      await goto(page, `/capital-market/canton-live?view=${view}`);
      await capture(page, `17-canton-live__${view}`, `Canton live — ${view}`);
    }
  }

  await goto(page, '/compliance');
  await capture(page, '18-compliance', 'Compliance controls');

  await captureFilterTabs(
    page,
    '/observability',
    ['Dashboard', 'Transaction tracing', 'Smart contracts', 'Performance', 'Security alerts'],
    '19-chain-monitor',
  );

  await goto(page, '/blockchain');
  await capture(page, '20-blockchain-ledger__all', 'Blockchain ledger — all ledgers');

  await captureFilterTabs(
    page,
    '/contracts',
    ['Contracts', 'Minted policies', 'Canton', 'Activity'],
    '21-smart-contracts',
  );

  await captureFilterTabs(
    page,
    '/wallet',
    ['Transactions', 'Customer wallets'],
    '22-wallet-ops',
  );

  await goto(page, '/vendors');
  await capture(page, '23-vendors', 'Vendors');

  await goto(page, '/products');
  await capture(page, '24-products', 'Products');

  await goto(page, '/reports');
  await capture(page, '25-reports', 'Reports');

  await goto(page, '/settings');
  await capture(page, '26-settings', 'Settings');

  console.log('Vendor portal…');
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await goto(page, '/vendor/login');
  await page.fill('input[type="email"]', VENDOR_EMAIL);
  await page.fill('input[type="password"]', VENDOR_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.includes('/vendor/portal'), { timeout: 30000 });
  await page.waitForTimeout(2000);
  await capture(page, '27-vendor-portal', 'Vendor portal');

  if (process.env.SKIP_EXISTING === '1') {
    try {
      const prior = JSON.parse(await readFile(path.join(OUT, 'manifest.json'), 'utf8'));
      const seen = new Set(manifest.map((m) => m.file));
      for (const entry of prior) {
        if (!seen.has(entry.file)) manifest.push(entry);
      }
    } catch {
      /* no prior manifest */
    }
  }

  await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone — ${manifest.length} entries in manifest · folder ${OUT}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
