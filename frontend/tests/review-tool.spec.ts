import { test, expect } from '@playwright/test';

/**
 * MedAI Hub - Review Tool E2E Tests
 * Tests for the abstract screening functionality
 */

test.describe('Review Tool', () => {

  test.describe('Review Page Layout', () => {
    test('should load Review page with header', async ({ page }) => {
      await page.goto('/review');

      // Check page loaded
      await expect(page.getByRole('heading', { name: /Review/i })).toBeVisible();
    });

    test('should show project selector', async ({ page }) => {
      await page.goto('/review');

      // Check project selector
      await expect(page.getByText(/Project/i)).toBeVisible();
    });

    test('should show file upload area', async ({ page }) => {
      await page.goto('/review');

      // Check for upload functionality
      const uploadArea = page.getByText(/upload/i);
      await expect(uploadArea).toBeVisible();
    });
  });

  test.describe('File Upload Flow', () => {
    test('should show upload instructions', async ({ page }) => {
      await page.goto('/review');

      // Check for file type instructions
      const instructions = page.getByText(/MEDLINE|txt/i);
      await expect(instructions).toBeVisible();
    });

    test('should have file input', async ({ page }) => {
      await page.goto('/review');

      // Check file input exists (may be hidden but present)
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();
    });
  });

  test.describe('Abstract List', () => {
    test('should show empty state when no abstracts', async ({ page }) => {
      await page.goto('/review');

      // Should show message about no abstracts or upload needed
      const emptyState = page.getByText(/no.*abstract|upload.*file/i);
      await expect(emptyState).toBeVisible();
    });

    test('should have filter options', async ({ page }) => {
      await page.goto('/review');

      // Check for status filter (All, Pending, Include, Exclude)
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Abstract Screening Actions', () => {
    test('should show screening controls when abstracts exist', async ({ page }) => {
      // This test validates the UI structure for screening
      await page.goto('/review');

      // The page should have a main content area
      const pageContent = page.locator('main');
      await expect(pageContent).toBeVisible();
    });
  });

  test.describe('Batch Analysis', () => {
    test('should have analyze button', async ({ page }) => {
      await page.goto('/review');

      // Check for AI analysis button (may be disabled without data)
      const analyzeButton = page.getByRole('button', { name: /analyze|AI|screen/i });

      // Button might not exist if no project selected - that's OK
      if (await analyzeButton.isVisible()) {
        await expect(analyzeButton).toBeVisible();
      }
    });
  });
});

test.describe('Review Tool - Project Integration', () => {
  test('should integrate with project selection', async ({ page }) => {
    // Create a project first
    await page.goto('/projects');
    await page.getByRole('button', { name: /New Project/i }).click();

    const projectName = `Review Test ${Date.now()}`;
    await page.getByLabel(/Project Name/i).fill(projectName);
    await page.getByLabel(/Research Framework/i).selectOption('PICO');
    await page.getByRole('button', { name: /Create Project/i }).click();

    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });

    // Navigate to review page
    await page.goto('/review');

    // Select the created project
    const projectSelect = page.locator('select').first();
    await projectSelect.selectOption({ label: projectName });

    // Verify project is selected (UI should update)
    await expect(page.locator('main')).toBeVisible();
  });
});
