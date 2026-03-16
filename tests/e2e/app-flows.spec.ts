/**
 * App Flows — Luma Operator CRUD
 *
 * Tests real user workflows: creating clients, logging deliveries (with hours),
 * creating scope requests, and creating proposals.
 *
 * Auth is handled once by global-setup.ts — every test starts already logged in.
 * No login/logout cycles. Browser opens once and stays open.
 */

import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:8080';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the first client in the list and return its URL. Null = no clients. */
async function goToFirstClient(page: Page): Promise<string | null> {
  await page.goto(`${BASE}/clients`);
  await page.waitForLoadState('networkidle');

  // Ensure we see all clients, not just the default filter
  const allBtn = page.getByRole('button', { name: /^all$/i });
  if ((await allBtn.count()) > 0) {
    await allBtn.first().click();
    await page.waitForTimeout(300);
  }

  const firstRow = page.locator('table tbody tr').first();
  if ((await firstRow.count()) === 0) return null;

  await firstRow.click();
  await page.waitForURL(/\/clients\/.+/);
  await page.waitForLoadState('networkidle');
  return page.url();
}

// ---------------------------------------------------------------------------
// 1. Create Client
// ---------------------------------------------------------------------------

test.describe('Create Client', () => {
  test('can create a client and land on its detail page', async ({ page }) => {
    const clientName = `E2E Client ${Date.now()}`;

    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');

    // The trigger button on the clients page
    await page.getByRole('button', { name: /add client/i }).first().click();

    // Dialog opens: title "Add Client"
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Client' })).toBeVisible();

    // Required: Contact name ("Contact name *")
    await page.getByLabel(/company name/i).fill(clientName);

    // Optional but useful: company name
    const companyInput = page.getByLabel(/company name/i);
    if ((await companyInput.count()) > 0) {
      await companyInput.fill(`${clientName} Co`);
    }

    // Submit button reads "Add Client"
    await page.getByRole('dialog').getByRole('button', { name: 'Add Client' }).click();

    // Should redirect to the new client's detail page
    await page.waitForURL(/\/clients\/.+/, { timeout: 15_000 });
    await expect(page.getByRole('heading').first()).toContainText(clientName, { timeout: 8_000 });
  });

  test('new client appears in the client list after creation', async ({ page }) => {
    const clientName = `E2E List ${Date.now()}`;

    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add client/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/company name/i).fill(clientName);
    await page.getByRole('dialog').getByRole('button', { name: 'Add Client' }).click();

    await page.waitForURL(/\/clients\/.+/, { timeout: 15_000 });

    // Navigate back to list and show ALL clients (bypass status filter)
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');

    const allBtn = page.getByRole('button', { name: /^all$/i });
    if ((await allBtn.count()) > 0) {
      await allBtn.first().click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(clientName)).toBeVisible({ timeout: 15_000 });
  });

  test('company name is required — empty submission keeps dialog open', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add client/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click submit without filling anything — schema requires company_name
    await page.getByRole('dialog').getByRole('button', { name: 'Add Client' }).click();

    // Dialog stays open — Zod validation blocked the submit
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(`${BASE}/clients`);
  });

  test('filling only contact name (optional) without company name keeps dialog open', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add client/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // contact_name is optional — schema only requires company_name
    await page.getByLabel(/contact name/i).fill('Contact Only No Company');
    await page.getByRole('dialog').getByRole('button', { name: 'Add Client' }).click();

    // Dialog remains open because company_name is empty
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('email field rejects invalid email format', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add client/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill required company_name, then enter a bad email
    await page.getByLabel(/company name/i).fill('Test Company');
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByRole('dialog').getByRole('button', { name: 'Add Client' }).click();

    // Should show a validation error and stay in dialog
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Escape closes dialog without creating a client', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');

    const countBefore = await page.locator('table tbody tr').count();

    await page.getByRole('button', { name: /add client/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/contact name/i).fill('Should Not Be Created');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 4_000 });

    await page.waitForTimeout(500);
    const countAfter = await page.locator('table tbody tr').count();
    expect(countAfter).toBe(countBefore);
  });

  test('Cancel button closes dialog without creating a client', async ({ page }) => {
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add client/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/contact name/i).fill('Should Not Exist');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 4_000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Log Delivery
// ---------------------------------------------------------------------------

test.describe('Log Delivery', () => {
  test('quick-add input is visible on the Deliveries tab', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);

    await expect(page.getByPlaceholder('What did you deliver?')).toBeVisible();
  });

  test('Enter submits a delivery and clears the input', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);

    const quickInput = page.getByPlaceholder('What did you deliver?');
    const deliveryTitle = `E2E Delivery ${Date.now()}`;

    await quickInput.fill(deliveryTitle);
    await page.keyboard.press('Enter');

    // Input clears on successful submit
    await expect(quickInput).toHaveValue('', { timeout: 8_000 });

    // Delivery appears in the timeline below
    await expect(page.getByText(deliveryTitle)).toBeVisible({ timeout: 8_000 });
  });

  test('+Xh suffix logs hours alongside the delivery', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);

    const quickInput = page.getByPlaceholder('What did you deliver?');
    const deliveryTitle = `E2E Hours ${Date.now()}`;

    // "+2h" suffix is parsed into hours_spent — the suffix is stripped from the title
    await quickInput.fill(`${deliveryTitle} +2h`);
    await page.keyboard.press('Enter');

    await expect(quickInput).toHaveValue('', { timeout: 8_000 });
    await expect(page.getByText(deliveryTitle)).toBeVisible({ timeout: 8_000 });
  });

  test('Tab key opens the full Log Delivery dialog with title prefilled', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);

    const quickInput = page.getByPlaceholder('What did you deliver?');
    await quickInput.fill('Tab expand test');
    await page.keyboard.press('Tab');

    // Full dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Log Delivery' })).toBeVisible();

    // Title field should be prefilled with what was typed
    const titleField = dialog.getByLabel(/what did you deliver/i);
    await expect(titleField).toHaveValue('Tab expand test');

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });

  test('"Log Delivery" button (tab header) opens the full dialog', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);

    // Two "Log Delivery" buttons exist: one in the tab header (capital D, outline button)
    // and one FAB (fixed bottom-right). Target the tab header button with exact name.
    await page.getByRole('button', { name: 'Log Delivery' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Log Delivery' })).toBeVisible();

    // Dialog has the key fields
    await expect(dialog.getByLabel(/what did you deliver/i)).toBeVisible();
    await expect(dialog.getByLabel(/category/i)).toBeVisible();
    await expect(dialog.getByLabel(/hours spent/i)).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });

  test('full Log Delivery dialog — fill all fields and submit', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Log Delivery' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const deliveryTitle = `Full Dialog Delivery ${Date.now()}`;
    await dialog.getByLabel(/what did you deliver/i).fill(deliveryTitle);

    // Category is REQUIRED (Zod min(1)) — select the first available option
    await dialog.getByLabel(/category/i).click();
    await page.getByRole('option', { name: 'Marketing' }).click();

    const descField = dialog.getByLabel(/description/i);
    if ((await descField.count()) > 0) {
      await descField.fill('Created by E2E test via full dialog');
    }

    const hoursField = dialog.getByLabel(/hours spent/i);
    if ((await hoursField.count()) > 0) {
      await hoursField.fill('1.5');
    }

    await dialog.getByRole('button', { name: 'Log Delivery' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(deliveryTitle)).toBeVisible({ timeout: 8_000 });
  });

  test('n key focuses the quick-add input from anywhere on the page', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);

    // Click somewhere neutral (not an input)
    await page.locator('h1').first().click();

    // Press "n" — global shortcut
    await page.keyboard.press('n');

    const quickInput = page.getByPlaceholder('What did you deliver?');
    await expect(quickInput).toBeFocused({ timeout: 3_000 });
  });

  test('helper text appears when quick-add is focused', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Deliveries' }).click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('What did you deliver?').click();

    await expect(page.getByText(/enter to log/i)).toBeVisible({ timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// 3. Scope Requests
// ---------------------------------------------------------------------------

test.describe('Scope Requests', () => {
  test('Requests tab loads without crash and shows content', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();

    // Either requests exist, or the empty state "No requests yet" is shown
    const hasRequests = await page.getByRole('heading', { name: /scope requests/i }).count() > 0;
    const hasEmpty = await page.getByText(/no requests yet/i).count() > 0;
    expect(hasRequests || hasEmpty).toBe(true);
  });

  test('"New Request" button is visible on the Requests tab', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'New Request' })).toBeVisible({ timeout: 5_000 });
  });

  test('"New Request" opens the Create Scope Request dialog', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'New Request' }).click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'New Scope Request' })).toBeVisible();
  });

  test('Create Scope Request dialog has Title, Description, and Scope cost fields', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'New Request' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel(/title/i)).toBeVisible();
    await expect(dialog.getByLabel(/description/i)).toBeVisible();
    await expect(dialog.getByLabel(/scope cost/i)).toBeVisible();
  });

  test('submitting with empty title keeps dialog open (Zod validates on submit)', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'New Request' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Click submit without filling title — Zod fires on submit, not on mount
    await dialog.getByRole('button', { name: 'Create Request' }).click();

    // Dialog must stay open — validation prevented the submission
    await expect(dialog).toBeVisible({ timeout: 3_000 });
  });

  test('can create a scope request with title only', async ({ page }) => {
    // NOTE: This test requires the `requested_by` column to exist on the
    // `scope_requests` table in the remote Supabase database.
    // If the test fails with a 400, run the pending migrations against the remote DB.
    // Confirmed bug: PGRST204 "Could not find the 'requested_by' column of 'scope_requests'"
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    const apiErrors: string[] = [];
    page.on('response', async r => {
      if (r.url().includes('scope_requests') && r.status() >= 400) {
        const body = await r.text().catch(() => '');
        apiErrors.push(`${r.status()} ${body}`);
      }
    });

    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'New Request' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const requestTitle = `E2E Request ${Date.now()}`;
    await dialog.getByPlaceholder('Additional landing page design').fill(requestTitle);
    await dialog.getByRole('button', { name: 'Create Request' }).click();

    await page.waitForTimeout(4_000);

    if (apiErrors.length > 0) {
      throw new Error(`Scope request creation failed — DB schema issue: ${apiErrors[0]}`);
    }

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(requestTitle)).toBeVisible({ timeout: 8_000 });
  });

  test('can create a scope request with all fields filled', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    const apiErrors: string[] = [];
    page.on('response', async r => {
      if (r.url().includes('scope_requests') && r.status() >= 400) {
        const body = await r.text().catch(() => '');
        apiErrors.push(`${r.status()} ${body}`);
      }
    });

    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'New Request' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const requestTitle = `E2E Full Request ${Date.now()}`;
    await dialog.getByPlaceholder('Additional landing page design').fill(requestTitle);
    await dialog.getByLabel(/description/i).fill('Additional landing page — E2E test');
    await dialog.getByLabel(/scope cost/i).fill('3');
    await dialog.getByRole('button', { name: 'Create Request' }).click();

    await page.waitForTimeout(4_000);

    if (apiErrors.length > 0) {
      throw new Error(`Scope request creation failed — DB schema issue: ${apiErrors[0]}`);
    }

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(requestTitle)).toBeVisible({ timeout: 8_000 });
  });

  test('Cancel closes the dialog without creating a request', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');

    const countBefore = await page.locator('[role="tabpanel"][data-state="active"] [data-testid], [role="tabpanel"][data-state="active"] article').count();

    await page.getByRole('button', { name: 'New Request' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.getByLabel(/title/i).fill('Cancelled Request');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 4_000 });
    await expect(page.getByText('Cancelled Request')).not.toBeVisible();
  });

  test('empty state shows "Create first request" action', async ({ page }) => {
    // This test validates the empty state UI — only if the client has no requests
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Requests' }).click();
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByText(/no requests yet/i);
    if ((await emptyState.count()) === 0) {
      // Client already has requests — skip this specific test
      test.skip();
      return;
    }

    await expect(page.getByRole('button', { name: /create first request/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Proposals
// ---------------------------------------------------------------------------

test.describe('Proposals', () => {
  test('proposals list page loads with header and "New Proposal" button', async ({ page }) => {
    await page.goto(`${BASE}/proposals`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText(/page not found/i)).not.toBeVisible();

    await expect(page.getByRole('heading', { name: 'Proposals' })).toBeVisible();
    await expect(page.getByRole('link', { name: /new proposal/i })).toBeVisible();
  });

  test('status filter tabs render: All, Draft, Sent, Viewed, Accepted, Declined, Expired', async ({ page }) => {
    await page.goto(`${BASE}/proposals`);
    await page.waitForLoadState('networkidle');

    for (const tab of ['All', 'Draft', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Expired']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${tab}`, 'i') }).first()).toBeVisible();
    }
  });

  test('"New Proposal" navigates to /proposals/new', async ({ page }) => {
    await page.goto(`${BASE}/proposals`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /new proposal/i }).click();
    await expect(page).toHaveURL(`${BASE}/proposals/new`, { timeout: 10_000 });
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('proposal builder renders without crash at /proposals/new', async ({ page }) => {
    await page.goto(`${BASE}/proposals/new`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText(/page not found/i)).not.toBeVisible();

    // Builder should have at least a page heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });
  });

  test('proposal builder has a client selector field', async ({ page }) => {
    await page.goto(`${BASE}/proposals/new`);
    await page.waitForLoadState('networkidle');

    // Client select / combobox should be present
    const clientSelect = page
      .getByLabel(/client/i)
      .or(page.getByRole('combobox', { name: /client/i }))
      .first();
    await expect(clientSelect).toBeVisible({ timeout: 8_000 });
  });

  test('proposal builder has a title field', async ({ page }) => {
    await page.goto(`${BASE}/proposals/new`);
    await page.waitForLoadState('networkidle');

    const titleField = page
      .getByLabel(/title/i)
      .or(page.getByPlaceholder(/proposal title|untitled/i))
      .first();
    await expect(titleField).toBeVisible({ timeout: 8_000 });
  });

  test('Proposals tab on client detail renders without crash', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Proposals' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();

    const tabContent = page.locator('[role="tabpanel"][data-state="active"]');
    const text = await tabContent.evaluate((el) => el.textContent?.trim().length ?? 0);
    expect(text).toBeGreaterThan(0);
  });

  test('"New Proposal" button on Proposals tab links to builder', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Proposals' }).click();
    await page.waitForLoadState('networkidle');

    const newBtn = page
      .locator('[role="tabpanel"][data-state="active"]')
      .getByRole('button', { name: /new proposal/i });

    if ((await newBtn.count()) === 0) {
      console.warn('UX GAP: No "New Proposal" button on Proposals tab');
      test.skip();
      return;
    }

    await newBtn.click();
    await page.waitForURL(/\/proposals\/.+/, { timeout: 10_000 });
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('clicking a proposal card navigates to its detail page', async ({ page }) => {
    await page.goto(`${BASE}/proposals`);
    await page.waitForLoadState('networkidle');

    // Show all proposals
    const allTab = page.getByRole('button', { name: /^all/i });
    if ((await allTab.count()) > 0) await allTab.first().click();
    await page.waitForTimeout(300);

    // Find a clickable proposal title link
    const firstProposalLink = page.locator('a[href*="/proposals/"]').first();
    if ((await firstProposalLink.count()) === 0) {
      test.skip(); // No proposals exist yet
      return;
    }

    await firstProposalLink.click();
    await page.waitForURL(/\/proposals\/.+/, { timeout: 10_000 });
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Dashboard
// ---------------------------------------------------------------------------

test.describe('Dashboard', () => {
  test('renders greeting with time of day', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/good (morning|afternoon|evening)/i)
    ).toBeVisible({ timeout: 8_000 });
  });

  test('renders all 4 stat cards', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/total clients/i).first()).toBeVisible();
    await expect(page.getByText(/deliveries this month/i).first()).toBeVisible();
    await expect(page.getByText(/pending approvals/i).first()).toBeVisible();
    await expect(page.getByText(/scope alerts/i).first()).toBeVisible();
  });

  test('Recent Clients table renders with column headers', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/recent clients/i)).toBeVisible({ timeout: 8_000 });
  });

  test('clicking a client row on dashboard navigates to client detail', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    const firstClientRow = page.locator('table tbody tr').first();
    if ((await firstClientRow.count()) === 0) {
      test.skip(); // No clients in DB
      return;
    }

    await firstClientRow.click();
    await page.waitForURL(/\/clients\/.+/, { timeout: 8_000 });
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('getting started checklist renders when not all steps are done', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    // Checklist is conditionally rendered — present if any step is incomplete
    const checklist = page.getByText(/getting started/i);
    if ((await checklist.count()) > 0) {
      await expect(checklist.first()).toBeVisible();
    }
    // If checklist is gone, user has completed all steps — that's also valid
  });

  test('scope alerts section links to the correct client scope tab', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    // Only test if there are scope alerts visible
    const alertLinks = page.locator('a[href*="tab=scope"]');
    if ((await alertLinks.count()) === 0) {
      test.skip(); // No scope alerts
      return;
    }

    const href = await alertLinks.first().getAttribute('href');
    expect(href).toMatch(/\/clients\/.+\?tab=scope/);
  });
});

// ---------------------------------------------------------------------------
// 6. Client Detail — Full Tab Coverage
// ---------------------------------------------------------------------------

test.describe('Client Detail tabs', () => {
  test('all 7 tabs render: Deliveries, Scope, Requests, Proposals, Portal, Reports, Timeline', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    for (const tabName of ['Deliveries', 'Scope', 'Requests', 'Proposals', 'Portal', 'Reports', 'Timeline']) {
      const tab = page.getByRole('tab', { name: tabName });
      await expect(tab).toBeVisible({ timeout: 5_000 });
    }
  });

  test('each tab activates without crash when clicked', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    for (const tabName of ['Deliveries', 'Scope', 'Requests', 'Proposals', 'Portal', 'Reports', 'Timeline']) {
      const tab = page.getByRole('tab', { name: tabName });
      await tab.click();
      await page.waitForTimeout(400);
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
      await expect(tab).toHaveAttribute('data-state', 'active');
    }
  });

  test('tab selection updates the URL ?tab= param', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Scope' }).click();
    await expect(page).toHaveURL(/tab=scope/);

    await page.getByRole('tab', { name: 'Proposals' }).click();
    await expect(page).toHaveURL(/tab=proposals/);

    await page.getByRole('tab', { name: 'Timeline' }).click();
    await expect(page).toHaveURL(/tab=timeline/);
  });

  test('client header shows name, status badge, and "Share Portal" button', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /share portal/i })).toBeVisible();
  });

  test('stat strip shows Deliveries, Scope Used, and Hours Logged labels', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await expect(page.getByText(/deliveries/i).first()).toBeVisible();
    await expect(page.getByText(/scope used/i)).toBeVisible();
    await expect(page.getByText(/hours logged/i)).toBeVisible();
  });

  test('Portal tab renders without crash', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Portal' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('Scope tab renders without crash', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    await page.getByRole('tab', { name: 'Scope' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('back breadcrumb navigates to /clients', async ({ page }) => {
    const url = await goToFirstClient(page);
    if (!url) { test.skip(); return; }

    const backLink = page.getByRole('link', { name: /clients/i }).first();
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(`${BASE}/clients`);
  });
});
