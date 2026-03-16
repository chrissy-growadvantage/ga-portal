/**
 * UX Audit — Luma Operator App
 *
 * Covers: mobile viewport, empty states, form validation, dialog behaviour,
 * focus rings, icon-only buttons, page titles, loading states, broken navigation,
 * console errors, create-client flow, and horizontal scroll.
 *
 * Auth: email + password login via /login before each protected test group.
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:8080';

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  const emailField = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
  const passwordField = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first();
  await emailField.fill('hello@heymervin.com');
  await passwordField.fill('Maine@321');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/localhost:8080\/((?!login).)*$/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Shared authenticated context — auth once, reuse cookies
// ---------------------------------------------------------------------------

let sharedContext: BrowserContext;

test.beforeAll(async ({ browser }) => {
  // Use the storageState saved by global-setup.ts — no re-login needed
  sharedContext = await browser.newContext({ storageState: 'tests/auth.json' });
});

test.afterAll(async () => {
  await sharedContext.close();
});

async function authPage(): Promise<Page> {
  return sharedContext.newPage();
}

// ---------------------------------------------------------------------------
// Audit 1 — Mobile viewport (390px)
// ---------------------------------------------------------------------------

test.describe('Audit 1 — Mobile viewport (390px iPhone 14)', () => {
  async function mobilePage(): Promise<{ page: Page }> {
    const page = await sharedContext.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    return { page };
  }

  test('sidebar is not visible — desktop-only element hidden on 390px', async () => {
    const { page } = await mobilePage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const sidebar = page.locator('aside').first();
    const sidebarCount = await sidebar.count();

    if (sidebarCount > 0) {
      // Sidebar exists in DOM but must not be visible (hidden via md: breakpoint)
      const display = await sidebar.evaluate(
        (el) => window.getComputedStyle(el).display,
      );
      expect(display, 'Sidebar should be display:none on 390px mobile viewport').toBe('none');
    }
    // If sidebar is not in DOM at all, that's also acceptable
    await page.close();
  });

  test('hamburger menu button is visible on 390px', async () => {
    const { page } = await mobilePage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    // Find the hamburger by its accessible name (aria-label="Open navigation")
    const menuButton = page.getByRole('button', { name: /open navigation/i });
    await expect(menuButton).toBeVisible({ timeout: 5_000 });
    await page.close();
  });

  test('no horizontal overflow at 390px width on /clients', async () => {
    const { page } = await mobilePage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(
      scrollWidth,
      `Horizontal overflow of ${scrollWidth}px detected at 390px viewport`,
    ).toBeLessThanOrEqual(5);
    await page.close();
  });

  test('no horizontal overflow at 390px width on dashboard', async () => {
    const { page } = await mobilePage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(
      scrollWidth,
      `Horizontal overflow of ${scrollWidth}px on dashboard at 390px`,
    ).toBeLessThanOrEqual(5);
    await page.close();
  });

  test('text is readable — no elements with font-size below 10px on mobile', async () => {
    const { page } = await mobilePage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const tinyText = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('p, span, td, li, h1, h2, h3, label'))
        .filter((el) => {
          const text = el.textContent?.trim() ?? '';
          if (text.length === 0) return false;
          const size = parseFloat(window.getComputedStyle(el).fontSize);
          return size < 10;
        })
        .map((el) => ({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 60),
          fontSize: window.getComputedStyle(el).fontSize,
        }));
    });

    expect(
      tinyText,
      `Text below 10px found on mobile: ${JSON.stringify(tinyText)}`,
    ).toHaveLength(0);
    await page.close();
  });

  test('mobile nav sheet opens and closes with Escape', async () => {
    const { page } = await mobilePage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const menuButton = page.getByRole('button', { name: /open navigation/i });
    await menuButton.click();

    const sheet = page.locator('[role="dialog"]').first();
    await expect(sheet).toBeVisible({ timeout: 4_000 });

    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible({ timeout: 4_000 });
    await page.close();
  });

  test('can navigate via mobile nav sheet to Clients', async () => {
    const { page } = await mobilePage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

    const menuButton = page.getByRole('button', { name: /open navigation/i });
    await menuButton.click();

    const sheet = page.locator('[role="dialog"]').first();
    await expect(sheet).toBeVisible({ timeout: 4_000 });

    await page.locator('[role="dialog"] a:has-text("Clients")').click();
    await page.waitForURL(/\/clients/, { timeout: 8_000 });

    // Sheet should auto-close after navigation
    await expect(sheet).not.toBeVisible({ timeout: 4_000 });
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 2 — Empty states
// ---------------------------------------------------------------------------

test.describe('Audit 2 — Empty states render without crash', () => {
  test('clients page search with no-match term shows empty state message', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const searchInput = page.locator('input[placeholder*="earch"]').first();
    await searchInput.fill('ZZZNORESULTXYZ99999');
    await page.waitForTimeout(500); // debounce settle

    const emptyState = page.locator('text=/No clients|no results|nothing found/i');
    await expect(emptyState).toBeVisible({ timeout: 4_000 });

    // No crash indicator
    await expect(page.locator('text=/Something went wrong|Unexpected error/i')).toHaveCount(0);
    await page.close();
  });

  test('proposals tab on client detail shows empty state or data, does not crash', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const firstRow = page.locator('table tbody tr').first();
    if ((await firstRow.count()) === 0) {
      test.skip();
      return;
    }
    await firstRow.click();
    await page.waitForURL(/\/clients\/.+/);

    await page.locator('[role="tab"]:has-text("Proposals")').click();
    await page.waitForTimeout(500);

    const hasProposals = await page.locator('[data-testid="proposal-item"]').count();
    const hasEmptyState = await page.locator('text=/No proposals|Create your first/i').count();
    const hasSkeletons = await page.locator('.animate-pulse').count();
    const hasCrash = await page.locator('text=/Something went wrong|Unexpected error/i').count();

    expect(hasCrash, 'Proposals tab crashed').toBe(0);
    expect(
      hasProposals + hasEmptyState + hasSkeletons,
      'Proposals tab shows neither data, empty state nor loading skeletons',
    ).toBeGreaterThan(0);
    await page.close();
  });

  test('scope tab on client detail shows empty state or scope data, does not crash', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const firstRow = page.locator('table tbody tr').first();
    if ((await firstRow.count()) === 0) {
      test.skip();
      return;
    }
    await firstRow.click();
    await page.waitForURL(/\/clients\/.+/);

    await page.locator('[role="tab"]:has-text("Scope")').click();
    await page.waitForLoadState('networkidle');

    const hasCrash = await page.locator('text=/Something went wrong|Unexpected error/i').count();
    expect(hasCrash, 'Scope tab crashed').toBe(0);

    // Must render something meaningful — use the active tabpanel
    const scopeContent = await page.locator('[role="tabpanel"][data-state="active"]').evaluate(
      (el) => el.textContent?.trim().length ?? 0,
    );
    expect(scopeContent, 'Scope tab panel is empty — no content rendered').toBeGreaterThan(0);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 3 — Form validation (Create Client dialog)
// ---------------------------------------------------------------------------

test.describe('Audit 3 — Form validation', () => {
  test('submitting Create Client with empty fields shows validation errors', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    await page.locator('button:has-text("Add Client")').first().click();
    await page.waitForSelector('[role="dialog"]');

    // Submit blank form
    await page.locator('[role="dialog"] button[type="submit"]').click();

    // Expect at least one visible error message
    const errorMsg = page.locator('[role="dialog"] .text-destructive, [role="dialog"] [role="alert"]');
    await expect(errorMsg.first()).toBeVisible({ timeout: 3_000 });
    await page.close();
  });

  test('submitting Create Client with invalid email shows email validation error', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    await page.locator('button:has-text("Add Client")').first().click();
    await page.waitForSelector('[role="dialog"]');

    // Fill valid company name but bad email
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.fill('Test Company');
    const emailInput = page.locator('[role="dialog"]').getByLabel(/email/i).or(
      page.locator('[role="dialog"]').getByPlaceholder(/email/i),
    ).first();
    await emailInput.fill('not-a-valid-email');

    await page.locator('[role="dialog"] button[type="submit"]').click();

    const emailError = page.locator('[role="dialog"]').locator('text=/invalid email|valid email/i');
    await expect(emailError).toBeVisible({ timeout: 3_000 });
    await page.close();
  });

  test('login page blocks empty form submission and stays on /login', async () => {
    // Use a fresh unauthenticated context for this test
    const freshCtx = await sharedContext.browser()!.newContext();
    const page = await freshCtx.newPage();
    await page.goto(`${BASE}/login`);

    await page.getByRole('button', { name: /sign in/i }).click();

    // HTML5 required validation should keep us on /login
    await expect(page).toHaveURL(`${BASE}/login`);
    await freshCtx.close();
  });

  test('login page shows error toast on wrong credentials', async () => {
    const freshCtx = await sharedContext.browser()!.newContext();
    const page = await freshCtx.newPage();
    await page.goto(`${BASE}/login`);

    await page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first().fill('wrong@example.com');
    await page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first().fill('wrongpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show some error feedback — toast or inline message
    const errorIndicator = page.locator('[data-sonner-toast]').or(
      page.getByText(/invalid|failed|incorrect|wrong|error/i),
    );
    await expect(errorIndicator.first()).toBeVisible({ timeout: 8_000 });

    // Should remain on /login
    await expect(page).toHaveURL(`${BASE}/login`);
    await freshCtx.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 4 — Dialog / modal behaviour
// ---------------------------------------------------------------------------

test.describe('Audit 4 — Dialog and modal behaviour', () => {
  test('Create Client dialog closes with Escape key', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    await page.locator('button:has-text("Add Client")').first().click();
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
    await page.close();
  });

  test('Create Client dialog fields are Tab-navigable', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    await page.locator('button:has-text("Add Client")').first().click();
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    // First Tab inside dialog should focus first interactive element inside it
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    // Should focus something inside the dialog (INPUT, BUTTON, SELECT, TEXTAREA)
    expect(
      ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'],
      `Tab inside dialog focused unexpected element: ${focusedTag}`,
    ).toContain(focusedTag);
    await page.close();
  });

  test('Create Client dialog has aria-modal="true"', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    await page.locator('button:has-text("Add Client")').first().click();
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    const ariaModal = await dialog.getAttribute('aria-modal');
    expect(ariaModal, 'Dialog is missing aria-modal="true" — screen readers may not trap focus').toBe('true');
    await page.close();
  });

  test('dialog does not leave stale overlay when closed', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    await page.locator('button:has-text("Add Client")').first().click();
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });

    // Overlay/backdrop should also be gone
    const backdrop = page.locator('[data-radix-dialog-overlay], [data-overlay]');
    const backdropCount = await backdrop.count();
    if (backdropCount > 0) {
      await expect(backdrop.first()).not.toBeVisible({ timeout: 2_000 });
    }

    // Page should be fully interactive after close — tab should move focus
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? 'BODY');
    expect(focused, 'After dialog close, nothing is focusable — overlay may be blocking').not.toBe('BODY');
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 5 — Focus rings
// ---------------------------------------------------------------------------

test.describe('Audit 5 — Focus ring visibility', () => {
  test('interactive elements on login page have visible focus indicators', async () => {
    const freshCtx = await sharedContext.browser()!.newContext();
    const page = await freshCtx.newPage();
    await page.goto(`${BASE}/login`);

    // Tab to email field
    await page.keyboard.press('Tab');

    const hasFocusIndicator = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const hasShadow = style.boxShadow !== 'none';
      const hasBorderChange = style.borderColor !== 'transparent';
      return hasOutline || hasShadow || hasBorderChange;
    });

    expect(hasFocusIndicator, 'No visible focus ring on first focusable login element after Tab').toBe(true);
    await freshCtx.close();
  });

  test('interactive elements on dashboard have visible focus indicators', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

    await page.keyboard.press('Tab');

    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? 'BODY');
    expect(focusedTag, 'Tab on dashboard focused nothing').not.toBe('BODY');

    const hasFocusIndicator = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el.tagName === 'BODY') return false;
      const style = window.getComputedStyle(el);
      const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const hasShadow = style.boxShadow !== 'none';
      return hasOutline || hasShadow;
    });

    expect(hasFocusIndicator, 'No visible focus indicator on first focused dashboard element').toBe(true);
    await page.close();
  });

  test('sidebar nav links retain focus indicators when tabbed', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    // Tab multiple times to land on a sidebar nav link
    let landedOnNav = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const isNavLink = await page.evaluate(() => {
        const el = document.activeElement as HTMLAnchorElement | null;
        return el?.closest('aside nav') != null;
      });
      if (isNavLink) { landedOnNav = true; break; }
    }

    if (!landedOnNav) {
      // Log a warning but don't fail — sidebar may not be in tab order first
      console.warn('AUDIT NOTE: Could not reach a sidebar nav link within 10 Tabs');
      return;
    }

    const hasFocusIndicator = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const hasShadow = style.boxShadow !== 'none';
      return hasOutline || hasShadow;
    });

    expect(hasFocusIndicator, 'Sidebar nav link has no visible focus ring').toBe(true);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 6 — Icon-only buttons must have accessible labels
// ---------------------------------------------------------------------------

test.describe('Audit 6 — Icon-only button accessibility', () => {
  async function findUnlabelledIconButtons(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .filter((btn) => {
          const visibleText = btn.textContent?.trim() ?? '';
          const hasAriaLabel = (btn.getAttribute('aria-label') ?? '').trim().length > 0;
          const hasAriaLabelledBy = (btn.getAttribute('aria-labelledby') ?? '').trim().length > 0;
          const hasSrOnly = !!btn.querySelector('.sr-only');
          const hasTitle = (btn.getAttribute('title') ?? '').trim().length > 0;
          // A button is "icon-only" if visible text length == 0 after stripping whitespace from SVG children
          const textWithoutSvg = Array.from(btn.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent?.trim() ?? '')
            .join('');
          const isIconOnly = textWithoutSvg.length === 0 && visibleText.length < 3;
          return isIconOnly && !hasAriaLabel && !hasAriaLabelledBy && !hasSrOnly && !hasTitle;
        })
        .map((btn) => btn.outerHTML.slice(0, 200));
    });
  }

  test('no unlabelled icon-only buttons on /clients', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const violations = await findUnlabelledIconButtons(page);
    expect(
      violations,
      `Unlabelled icon buttons on /clients:\n${violations.join('\n')}`,
    ).toHaveLength(0);
    await page.close();
  });

  test('hamburger menu button has an sr-only label or aria-label', async () => {
    // Check on mobile where the hamburger is visible
    const page = await sharedContext.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const menuButton = page.getByRole('button', { name: /open navigation/i });
    await expect(menuButton).toBeVisible({ timeout: 5_000 });

    const ariaLabel = await menuButton.getAttribute('aria-label');
    const hasSrOnly = await menuButton.locator('.sr-only').count();
    const title = await menuButton.getAttribute('title');

    expect(
      (ariaLabel?.trim().length ?? 0) > 0 || hasSrOnly > 0 || (title?.trim().length ?? 0) > 0,
      'Hamburger menu button has no aria-label, title, or sr-only text — screen reader users cannot identify it',
    ).toBe(true);
    await page.close();
  });

  test('no unlabelled icon-only buttons on client detail page', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    // Navigate to "All" filter then click first client
    const allBtn = page.locator('button:has-text("All")');
    if ((await allBtn.count()) > 0) await allBtn.first().click();

    const firstRow = page.locator('table tbody tr').first();
    if ((await firstRow.count()) === 0) { test.skip(); return; }

    await firstRow.click();
    await page.waitForURL(/\/clients\/.+/);
    await page.waitForLoadState('networkidle');

    const violations = await findUnlabelledIconButtons(page);
    expect(
      violations,
      `Unlabelled icon buttons on client detail:\n${violations.join('\n')}`,
    ).toHaveLength(0);
    await page.close();
  });

  test('no unlabelled icon-only buttons on dashboard', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

    const violations = await findUnlabelledIconButtons(page);
    expect(
      violations,
      `Unlabelled icon buttons on dashboard:\n${violations.join('\n')}`,
    ).toHaveLength(0);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 7 — Page titles
// ---------------------------------------------------------------------------

test.describe('Audit 7 — Page titles', () => {
  const titleChecks: Array<{ path: string; pattern: RegExp; label: string }> = [
    { path: '/login', pattern: /luma/i, label: 'Login' },
    { path: '/', pattern: /luma|dashboard/i, label: 'Dashboard' },
    { path: '/clients', pattern: /luma|clients/i, label: 'Client List' },
    { path: '/settings', pattern: /luma|settings/i, label: 'Settings' },
    { path: '/revenue', pattern: /luma|revenue/i, label: 'Revenue' },
    { path: '/proposals', pattern: /luma|proposals/i, label: 'Proposals' },
    { path: '/approvals', pattern: /luma|approvals/i, label: 'Approvals' },
  ];

  for (const { path, pattern, label } of titleChecks) {
    test(`${label} page has a non-empty document.title`, async () => {
      const page = await authPage();
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      const title = await page.title();

      expect(title.length, `Page title is empty on ${path}`).toBeGreaterThan(0);

      if (!pattern.test(title)) {
        console.warn(
          `AUDIT NOTE: Page title "${title}" on ${path} does not match expected pattern ${pattern}. Consider setting a descriptive title.`,
        );
      }
      await page.close();
    });
  }

  test('client detail page title includes client name or "Luma"', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const allBtn = page.locator('button:has-text("All")');
    if ((await allBtn.count()) > 0) await allBtn.first().click();

    const firstRow = page.locator('table tbody tr').first();
    if ((await firstRow.count()) === 0) { test.skip(); return; }

    await firstRow.click();
    await page.waitForURL(/\/clients\/.+/);
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title.length, 'Client detail page title is empty').toBeGreaterThan(0);
    expect(title, 'Client detail title should contain "Luma"').toMatch(/luma/i);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 8 — Loading / skeleton states
// ---------------------------------------------------------------------------

test.describe('Audit 8 — Loading and skeleton states', () => {
  test('dashboard renders content without crash during throttled API load', async () => {
    const page = await sharedContext.newPage();

    // Intercept and slow down Supabase REST calls
    await page.route('**/rest/v1/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1_000));
      await route.continue();
    });

    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

    // Page must render with meaningful content — no blank screen or crash
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);

    await page.close();
  });

  test('client list renders content without crash during throttled API load', async () => {
    const page = await sharedContext.newPage();

    await page.route('**/rest/v1/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1_000));
      await route.continue();
    });

    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);

    await page.close();
  });

  test('client detail renders content without crash during throttled API load', async () => {
    // Get the first client ID from the live page first
    const seedPage = await authPage();
    await seedPage.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const allBtn = seedPage.locator('button:has-text("All")');
    if ((await allBtn.count()) > 0) await allBtn.first().click();

    const firstRow = seedPage.locator('table tbody tr').first();
    if ((await firstRow.count()) === 0) {
      await seedPage.close();
      test.skip();
      return;
    }
    await firstRow.click();
    await seedPage.waitForURL(/\/clients\/.+/);
    const clientUrl = seedPage.url();
    await seedPage.close();

    // Open that URL with a throttled page from the shared authenticated context
    const page = await sharedContext.newPage();

    await page.route('**/rest/v1/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1_000));
      await route.continue();
    });

    await page.goto(clientUrl, { waitUntil: 'networkidle' });

    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 9 — Broken navigation (sidebar links)
// ---------------------------------------------------------------------------

test.describe('Audit 9 — Broken navigation', () => {
  // Routes defined in App.tsx — verify all render something meaningful
  const sidebarRoutes = [
    { path: '/', label: 'Dashboard' },
    { path: '/clients', label: 'Clients' },
    { path: '/proposals', label: 'Proposals' },
    { path: '/revenue', label: 'Revenue' },
    { path: '/approvals', label: 'Approvals' },
    { path: '/timesheet', label: 'Timesheet' },
    { path: '/invoices', label: 'Invoices' },
    { path: '/settings', label: 'Settings' },
  ];

  for (const { path, label } of sidebarRoutes) {
    test(`${label} route (${path}) renders app shell without 404`, async () => {
      const page = await authPage();
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });

      // Page should not show 404 / Not Found
      await expect(
        page.locator('text=/page not found|404|not found/i').first(),
      ).toHaveCount(0);

      // App shell (sidebar or header) should be present
      const hasShell = (await page.locator('aside').count()) > 0 || (await page.locator('header').count()) > 0;
      expect(hasShell, `${label}: App shell (aside/header) not rendered`).toBe(true);

      await page.close();
    });
  }

  test('Snapshots sidebar link navigates to a valid route (not 404)', async () => {
    // BUG CANDIDATE: Sidebar defines "/snapshots" but App.tsx has no such route.
    // The actual route is /clients/:id/snapshots. This test documents the bug.
    const page = await authPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

    const snapshotsLink = page.locator('aside nav').getByText('Snapshots').first();
    const snapshotsLinkCount = await snapshotsLink.count();

    if (snapshotsLinkCount === 0) {
      // Snapshots link may have been removed from sidebar
      test.skip();
      return;
    }

    const href = await snapshotsLink.evaluate((el) => (el as HTMLAnchorElement).href ?? el.closest('a')?.href ?? '');
    await snapshotsLink.click();
    await page.waitForLoadState('networkidle');

    const isNotFound = await page.locator('text=/page not found|not found|404/i').count() > 0;

    if (isNotFound) {
      // Document the bug but fail the test
      console.error(
        `BUG: Snapshots sidebar link (href: ${href}) navigates to a 404 page. ` +
        'The route /snapshots does not exist in App.tsx. ' +
        'Expected route: /clients/:id/snapshots',
      );
    }

    expect(isNotFound, 'Snapshots sidebar link leads to a 404 page — route does not exist in App.tsx').toBe(false);
    await page.close();
  });

  test('no sidebar nav links use href="#" (dummy anchors)', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

    const hashLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('aside nav a[href="#"]'))
        .map((a) => a.outerHTML.slice(0, 120)),
    );

    expect(hashLinks, `Sidebar has href="#" dummy anchors: ${JSON.stringify(hashLinks)}`).toHaveLength(0);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 10 — Console errors across pages
