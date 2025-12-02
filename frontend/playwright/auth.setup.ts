import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Get the path to the storage state file
const STORAGE_STATE_PATH = path.join(__dirname, 'auth-state.json');

/**
 * Global setup function run once before all tests.
 * This creates a mock authenticated session state for Supabase Auth.
 *
 * In a production E2E setup, this would:
 * 1. Navigate to login page
 * 2. Fill in test user credentials
 * 3. Submit and wait for redirect
 * 4. Save the authenticated browser state
 *
 * For now, we create a mock session that simulates an authenticated user.
 */
async function globalSetup(config: FullConfig) {
  console.log('🔐 Starting Playwright Global Setup: Creating auth state...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Get the base URL from config
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';

  // Test user credentials (for mock session)
  const TEST_USER = {
    id: 'e2e-test-user-' + Date.now(),
    email: 'e2e-test@medaihub.test',
    role: 'authenticated',
  };

  try {
    // Navigate to the app to initialize the browser context
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // For Supabase Auth, we need to set the localStorage with a mock session
    // The actual key depends on your Supabase project URL
    // Format: sb-<project-ref>-auth-token

    // Get the Supabase URL from environment or use a pattern
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yronyapjuaswetrmotuk.supabase.co';
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'yronyapjuaswetrmotuk';
    const authTokenKey = `sb-${projectRef}-auth-token`;

    // Create a mock Supabase session
    // Note: This is a MOCK session for E2E testing only
    // In production, you'd use real test credentials
    const mockSession = {
      access_token: 'mock-access-token-for-e2e-testing',
      refresh_token: 'mock-refresh-token-for-e2e-testing',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: TEST_USER,
    };

    // Set the mock session in localStorage
    await page.evaluate(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    }, { key: authTokenKey, session: mockSession });

    console.log(`✅ Mock session created for user: ${TEST_USER.email}`);
    console.log(`   Storage key: ${authTokenKey}`);

    // Save the browser state (cookies + localStorage)
    await context.storageState({ path: STORAGE_STATE_PATH });

    console.log(`✅ Auth state saved to: ${STORAGE_STATE_PATH}`);

  } catch (error) {
    console.error('❌ Failed to create auth state:', error);

    // Create a minimal state file so tests can still run (will redirect to login)
    const minimalState = {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: []
      }]
    };
    fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(minimalState, null, 2));
    console.log('⚠️ Created minimal auth state (tests may require login)');
  }

  await browser.close();
  console.log('🔐 Global setup complete\n');
}

export default globalSetup;
