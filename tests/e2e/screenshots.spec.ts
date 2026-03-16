/**
 * Screenshot capture for UX/UI design evaluation.
 * Captures all key screens at desktop (1280x900) and mobile (390x844).
 * Output: screenshots/ directory at project root.
 *
 * Run: npx playwright test tests/e2e/screenshots.spec.ts
 */

import { test, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:8080';
const PORTAL_TOKEN = 'test-portal-acme-corp-abc12345';
const OUT = path.join(process.cwd(), 'screenshots');

// Ensure output directories exist
const dirs = ['desktop', 'mobile', 'desktop/client-detail', 'desktop/portal', 'mobile/portal'];
dirs.forEach(d => fs.mkdirSync(path.join(OUT, d), { recursive: true }));

const shot = (page: Page, filename: string) =>
  page.screenshot({ path: path.join(OUT, filename), fullPage: true });

// ---------------------------------------------------------------------------
// Helper: navigate to the first client in the list
// ---------------------------------------------------------------------------
async function goToFirstClient(page: Page): Promise<string | null> {
  await page.goto(`${BASE}/clients`);
  await page.waitForLoadState('networkidle');
  const allBtn = page.getByRole('button', { name: /^all$/i });
  if ((await allBtn.count()) > 0) { await allBtn.first().click(); await page.waitForTimeout(300); }
  const firstRow = page.locator('table tbody tr').first();
  if ((await firstRow.count()) === 0) return null;
  await firstRow.click();
  await page.waitForURL(/\/clients\/.+/);
  await page.waitForLoadState('networkidle');
  return page.url();
}

// ---------------------------------------------------------------------------
// Helper: open a dialog and screenshot it
// ---------------------------------------------------------------------------
async function withDialog(page: Page, open: () => Promise<void>, filename: string) {
  await open();
  await page.waitForSelector('[role="dialog"]', { timeout: 5_000 }).catch(() => null);
  await page.waitForTimeout(300);
  await shot(page, filename);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

// ===========================================================================
// DESKTOP (1280 x 900)
// ===========================================================================

test.describe('Desktop screenshots (1280x900)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  // ── Auth ──────────────────────────────────────────────────────────────────

  test('login page', async ({ browser }) => {
    // Use a fresh unauthenticated context so we see the real login screen
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/01-login.png');
    await ctx.close();
  });

  // ── Operator app ──────────────────────────────────────────────────────────

  test('dashboard', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'desktop/02-dashboard.png');
  });

  test('client list', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/03-client-list.png');
  });

  test('client list — search active', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[placeholder*="earch"]').first().fill('grow');
    await page.waitForTimeout(500);
    await shot(page, 'desktop/04-client-list-search.png');
  });

  test('client detail — deliveries tab', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(400);
    await shot(page, 'desktop/client-detail/05-deliveries-tab.png');
  });

  test('client detail — log delivery dialog', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);
    await withDialog(
      page,
      () => page.getByRole('button', { name: 'Log Delivery' }).first().click(),
      'desktop/client-detail/06-log-delivery-dialog.png'
    );
  });

  test('client detail — scope tab', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Scope' }).click();
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/client-detail/07-scope-tab.png');
  });

  test('client detail — requests tab', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/client-detail/08-requests-tab.png');
  });

  test('client detail — new scope request dialog', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');
    await withDialog(
      page,
      () => page.getByRole('button', { name: 'New Request' }).click(),
      'desktop/client-detail/09-new-request-dialog.png'
    );
  });

  test('client detail — proposals tab', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Proposals' }).click();
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/client-detail/10-proposals-tab.png');
  });

  test('client detail — portal tab', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Portal' }).click();
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/client-detail/11-portal-tab.png');
  });

  test('client detail — reports tab', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Reports' }).click();
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/client-detail/12-reports-tab.png');
  });

  test('client detail — timeline tab', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Timeline' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await shot(page, 'desktop/client-detail/13-timeline-tab.png');
  });

  test('add client dialog', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');
    await withDialog(
      page,
      () => page.getByRole('button', { name: /add client/i }).first().click(),
      'desktop/14-add-client-dialog.png'
    );
  });

  test('proposals list', async ({ page }) => {
    await page.goto(`${BASE}/proposals`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/15-proposals-list.png');
  });

  test('proposal builder', async ({ page }) => {
    await page.goto(`${BASE}/proposals/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'desktop/16-proposal-builder.png');
  });

  test('revenue page', async ({ page }) => {
    await page.goto(`${BASE}/revenue`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/17-revenue.png');
  });

  test('approvals page', async ({ page }) => {
    await page.goto(`${BASE}/approvals`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/18-approvals.png');
  });

  test('invoices page', async ({ page }) => {
    await page.goto(`${BASE}/invoices`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/19-invoices.png');
  });

  test('settings page', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'desktop/20-settings.png');
  });

  // ── Client portal ─────────────────────────────────────────────────────────

  test('portal — home section', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/portal/${PORTAL_TOKEN}`);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'desktop/portal/21-portal-home.png');
    await ctx.close();
  });

  test('portal — request something dialog', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/portal/${PORTAL_TOKEN}`);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /request something/i }).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5_000 });
    await page.waitForTimeout(300);
    await shot(page, 'desktop/portal/22-portal-request-dialog.png');
    await ctx.close();
  });

  test('portal — work done section', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/portal/${PORTAL_TOKEN}?section=work`);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'desktop/portal/23-portal-work-done.png');
    await ctx.close();
  });

  test('portal — ask your team section', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/portal/${PORTAL_TOKEN}?section=requests`);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'desktop/portal/24-portal-ask-team.png');
    await ctx.close();
  });

  test('portal — invalid token error state', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/portal/this-token-does-not-exist`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);
    await shot(page, 'desktop/portal/25-portal-invalid-token.png');
    await ctx.close();
  });
});

// ===========================================================================
// MOBILE (390 x 844 — iPhone 14)
// ===========================================================================

test.describe('Mobile screenshots (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login page — mobile', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'mobile/01-login.png');
    await ctx.close();
  });

  test('dashboard — mobile', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'mobile/02-dashboard.png');
  });

  test('client list — mobile', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'mobile/03-client-list.png');
  });

  test('mobile nav sheet open', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /open navigation/i }).click();
    await page.waitForTimeout(400);
    await shot(page, 'mobile/04-nav-sheet-open.png');
    await page.keyboard.press('Escape');
  });

  test('client detail — mobile', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await shot(page, 'mobile/05-client-detail.png');
  });

  test('client detail — deliveries tab mobile', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }
    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);
    await shot(page, 'mobile/06-deliveries-tab.png');
  });

  test('portal home — mobile', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/portal/${PORTAL_TOKEN}`);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'mobile/portal/07-portal-home.png');
    await ctx.close();
  });

  test('portal nav sheet open — mobile', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/portal/${PORTAL_TOKEN}`);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /open navigation/i }).click();
    await page.waitForTimeout(400);
    await shot(page, 'mobile/portal/08-portal-nav-open.png');
    await ctx.close();
  });

  test('portal request dialog — mobile', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/portal/${PORTAL_TOKEN}`);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /request something/i }).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5_000 }).catch(() => null);
    await page.waitForTimeout(300);
    await shot(page, 'mobile/portal/09-portal-request-dialog.png');
    await ctx.close();
  });
});
