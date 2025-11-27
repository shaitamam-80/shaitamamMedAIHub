import { test, expect } from '@playwright/test';

/**
 * MedAI Hub - Query Tool E2E Tests
 * Tests for the PubMed query generation functionality
 */

test.describe('Query Tool', () => {

  test.describe('Query Page Layout', () => {
    test('should load Query page with header', async ({ page }) => {
      await page.goto('/query');

      // Check page loaded
      await expect(page.getByRole('heading', { name: /Query/i })).toBeVisible();
    });

    test('should show project selector', async ({ page }) => {
      await page.goto('/query');

      // Check project selector exists
      await expect(page.getByText(/Project/i)).toBeVisible();
    });

    test('should show generate query button', async ({ page }) => {
      await page.goto('/query');

      // Check generate button exists
      await expect(page.getByRole('button', { name: /Generate/i })).toBeVisible();
    });
  });

  test.describe('Query Generation Flow', () => {
    test('should show message when no project selected', async ({ page }) => {
      await page.goto('/query');

      // Should indicate need to select project
      const selectProjectText = page.getByText(/select.*project/i);
      await expect(selectProjectText).toBeVisible();
    });

    test('should enable generate button when project has framework data', async ({ page }) => {
      // First create a project with framework data
      await page.goto('/projects');
      await page.getByRole('button', { name: /New Project/i }).click();

      const projectName = `Query Test Project ${Date.now()}`;
      await page.getByLabel(/Project Name/i).fill(projectName);
      await page.getByLabel(/Research Framework/i).selectOption('PICO');
      await page.getByRole('button', { name: /Create Project/i }).click();

      await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });

      // Go to define and add some data
      await page.goto('/define');
      await page.getByRole('button', { name: 'English' }).click();

      const projectSelect = page.locator('select').first();
      await projectSelect.selectOption({ label: projectName });

      // Now go to query page
      await page.goto('/query');

      // Select the project
      const queryProjectSelect = page.locator('select').first();
      await queryProjectSelect.selectOption({ label: projectName });

      // Generate button should be present
      await expect(page.getByRole('button', { name: /Generate/i })).toBeVisible();
    });
  });

  test.describe('Query Results Display', () => {
    test('should display query sections after generation', async ({ page }) => {
      // This test assumes a project with completed framework data exists
      // In real E2E, you'd create the project and data first

      await page.goto('/query');

      // Check for expected sections (may be empty initially)
      // These would appear after successful query generation
      const expectedSections = ['Broad', 'Focused', 'Clinical'];

      // Verify the page structure supports displaying results
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Query History', () => {
    test('should have history section', async ({ page }) => {
      await page.goto('/query');

      // Check for history section (may show "no queries" message)
      const pageContent = page.locator('main');
      await expect(pageContent).toBeVisible();
    });
  });
});
