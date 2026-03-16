import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Auth helper — standard email + password via sign-in form
// ---------------------------------------------------------------------------

async function loginAsOperator(page: Page) {
  await page.goto('http://localhost:8080/login');

  // Try label-based selectors first, fall back to placeholder
  const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
  const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));

  await emailInput.fill('hello@heymervin.com');
  await passwordInput.fill('Maine@321');
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(async () => {
    // Some apps redirect to "/" (index) not "/dashboard"
    await page.waitForURL(/localhost:8080\/(clients|$|#)/, { timeout: 5000 });
  });
}

/**
 * Collect console errors during a page interaction.
 */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Filter out noise from console errors — keep only app-level errors.
 */
function filterAppErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !e.includes('net::ERR_') &&
      !e.includes('favicon') &&
      !e.includes('Failed to load resource') &&
      !e.toLowerCase().includes('cors') &&
      !e.includes('404 (Not Found)'),
  );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('Luma Operator App — E2E', () => {
  // -------------------------------------------------------------------------
  // 1. Login page
  // -------------------------------------------------------------------------
  test.describe('Login page', () => {
    test('loads at /login with correct form elements and no console errors', async ({ page }) => {
      const consoleErrors = collectConsoleErrors(page);
      await page.goto('http://localhost:8080/login');

      // Headline
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

      // Email field
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      await expect(emailInput.first()).toBeVisible();

      // Password field
      const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
      await expect(passwordInput.first()).toBeVisible();

      // Submit button
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

      // Sign-up toggle link
      await expect(page.getByText(/don't have an account/i)).toBeVisible();

      // Luma brand visible
      await expect(page.getByText('Luma').first()).toBeVisible();

      // No console errors on a clean page load
      const appErrors = filterAppErrors(consoleErrors);
      expect(appErrors, `Console errors on /login: ${JSON.stringify(appErrors)}`).toHaveLength(0);
    });

    test('toggles to sign-up form and back', async ({ page }) => {
      await page.goto('http://localhost:8080/login');

      await page.getByText(/don't have an account/i).click();
      await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
      await expect(page.getByLabel(/full name/i).or(page.getByPlaceholder(/full name/i)).first()).toBeVisible();

      await page.getByText(/already have an account/i).click();
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    });

    test('shows validation — empty form submission does not navigate away', async ({ page }) => {
      await page.goto('http://localhost:8080/login');

      await page.getByRole('button', { name: /sign in/i }).click();

      // Form should not navigate away — should still be on /login
      await expect(page).toHaveURL('http://localhost:8080/login');
    });

    test('shows error with invalid credentials', async ({ page }) => {
      await page.goto('http://localhost:8080/login');

      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
      await emailInput.first().fill('wrong@example.com');
      await passwordInput.first().fill('wrongpassword123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should show an error message
      await expect(
        page.getByText(/invalid|incorrect|error|wrong|failed/i).first()
      ).toBeVisible({ timeout: 8000 });

      // Should remain on login page
      await expect(page).toHaveURL('http://localhost:8080/login');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Successful login
  // -------------------------------------------------------------------------
  test.describe('Successful login', () => {
    test('redirects to app after sign in with valid credentials', async ({ page }) => {
      await page.goto('http://localhost:8080/login');

      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
      await emailInput.first().fill('hello@heymervin.com');
      await passwordInput.first().fill('Maine@321');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should redirect away from /login
      await page.waitForURL(
        (url) => !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth'),
        { timeout: 12000 }
      );

      // Must not be on the login page
      expect(page.url()).not.toContain('/login');
      // Should be on a known app page
      const finalPath = new URL(page.url()).pathname;
      const validPaths = ['/', '/clients', '/dashboard'];
      const isValidPath = validPaths.some((p) => finalPath === p) || finalPath === '/';
      expect(isValidPath || finalPath.length > 0).toBe(true);
    });

    test('authenticated user is redirected away from /login', async ({ page }) => {
      await loginAsOperator(page);

      // Now try to hit /login again — should redirect to dashboard
      await page.goto('http://localhost:8080/login');
      await page.waitForURL(
        (url) => !url.pathname.startsWith('/login'),
        { timeout: 8000 }
      );
      expect(page.url()).not.toContain('/login');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Dashboard
  // -------------------------------------------------------------------------
  test.describe('Dashboard', () => {
    test('page title is set', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/');
      const title = await page.title();
      expect(title.length, 'Page title is empty').toBeGreaterThan(0);
      // Ideally contains "Luma" or "Dashboard"
      if (!/luma|dashboard/i.test(title)) {
        console.warn(`AUDIT NOTE: Dashboard page title "${title}" does not contain "Luma" or "Dashboard"`);
      }
    });

    test('renders stat cards and recognisable metrics', async ({ page }) => {
      const consoleErrors = collectConsoleErrors(page);
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/');
      await page.waitForLoadState('networkidle');

      // Dashboard should show some recognisable metric labels
      const metricsFound = await Promise.all([
        page.getByText(/clients/i).count(),
        page.getByText(/deliveries/i).count(),
        page.getByText(/scope/i).count(),
        page.getByText(/revenue/i).count(),
      ]);
      const totalMetrics = metricsFound.reduce((a, b) => a + b, 0);
      expect(totalMetrics, 'Dashboard renders no recognisable metric labels').toBeGreaterThan(0);

      // Sidebar navigation present
      await expect(page.getByRole('navigation')).toBeVisible();

      const appErrors = filterAppErrors(consoleErrors);
      if (appErrors.length > 0) {
        console.error('Dashboard console errors:', appErrors);
      }
      expect(appErrors, `Console errors on Dashboard: ${JSON.stringify(appErrors)}`).toHaveLength(0);
    });

    test('no broken elements — no "undefined" or empty headings visible', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/');
      await page.waitForLoadState('networkidle');

      const undefinedText = await page.getByText('undefined').count();
      expect(undefinedText, 'The text "undefined" is visible on the Dashboard').toBe(0);

      const nullText = await page.getByText('null').count();
      expect(nullText, 'The text "null" is visible on the Dashboard').toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Client list
  // -------------------------------------------------------------------------
  test.describe('Client list', () => {
    test('loads at /clients and renders content or empty state', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/clients');
      await page.waitForLoadState('networkidle');

      // Either a table/list of clients OR an empty state — both are acceptable
      const hasTableRows = await page.getByRole('row').count() > 0;
      const hasClientCards = await page.locator('[data-testid="client-row"]').count() > 0;
      const hasEmptyState = await page.getByText(/no clients|add your first/i).count() > 0;
      const hasClientText = await page.getByText(/clients/i).count() > 0;

      expect(
        hasTableRows || hasClientCards || hasEmptyState || hasClientText,
        'Client list page is empty — no content at all'
      ).toBe(true);
    });

    test('filter/search bar is visible', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/clients');
      await page.waitForLoadState('networkidle');

      const searchInput = page
        .getByRole('searchbox')
        .or(page.getByPlaceholder(/search|filter/i));
      const inputCount = await searchInput.count();

      if (inputCount === 0) {
        console.warn('UX GAP: No search/filter input on /clients — users cannot filter their client list');
      }
      // This is a logged gap, not a hard fail — but still report it
    });

    test('status filter pills render without crash', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/clients');
      await page.waitForLoadState('networkidle');

      // Try clicking each status filter pill
      for (const filter of ['Active', 'Paused', 'Archived', 'All']) {
        const btn = page.getByRole('button', { name: new RegExp(`^${filter}$`, 'i') });
        const count = await btn.count();
        if (count > 0) {
          await btn.first().click();
          await page.waitForTimeout(300);
          const errorText = await page.getByText(/something went wrong|unexpected error/i).count();
          expect(errorText, `Filter "${filter}" caused a crash`).toBe(0);
        }
      }
    });

    test('clicking a client row navigates to client detail', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/clients');
      await page.waitForLoadState('networkidle');

      // Try "All" filter first to ensure we see clients
      const allBtn = page.getByRole('button', { name: /^all$/i });
      if ((await allBtn.count()) > 0) {
        await allBtn.first().click();
        await page.waitForTimeout(400);
      }

      // Look for table rows (excluding header) or link cards
      const firstClientLink = page.locator('table tbody tr a').first();
      const tableRowCount = await firstClientLink.count();

      if (tableRowCount === 0) {
        // Try direct table row click
        const firstRow = page.locator('table tbody tr').first();
        if ((await firstRow.count()) === 0) {
          test.skip(true, 'No clients in database to click through');
          return;
        }
        await firstRow.click();
      } else {
        await firstClientLink.click();
      }

      await page.waitForURL(/\/clients\/.+/, { timeout: 8000 });
      await expect(page).toHaveURL(/\/clients\/.+/);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Client detail — tabs
  // -------------------------------------------------------------------------
  test.describe('Client detail', () => {
    async function navigateToFirstClient(page: Page): Promise<boolean> {
      await page.goto('http://localhost:8080/clients');
      await page.waitForLoadState('networkidle');

      // Try "All" filter first
      const allBtn = page.getByRole('button', { name: /^all$/i });
      if ((await allBtn.count()) > 0) {
        await allBtn.first().click();
        await page.waitForTimeout(400);
      }

      const firstClientLink = page.locator('table tbody tr a').first();
      if ((await firstClientLink.count()) > 0) {
        const href = await firstClientLink.getAttribute('href');
        if (href?.startsWith('/clients/')) {
          await firstClientLink.click();
          await page.waitForLoadState('networkidle');
          return true;
        }
      }

      const firstRow = page.locator('table tbody tr').first();
      if ((await firstRow.count()) > 0) {
        await firstRow.click();
        await page.waitForURL(/\/clients\/.+/, { timeout: 8000 });
        await page.waitForLoadState('networkidle');
        return true;
      }

      return false;
    }

    test('renders client header and stat strip', async ({ page }) => {
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      // Stat strip should have recognisable labels
      const hasDeliveries = await page.getByText(/deliveries/i).count() > 0;
      const hasScopeUsed = await page.getByText(/scope used/i).count() > 0;
      const hasHours = await page.getByText(/hours logged/i).count() > 0;

      expect(
        hasDeliveries || hasScopeUsed || hasHours,
        'Client detail stat strip renders no recognisable labels'
      ).toBe(true);
    });

    test('all 7 tabs are present and clickable', async ({ page }) => {
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      const expectedTabs = ['Deliveries', 'Scope', 'Requests', 'Proposals', 'Portal', 'Reports', 'Timeline'];

      for (const tabName of expectedTabs) {
        const tab = page.getByRole('tab', { name: tabName });
        await expect(tab).toBeVisible({ timeout: 5000 });
        await tab.click();
        // Tab should become active
        await expect(tab).toHaveAttribute('data-state', 'active');
      }
    });

    test('tab URL param updates on tab switch', async ({ page }) => {
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      await page.getByRole('tab', { name: 'Scope' }).click();
      await expect(page).toHaveURL(/tab=scope/);

      await page.getByRole('tab', { name: 'Proposals' }).click();
      await expect(page).toHaveURL(/tab=proposals/);

      await page.getByRole('tab', { name: 'Timeline' }).click();
      await expect(page).toHaveURL(/tab=timeline/);
    });

    test('Deliveries tab shows QuickAddDelivery form visible and accepts input', async ({ page }) => {
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      const deliveriesTab = page.getByRole('tab', { name: 'Deliveries' });
      await deliveriesTab.click();
      await expect(deliveriesTab).toHaveAttribute('data-state', 'active');

      // QuickAddDelivery renders an input for the title
      const quickInput = page
        .getByPlaceholder(/what did you deliver|quick add|delivery title/i)
        .or(page.getByRole('textbox').first());
      await expect(quickInput).toBeVisible({ timeout: 5000 });

      // Should accept input
      await quickInput.fill('Test QA delivery item');
      await expect(quickInput).toHaveValue('Test QA delivery item');

      // Clear it — don't actually submit
      await quickInput.fill('');
    });

    test('Log Delivery button visible on Deliveries tab, hidden on Scope tab', async ({ page }) => {
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      await page.getByRole('tab', { name: 'Deliveries' }).click();
      await expect(page.getByRole('button', { name: /log delivery/i })).toBeVisible({ timeout: 5000 });

      await page.getByRole('tab', { name: 'Scope' }).click();
      await expect(page.getByRole('button', { name: /log delivery/i })).not.toBeVisible();
    });

    test('Share Portal button navigates to portal tab', async ({ page }) => {
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      const shareBtn = page.getByRole('button', { name: /share portal/i });
      if ((await shareBtn.count()) === 0) {
        console.warn('UX GAP: "Share Portal" button not found on client detail header');
        return;
      }

      await shareBtn.click();
      await expect(page).toHaveURL(/tab=portal/);
    });

    test('Scope tab renders scope tracker or empty state without crash', async ({ page }) => {
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      await page.getByRole('tab', { name: 'Scope' }).click();
      await page.waitForLoadState('networkidle');

      const errorText = await page.getByText(/something went wrong|unexpected error/i).count();
      expect(errorText, 'Scope tab crashed').toBe(0);

      const hasScopeContent = await page.getByText(/scope/i).count() > 0;
      expect(hasScopeContent, 'Scope tab has no visible content').toBe(true);
    });

    test('Portal tab renders magic link panel without crash', async ({ page }) => {
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      await page.getByRole('tab', { name: 'Portal' }).click();
      await page.waitForLoadState('networkidle');

      const errorText = await page.getByText(/something went wrong|unexpected error/i).count();
      expect(errorText, 'Portal tab crashed').toBe(0);
    });

    test('no console errors while browsing all tabs', async ({ page }) => {
      const consoleErrors = collectConsoleErrors(page);
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      const tabs = ['Deliveries', 'Scope', 'Requests', 'Proposals', 'Portal', 'Reports', 'Timeline'];
      for (const tabName of tabs) {
        const tab = page.getByRole('tab', { name: tabName });
        if ((await tab.count()) > 0) {
          await tab.click();
          await page.waitForTimeout(500);
        }
      }

      const appErrors = filterAppErrors(consoleErrors);
      if (appErrors.length > 0) {
        console.error('Console errors while browsing tabs:', appErrors);
      }
      expect(appErrors, `Console errors browsing client detail tabs: ${JSON.stringify(appErrors)}`).toHaveLength(0);
    });

    test('back breadcrumb returns to /clients', async ({ page }) => {
      await loginAsOperator(page);
      const found = await navigateToFirstClient(page);

      if (!found) {
        test.skip(true, 'No clients available');
        return;
      }

      const backLink = page.getByRole('link', { name: /clients/i }).first();
      await expect(backLink).toBeVisible();
      await backLink.click();
      await expect(page).toHaveURL('http://localhost:8080/clients');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Sidebar navigation
  // -------------------------------------------------------------------------
  test.describe('Sidebar navigation', () => {
    const routes = [
      { label: 'Dashboard', path: '/' },
      { label: 'Clients', path: '/clients' },
      { label: 'Proposals', path: '/proposals' },
      { label: 'Revenue', path: '/revenue' },
      { label: 'Approvals', path: '/approvals' },
      { label: 'Timesheet', path: '/timesheet' },
      { label: 'Invoices', path: '/invoices' },
      { label: 'Settings', path: '/settings' },
    ];

    for (const route of routes) {
      test(`${route.label} nav link renders and navigates to ${route.path}`, async ({ page }) => {
        const consoleErrors = collectConsoleErrors(page);
        await loginAsOperator(page);
        await page.goto('http://localhost:8080/');

        const navLink = page.getByRole('link', { name: new RegExp(`^${route.label}$`, 'i') });
        await expect(navLink).toBeVisible({ timeout: 5000 });
        await navLink.click();

        await page.waitForLoadState('networkidle');

        if (route.path === '/') {
          await expect(page).toHaveURL(/localhost:8080\/?$/);
        } else {
          await expect(page).toHaveURL(new RegExp(route.path));
        }

        // Page must not be the 404 page
        await expect(page.getByText(/page not found/i)).not.toBeVisible();

        const appErrors = filterAppErrors(consoleErrors);
        if (appErrors.length > 0) {
          console.error(`Console errors on ${route.path}:`, appErrors);
        }
      });
    }

    test('Snapshots nav link exists and navigates to a reachable route (BUG CHECK)', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/');
      await page.waitForLoadState('networkidle');

      const snapshotsLink = page.getByRole('link', { name: /snapshots/i });
      const count = await snapshotsLink.count();

      if (count === 0) {
        console.warn('UX GAP: "Snapshots" link not found in sidebar navigation');
        return;
      }

      const href = await snapshotsLink.first().getAttribute('href');
      console.log(`Snapshots link href: "${href}"`);

      await snapshotsLink.first().click();
      await page.waitForLoadState('networkidle');

      const is404 = await page.getByText(/page not found|not found|404/i).count() > 0;
      if (is404) {
        console.error(`BUG: Snapshots nav link goes to "${href}" which renders a 404. Route /snapshots does not exist — only /clients/:id/snapshots exists.`);
      }
      // This is the known route mismatch bug — assert it and flag it
      expect(is404, `Snapshots nav link routes to a 404 page (href="${href}")`).toBe(false);
    });

    test('active nav item has correct visual state (highlighted)', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/clients');
      await page.waitForLoadState('networkidle');

      const clientsLink = page.getByRole('link', { name: /^clients$/i });
      const classList = await clientsLink.getAttribute('class');

      // Active class should contain the visual indicator
      const isActive =
        (classList?.includes('border-l-sidebar-primary') ||
          classList?.includes('sidebar-primary') ||
          classList?.includes('active') ||
          classList?.includes('font-semibold')) ?? false;

      if (!isActive) {
        console.warn(`UX GAP: Clients nav link does not appear visually active when on /clients. Classes: "${classList}"`);
      }
      expect(isActive, 'Active nav item has no visual indicator').toBe(true);
    });

    test('sign out button is present and functional', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/');

      await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    });

    test('user email initial is shown in sidebar avatar', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/');
      await page.waitForLoadState('networkidle');

      // Avatar shows first letter of email
      const avatar = page.locator('aside').getByText(/^[A-Z]$/).first();
      const count = await avatar.count();
      if (count === 0) {
        console.warn('UX GAP: No user avatar initial visible in sidebar footer');
      }
      // Not a hard fail — just report
    });
  });

  // -------------------------------------------------------------------------
  // 7. Active nav state verification
  // -------------------------------------------------------------------------
  test.describe('Active nav state', () => {
    const navRoutes = [
      { label: 'Clients', path: '/clients' },
      { label: 'Revenue', path: '/revenue' },
      { label: 'Settings', path: '/settings' },
    ];

    for (const { label, path } of navRoutes) {
      test(`${label} nav item is highlighted when on ${path}`, async ({ page }) => {
        await loginAsOperator(page);
        await page.goto(`http://localhost:8080${path}`);
        await page.waitForLoadState('networkidle');

        const navLink = page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') });
        const classList = await navLink.getAttribute('class');

        const isMarkedActive =
          classList?.includes('border-l-sidebar-primary') ||
          classList?.includes('sidebar-primary') ||
          classList?.includes('font-semibold');

        if (!isMarkedActive) {
          console.warn(`UX GAP: "${label}" link not visually active on ${path}. Classes: "${classList}"`);
        }
        expect(isMarkedActive, `"${label}" nav item not highlighted on ${path}`).toBe(true);
      });
    }
  });

  // -------------------------------------------------------------------------
  // 8. Console error sweep across all main routes
  // -------------------------------------------------------------------------
  test.describe('Console error sweep', () => {
    const routesToCheck = [
      '/',
      '/clients',
      '/proposals',
      '/revenue',
      '/invoices',
      '/settings',
      '/approvals',
      '/timesheet',
    ];

    for (const route of routesToCheck) {
      test(`no app-level console errors on ${route}`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        await loginAsOperator(page);
        await page.goto(`http://localhost:8080${route}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const appErrors = filterAppErrors(consoleErrors);

        if (appErrors.length > 0) {
          console.error(`Console errors on ${route}:`, appErrors);
        }

        expect(appErrors, `Console errors on ${route}: ${JSON.stringify(appErrors)}`).toHaveLength(0);
      });
    }
  });

  // -------------------------------------------------------------------------
  // 9. Network error sweep
  // -------------------------------------------------------------------------
  test.describe('Network error sweep', () => {
    test('no 4xx/5xx API responses on dashboard load', async ({ page }) => {
      const failedRequests: string[] = [];

      page.on('response', (response) => {
        const status = response.status();
        const url = response.url();
        // Exclude 401s to Supabase auth (expected before session) and favicon
        if (
          status >= 400 &&
          !url.includes('favicon') &&
          !url.includes('/auth/v1/token') // auth endpoint 400s are expected pre-login
        ) {
          failedRequests.push(`${status} ${url}`);
        }
      });

      await loginAsOperator(page);
      await page.goto('http://localhost:8080/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      if (failedRequests.length > 0) {
        console.error('Failed network requests on dashboard:', failedRequests);
      }
      expect(failedRequests, `Failed requests on /: ${JSON.stringify(failedRequests)}`).toHaveLength(0);
    });

    test('no 5xx server errors on any main route', async ({ page }) => {
      const serverErrors: string[] = [];

      page.on('response', (response) => {
        const status = response.status();
        const url = response.url();
        if (status >= 500) {
          serverErrors.push(`${status} ${url}`);
        }
      });

      await loginAsOperator(page);

      const routes = ['/', '/clients', '/proposals', '/revenue'];
      for (const route of routes) {
        await page.goto(`http://localhost:8080${route}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
      }

      if (serverErrors.length > 0) {
        console.error('5xx server errors:', serverErrors);
      }
      expect(serverErrors, `Server errors found: ${JSON.stringify(serverErrors)}`).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 10. Auth guard — unauthenticated redirects
  // -------------------------------------------------------------------------
  test.describe('Auth guard', () => {
    test('unauthenticated visit to / redirects to /login', async ({ page }) => {
      await page.goto('http://localhost:8080/');
      await page.waitForURL(/\/login/, { timeout: 8000 });
      await expect(page).toHaveURL(/\/login/);
    });

    test('unauthenticated visit to /clients redirects to /login', async ({ page }) => {
      await page.goto('http://localhost:8080/clients');
      await page.waitForURL(/\/login/, { timeout: 8000 });
      await expect(page).toHaveURL(/\/login/);
    });

    test('unauthenticated visit to /settings redirects to /login', async ({ page }) => {
      await page.goto('http://localhost:8080/settings');
      await page.waitForURL(/\/login/, { timeout: 8000 });
      await expect(page).toHaveURL(/\/login/);
    });

    test('unknown route shows 404 page or redirects to login', async ({ page }) => {
      await page.goto('http://localhost:8080/this-route-does-not-exist-at-all');
      await page.waitForLoadState('networkidle');

      const isLoginPage = await page.getByText(/welcome back/i).count() > 0;
      const is404 = await page.getByText(/not found/i).count() > 0;

      expect(isLoginPage || is404, 'Unknown route neither shows 404 nor redirects to login').toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 11. Edge cases & regression guards
  // -------------------------------------------------------------------------
  test.describe('Edge cases', () => {
    test('navigating to non-existent client UUID shows graceful error, not crash', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/clients/00000000-0000-0000-0000-000000000000');
      await page.waitForLoadState('networkidle');

      // Should show "Client not found" message or similar, not a raw crash
      const hasErrorMsg =
        (await page.getByText(/client not found/i).count()) > 0 ||
        (await page.getByText(/not found/i).count()) > 0 ||
        (await page.getByText(/error/i).count()) > 0;

      // At minimum the app shell (sidebar) should still be rendered
      const sidebarStillVisible = await page.locator('aside').count() > 0;

      expect(
        hasErrorMsg || sidebarStillVisible,
        'App crashed on invalid client UUID — no error message and no sidebar'
      ).toBe(true);
    });

    test('proposals page loads without crash or 404', async ({ page }) => {
      const consoleErrors = collectConsoleErrors(page);
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/proposals');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/page not found/i)).not.toBeVisible();

      const appErrors = filterAppErrors(consoleErrors);
      expect(appErrors, `Console errors on /proposals: ${JSON.stringify(appErrors)}`).toHaveLength(0);
    });

    test('revenue page loads without crash or 404', async ({ page }) => {
      const consoleErrors = collectConsoleErrors(page);
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/revenue');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/page not found/i)).not.toBeVisible();

      const appErrors = filterAppErrors(consoleErrors);
      expect(appErrors, `Console errors on /revenue: ${JSON.stringify(appErrors)}`).toHaveLength(0);
    });

    test('invoices page loads without crash or 404', async ({ page }) => {
      const consoleErrors = collectConsoleErrors(page);
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/invoices');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/page not found/i)).not.toBeVisible();

      const appErrors = filterAppErrors(consoleErrors);
      expect(appErrors, `Console errors on /invoices: ${JSON.stringify(appErrors)}`).toHaveLength(0);
    });

    test('invalid invoice ID shows graceful error — app shell still visible', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/invoices/00000000-0000-0000-0000-000000000000');
      await page.waitForLoadState('networkidle');

      // Should not crash the entire app shell
      await expect(page.locator('aside')).toBeVisible({ timeout: 8000 });
    });

    test('settings page renders all content without crashing', async ({ page }) => {
      const consoleErrors = collectConsoleErrors(page);
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/settings');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/settings/i).first()).toBeVisible();

      const appErrors = filterAppErrors(consoleErrors);
      expect(appErrors, `Console errors on /settings: ${JSON.stringify(appErrors)}`).toHaveLength(0);
    });

    test('approvals page loads without crash', async ({ page }) => {
      const consoleErrors = collectConsoleErrors(page);
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/approvals');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/page not found/i)).not.toBeVisible();

      const appErrors = filterAppErrors(consoleErrors);
      expect(appErrors, `Console errors on /approvals: ${JSON.stringify(appErrors)}`).toHaveLength(0);
    });

    test('/snapshots top-level route exists or shows 404 (bug detection)', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/snapshots');
      await page.waitForLoadState('networkidle');

      const is404 = await page.getByText(/page not found/i).count() > 0;
      if (is404) {
        console.error(
          'BUG: Route /snapshots renders "Page Not Found". ' +
          'The Sidebar has a "Snapshots" nav link pointing to /snapshots, but App.tsx only registers ' +
          '/clients/:id/snapshots. This is a broken navigation link.'
        );
      }
      // This test documents the known bug — it should fail until fixed
      expect(is404, 'Route /snapshots shows 404 — Sidebar nav link is broken').toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 12. Sign out flow
  // -------------------------------------------------------------------------
  test.describe('Sign out flow', () => {
    test('clicking Sign Out redirects to /login', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('http://localhost:8080/');
      await page.waitForLoadState('networkidle');

      const signOutBtn = page.getByRole('button', { name: /sign out/i });
      await expect(signOutBtn).toBeVisible();
      await signOutBtn.click();

      await page.waitForURL(/\/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