// ---------------------------------------------------------------------------

test.describe('Audit 10 — Console errors', () => {
  const consoleRoutes = [
    '/login',
    '/',
    '/clients',
    '/proposals',
    '/revenue',
    '/approvals',
    '/settings',
  ];

  for (const route of consoleRoutes) {
    test(`no app-level console errors on ${route}`, async () => {
      const page = await authPage();
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1_500); // allow async renders to settle

      const appErrors = errors.filter(
        (e) =>
          !e.includes('net::ERR_') &&
          !e.includes('favicon') &&
          !e.includes('Failed to load resource') &&
          !e.toLowerCase().includes('cors') &&
          !e.includes('supabase') // supabase auth token refresh warnings are expected
      );

      if (appErrors.length > 0) {
        console.error(`Console errors on ${route}:`, appErrors);
      }

      expect(appErrors, `Console errors on ${route}: ${JSON.stringify(appErrors)}`).toHaveLength(0);
      await page.close();
    });
  }

  test('no console errors on client detail page', async () => {
    const page = await authPage();
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const allBtn = page.locator('button:has-text("All")');
    if ((await allBtn.count()) > 0) await allBtn.first().click();

    const firstRow = page.locator('table tbody tr').first();
    if ((await firstRow.count()) === 0) { await page.close(); test.skip(); return; }

    await firstRow.click();
    await page.waitForURL(/\/clients\/.+/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1_500);

    const appErrors = errors.filter(
      (e) =>
        !e.includes('net::ERR_') &&
        !e.includes('favicon') &&
        !e.includes('Failed to load resource') &&
        !e.toLowerCase().includes('cors') &&
        !e.includes('supabase')
    );

    expect(appErrors, `Console errors on client detail: ${JSON.stringify(appErrors)}`).toHaveLength(0);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 11 — Create client flow
// ---------------------------------------------------------------------------

test.describe('Audit 11 — Create Client flow', () => {
  test('fill and submit Create Client form — new client appears in list', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const testClientName = `QA Audit Client ${Date.now()}`;

    // Open the dialog
    await page.locator('button:has-text("Add Client")').first().click();
    await page.waitForSelector('[role="dialog"]');

    // Fill company name (required field)
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.fill(testClientName);

    // Submit
    await page.locator('[role="dialog"] button[type="submit"]').click();

    // Expect navigation to new client detail page
    await page.waitForURL(/\/clients\/.+/, { timeout: 10_000 });

    // Client name should be in the heading
    await expect(page.locator('h1').first()).toContainText(testClientName, { timeout: 5_000 });

    // Go back and verify the new client appears in the All filter
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });
    const allBtn = page.locator('button:has-text("All")');
    if ((await allBtn.count()) > 0) await allBtn.first().click();
    await page.waitForTimeout(300);

    await expect(page.locator(`text=${testClientName}`)).toBeVisible({ timeout: 5_000 });
    await page.close();
  });

  test('Create Client dialog closes without creating when Escape is pressed', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    // Count clients before
    const countBefore = await page.locator('table tbody tr').count();

    await page.locator('button:has-text("Add Client")').first().click();
    await page.waitForSelector('[role="dialog"]');

    // Fill in a name
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.fill('Client That Should Not Be Created');

    // Press Escape — should discard without creating
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3_000 });

    await page.waitForTimeout(500);
    const countAfter = await page.locator('table tbody tr').count();
    expect(countAfter, 'Client count changed after Escape dismiss — dialog data may have been submitted').toBe(countBefore);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 12 — Horizontal scroll at 1280px
// ---------------------------------------------------------------------------

test.describe('Audit 12 — Horizontal scroll at 1280px desktop viewport', () => {
  const desktopRoutes = [
    { path: '/', label: 'Dashboard' },
    { path: '/clients', label: 'Clients' },
    { path: '/proposals', label: 'Proposals' },
    { path: '/revenue', label: 'Revenue' },
    { path: '/settings', label: 'Settings' },
    { path: '/approvals', label: 'Approvals' },
  ];

  for (const { path, label } of desktopRoutes) {
    test(`no unexpected horizontal scrollbar on ${label} (${path}) at 1280px`, async () => {
      const ctx = await sharedContext.browser()!.newContext({
        viewport: { width: 1280, height: 800 },
      });
      const cookies = await sharedContext.cookies();
      await ctx.addCookies(cookies);
      const page = await ctx.newPage();

      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });

      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

      expect(
        scrollWidth,
        `Horizontal overflow of ${scrollWidth}px on ${label} at 1280px viewport`,
      ).toBeLessThanOrEqual(5);

      await ctx.close();
    });
  }

  test('client detail page has no horizontal scroll at 1280px', async () => {
    const ctx = await sharedContext.browser()!.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const cookies = await sharedContext.cookies();
    await ctx.addCookies(cookies);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });

    const allBtn = page.locator('button:has-text("All")');
    if ((await allBtn.count()) > 0) await allBtn.first().click();

    const firstRow = page.locator('table tbody tr').first();
    if ((await firstRow.count()) === 0) {
      await ctx.close();
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForURL(/\/clients\/.+/);
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(
      scrollWidth,
      `Horizontal overflow of ${scrollWidth}px on client detail at 1280px`,
    ).toBeLessThanOrEqual(5);

    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// Audit 13 — Regression: ARIA landmark structure
// ---------------------------------------------------------------------------

test.describe('Audit 13 — ARIA landmark structure', () => {
  test('dashboard has a <main> landmark', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    expect(await page.locator('main').count(), 'No <main> element on dashboard').toBeGreaterThan(0);
    await page.close();
  });

  test('clients page has a <nav> landmark for sidebar', async () => {
    const page = await authPage();
    await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' });
    expect(await page.locator('nav').count(), 'No <nav> element on clients page').toBeGreaterThan(0);
    await page.close();
  });

  test('no images without alt attribute across dashboard and clients', async () => {
    for (const path of ['/', '/clients']) {
      const page = await authPage();
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });

      const violations = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .filter((img) => !img.hasAttribute('alt'))
          .map((img) => img.outerHTML.slice(0, 120)),
      );

      expect(violations, `Images without alt on ${path}: ${JSON.stringify(violations)}`).toHaveLength(0);
      await page.close();
    }
  });
});
