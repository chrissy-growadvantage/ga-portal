import { chromium } from '@playwright/test';

/**
 * Runs once before the entire test suite.
 * Logs in as the operator and saves the session to tests/auth.json.
 * All tests then reuse this state — no repeated login screens.
 */
async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:8080/login');

  const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
  const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first();

  await emailInput.fill('hello@heymervin.com');
  await passwordInput.fill('Maine@321');
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });

  // Save cookies + localStorage so every test starts already authenticated
  await page.context().storageState({ path: 'tests/auth.json' });

  await browser.close();
}

export default globalSetup;
