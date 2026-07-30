/**
 * Capture screenshots of all customer (web) app pages, tabs, and sub-tabs.
 * Usage: node scripts/capture-customer-screenshots.mjs
 * Requires: web dev server on http://localhost:5174 and local APIs (kyc, policy).
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, access, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'customer-screenshots');
const BASE = process.env.WEB_URL || 'http://localhost:5174';

const PRODUCT_SLUGS = [
  'home-insurance',
  'life-insurance',
  'critical-illness',
  'car-insurance',
  'van-insurance',
  'pet-insurance',
  'health-plan',
  'income-protection',
];

const MARKETPLACE_CATEGORIES = ['All', 'Health', 'Vehicle', 'Pet', 'Property', 'Life', 'Travel'];

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

async function goto(page, url, waitMs = 1400) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(waitMs);
}

async function clickChipOrTab(page, label) {
  const btn = page
    .locator('.customer-chip, .customer-tab, .compare-tab')
    .filter({ hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') })
    .first();
  if ((await btn.count()) > 0) {
    await btn.click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

async function registerAndSession(page) {
  await goto(page, '/login', 800);
  const creds = await page.evaluate(async () => {
    const email = `screenshot-${Date.now()}@reboot2026.local`;
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Screenshot Demo Customer',
        email,
        mobile_number: '+447700900123',
        password: 'ChangeMe123!',
        terms_accepted: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Register failed: ${text}`);
    }
    const data = await res.json();
    localStorage.setItem('gcul_token', data.access_token);
    localStorage.setItem('gcul_user', JSON.stringify(data.user));
    localStorage.setItem('gcul_view_mode', 'desktop');
    return { email };
  });
  console.log(`Registered ${creds.email}`);
  return creds;
}

async function listProductIds(page) {
  return page.evaluate(async () => {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to list products');
    const data = await res.json();
    return (data.products ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
    }));
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('gcul_view_mode', 'desktop');
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();

  console.log('Public pages…');
  await goto(page, '/');
  await capture(page, '00-landing', 'Landing / home');

  await goto(page, '/register');
  await capture(page, '00-register', 'Register');

  await goto(page, '/login');
  await capture(page, '00-login', 'Login');

  await goto(page, '/forgot-password');
  await capture(page, '00-forgot-password', 'Forgot password');

  await goto(page, '/reset-password');
  await capture(page, '00-reset-password', 'Reset password');

  await goto(page, '/wallet/approve');
  await capture(page, '00-wallet-approve', 'Wallet approval (public)');

  for (const slug of PRODUCT_SLUGS) {
    await goto(page, `/products/${slug}`);
    await capture(page, `01-product__${slug}`, `Product marketing — ${slug}`);
  }

  console.log('Authenticated session…');
  await registerAndSession(page);

  await goto(page, '/kyc');
  await capture(page, '02-kyc', 'KYC onboarding');

  await goto(page, '/wallet');
  await capture(page, '03-wallet__overview', 'Wallet — overview');
  await clickChipOrTab(page, 'Top up');
  await capture(page, '03-wallet__top-up-activity', 'Wallet — top up & activity');

  await goto(page, '/marketplace');
  for (const cat of MARKETPLACE_CATEGORIES) {
    await clickChipOrTab(page, cat === 'All' ? 'All' : cat);
    await capture(page, `04-marketplace__${slug(cat)}`, `Marketplace — ${cat}`);
  }

  let products = [];
  try {
    products = await listProductIds(page);
  } catch (err) {
    console.warn('Could not list products for quote screenshots:', err.message);
  }

  const quoteIds = products.length
    ? products.slice(0, 6).map((p) => p.id)
    : ['critical-illness', 'health-plan', 'home-insurance', 'car-insurance', 'travel-insurance', 'motor-protect-plus'];

  for (const productId of quoteIds) {
    await goto(page, `/quote/${encodeURIComponent(productId)}`);
    await capture(page, `05-quote__${slug(productId)}`, `Quote builder — ${productId}`);
  }

  await goto(page, '/compare');
  await capture(page, '06-compare__policies', 'Compare — policies');
  await clickChipOrTab(page, 'Quotes');
  await capture(page, '06-compare__quotes', 'Compare — quotes');

  await goto(page, '/policies');
  await capture(page, '07-policies', 'Policies & quotes');

  await goto(page, '/claims');
  await capture(page, '08-claims__start', 'Claims — start claim');
  await clickChipOrTab(page, 'Track claims');
  await capture(page, '08-claims__track', 'Claims — track');
  await clickChipOrTab(page, 'Settlement trail');
  await capture(page, '08-claims__settlement', 'Claims — settlement trail');

  await goto(page, '/profile');
  await capture(page, '09-profile__account', 'Profile — account');
  await clickChipOrTab(page, 'Wallet');
  await capture(page, '09-profile__wallet', 'Profile — wallet');

  await goto(page, '/payment/success');
  await capture(page, '10-payment-success', 'Payment success');

  await goto(page, '/payment/cancel');
  await capture(page, '10-payment-cancel', 'Payment cancel');

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
