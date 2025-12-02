import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

// Define the path to the authentication file
export const STORAGE_STATE = path.join(__dirname, 'playwright/auth-state.json');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,

  // Set the base URL for the frontend application
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Global setup: Authenticate and save the session state before running tests
  globalSetup: require.resolve('./playwright/global-setup'),

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the authenticated state for all tests in this project
        storageState: STORAGE_STATE,
      },
    },
  ],

  // Web server commands (assuming Next.js is run on port 3000)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
