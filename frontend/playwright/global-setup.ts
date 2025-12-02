import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Get the path to the storage state file
const STORAGE_STATE_PATH = path.join(__dirname, 'auth-state.json');

// Test user credentials for E2E testing
const TEST_USER_EMAIL = 'playwright-test@test.com';
const TEST_USER_PASSWORD = '1234Test';

/**
 * Global setup function run once before all tests.
 * This performs real authentication with Supabase and saves the session state.
 *
 * Steps:
 * 1. Navigate to login page
 * 2. Fill in test user credentials
 * 3. Submit and wait for redirect
 * 4. Save the authenticated browser state
 */
async function globalSetup(config: FullConfig) {
  console.log('🔐 Starting Playwright Global Setup: Authenticating...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Get the base URL from config
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';

  try {
    // Navigate to login page
    console.log(`   Navigating to ${baseURL}/auth/login...`);
    await page.goto(`${baseURL}/auth/login`, { waitUntil: 'networkidle', timeout: 30000 });

    // Fill in credentials
    console.log(`   Logging in as ${TEST_USER_EMAIL}...`);

    // Wait for the email input to be visible
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_USER_EMAIL);

    // Fill password
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await passwordInput.fill(TEST_USER_PASSWORD);

    // Click login button (use type="submit" to get the form submit button)
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // Wait for successful login - should redirect away from login page
    console.log('   Waiting for authentication...');
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 });

    console.log(`✅ Successfully logged in as ${TEST_USER_EMAIL}`);
    console.log(`   Current URL: ${page.url()}`);

    // Save the browser state (cookies + localStorage)
    await context.storageState({ path: STORAGE_STATE_PATH });

    console.log(`✅ Auth state saved to: ${STORAGE_STATE_PATH}`);

  } catch (error) {
    console.error('❌ Failed to authenticate:', error);

    // Create a minimal state file so tests can still run (will redirect to login)
    const minimalState = {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: []
      }]
    };
    fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(minimalState, null, 2));
    console.log('⚠️ Created minimal auth state (tests will skip auth-required tests)');
  }

  await browser.close();
  console.log('🔐 Global setup complete\n');
}

export default globalSetup;
