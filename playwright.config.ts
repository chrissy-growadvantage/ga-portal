import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/global-setup.ts',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  timeout: 30_000,
  globalTimeout: 10 * 60_000,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    screenshot: 'on',
    video: 'off',
    trace: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // Every test starts already logged in — no repeated login screens
    storageState: 'tests/auth.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
