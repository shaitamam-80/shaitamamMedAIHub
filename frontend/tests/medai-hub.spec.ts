import { test, expect } from '@playwright/test';

/**
 * MedAI Hub E2E Tests
 * Tests the complete flow: project creation -> Define tool with RTL support
 * Updated for simplified Define page layout (chat-centric)
 */

test.describe('MedAI Hub - Complete Flow', () => {

  test.describe('Homepage', () => {
    test('should load homepage and display main elements', async ({ page }) => {
      await page.goto('/');

      // Check main title
      await expect(page.getByRole('heading', { name: /Welcome to MedAI Hub/i })).toBeVisible();

      // Check navigation links to main tools
      await expect(page.getByRole('link', { name: /Define/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Query/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Review/i }).first()).toBeVisible();

      // Check "Get Started" button
      await expect(page.getByRole('link', { name: /Get Started with Projects/i })).toBeVisible();
    });
  });

  test.describe('Project Creation', () => {
    test('should navigate to projects page', async ({ page }) => {
      await page.goto('/projects');

      // Check projects page loaded
      await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /New Project/i })).toBeVisible();
    });

    test('should open create project form', async ({ page }) => {
      await page.goto('/projects');

      // Click new project button
      await page.getByRole('button', { name: /New Project/i }).click();

      // Check form elements are visible
      await expect(page.getByLabel(/Project Name/i)).toBeVisible();
      await expect(page.getByLabel(/Description/i)).toBeVisible();
      await expect(page.getByLabel(/Research Framework/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Create Project/i })).toBeVisible();
    });

    test('should create a new project', async ({ page }) => {
      await page.goto('/projects');

      // Open form
      await page.getByRole('button', { name: /New Project/i }).click();

      // Fill form
      const projectName = `Test Project ${Date.now()}`;
      await page.getByLabel(/Project Name/i).fill(projectName);
      await page.getByLabel(/Description/i).fill('Test project for E2E testing');

      // Select framework
      await page.getByLabel(/Research Framework/i).selectOption('PICO');

      // Submit
      await page.getByRole('button', { name: /Create Project/i }).click();

      // Wait for project to appear in list
      await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Define Tool - Layout', () => {
    test('should load Define page with header', async ({ page }) => {
      await page.goto('/define');

      // Check header
      await expect(page.getByRole('heading', { name: 'Define' })).toBeVisible();
    });

    test('should show project selector in context bar', async ({ page }) => {
      await page.goto('/define');

      // Check project selector exists
      await expect(page.getByText('Project:')).toBeVisible();
      await expect(page.locator('select').first()).toBeVisible();
    });

    test('should show language selection on initial load', async ({ page }) => {
      await page.goto('/define');

      // Check language buttons
      await expect(page.getByRole('button', { name: 'עברית' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
    });
  });

  test.describe('Define Tool - English Mode', () => {
    test('should select English and show English welcome message', async ({ page }) => {
      await page.goto('/define');

      // Select English
      await page.getByRole('button', { name: 'English' }).click();

      // Check English welcome message
      await expect(page.getByText(/Hello!/i)).toBeVisible();
      await expect(page.getByText(/I'll analyze your research topic/i)).toBeVisible();

      // Check input placeholder is in English
      await expect(page.getByPlaceholder(/Tell me about your research/i)).toBeVisible();
    });

  });

  test.describe('Define Tool - Hebrew Mode (RTL)', () => {
    test('should select Hebrew and show Hebrew welcome message', async ({ page }) => {
      await page.goto('/define');

      // Select Hebrew
      await page.getByRole('button', { name: 'עברית' }).click();

      // Check Hebrew welcome message
      await expect(page.getByText(/שלום!/i)).toBeVisible();
      await expect(page.getByText(/אני אאפיין עבורך את שאלת המחקר/i)).toBeVisible();
    });

    test('should have RTL direction for Hebrew chat', async ({ page }) => {
      await page.goto('/define');

      // Select Hebrew
      await page.getByRole('button', { name: 'עברית' }).click();

      // Check placeholder is in Hebrew
      await expect(page.getByPlaceholder(/ספר לי על המחקר שלך/i)).toBeVisible();

      // Check RTL direction on chat input area
      const inputContainer = page.locator('[dir="rtl"]').first();
      await expect(inputContainer).toBeVisible();
    });

    test('should flip send button icon for RTL', async ({ page }) => {
      await page.goto('/define');

      // Select Hebrew
      await page.getByRole('button', { name: 'עברית' }).click();

      // The send button should have rotate-180 class in RTL mode
      const sendIcon = page.locator('svg.rotate-180');
      await expect(sendIcon).toBeVisible();
    });
  });

  test.describe('Complete User Flow', () => {
    test('should complete full flow: create project -> define question in Hebrew', async ({ page }) => {
      // Step 1: Create a project
      await page.goto('/projects');
      await page.getByRole('button', { name: /New Project/i }).click();

      const projectName = `מחקר על סוכרת ${Date.now()}`;
      await page.getByLabel(/Project Name/i).fill(projectName);
      await page.getByLabel(/Description/i).fill('מחקר על טיפול בסוכרת');
      await page.getByLabel(/Research Framework/i).selectOption('PICO');
      await page.getByRole('button', { name: /Create Project/i }).click();

      // Wait for project creation
      await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });

      // Step 2: Navigate to Define
      await page.goto('/define');

      // Step 3: Select Hebrew
      await page.getByRole('button', { name: 'עברית' }).click();

      // Verify Hebrew mode
      await expect(page.getByText(/שלום!/i)).toBeVisible();

      // Step 4: Select the created project
      const projectSelect = page.locator('select').first();
      await projectSelect.selectOption({ label: projectName });

      // Step 5: Verify input is ready
      await expect(page.getByPlaceholder(/ספר לי על המחקר שלך/i)).toBeEnabled();
    });

    test('should complete full flow: create project -> define question in English', async ({ page }) => {
      // Step 1: Create a project
      await page.goto('/projects');
      await page.getByRole('button', { name: /New Project/i }).click();

      const projectName = `Diabetes Research ${Date.now()}`;
      await page.getByLabel(/Project Name/i).fill(projectName);
      await page.getByLabel(/Description/i).fill('Research on diabetes treatment');
      await page.getByLabel(/Research Framework/i).selectOption('PICO');
      await page.getByRole('button', { name: /Create Project/i }).click();

      // Wait for project creation
      await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });

      // Step 2: Navigate to Define
      await page.goto('/define');

      // Step 3: Select English
      await page.getByRole('button', { name: 'English' }).click();

      // Verify English mode
      await expect(page.getByText(/Hello!/i)).toBeVisible();

      // Step 4: Select the created project
      const projectSelect = page.locator('select').first();
      await projectSelect.selectOption({ label: projectName });

      // Step 5: Verify input is ready
      await expect(page.getByPlaceholder(/Tell me about your research/i)).toBeEnabled();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading in Define page', async ({ page }) => {
      await page.goto('/define');

      // Check h1 exists
      const h1 = page.getByRole('heading', { name: 'Define' });
      await expect(h1).toBeVisible();
    });

    test('should have accessible form labels in Projects page', async ({ page }) => {
      await page.goto('/projects');
      await page.getByRole('button', { name: /New Project/i }).click();

      // Check labels are properly associated
      const nameInput = page.getByLabel(/Project Name/i);
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toBeEnabled();
    });
  });
});
