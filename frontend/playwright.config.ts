import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for MedAI Hub E2E tests
 * @see https://playwright.dev/docs/test-configuration
 *
 * IMPORTANT: Before running tests, start the servers:
 *   Terminal 1: cd backend && python main.py
 *   Terminal 2: cd frontend && npm run dev
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
