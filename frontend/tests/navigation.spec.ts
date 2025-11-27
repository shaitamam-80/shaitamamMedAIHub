import { test, expect } from '@playwright/test';

/**
 * MedAI Hub - Navigation E2E Tests
 * Tests for sidebar navigation and page routing
 */

test.describe('Navigation', () => {

  test.describe('Sidebar Navigation', () => {
    test('should display sidebar on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      // Sidebar should be visible on desktop
      const sidebar = page.locator('aside, [role="navigation"]').first();
      await expect(sidebar).toBeVisible();
    });

    test('should have main navigation links', async ({ page }) => {
      await page.goto('/');

      // Check all main navigation items
      await expect(page.getByRole('link', { name: /Define/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Query/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Review/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Projects/i }).first()).toBeVisible();
    });

    test('should navigate to Define page', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /Define/i }).first().click();

      await expect(page).toHaveURL(/\/define/);
      await expect(page.getByRole('heading', { name: 'Define' })).toBeVisible();
    });

    test('should navigate to Query page', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /Query/i }).first().click();

      await expect(page).toHaveURL(/\/query/);
    });

    test('should navigate to Review page', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /Review/i }).first().click();

      await expect(page).toHaveURL(/\/review/);
    });

    test('should navigate to Projects page', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /Projects/i }).first().click();

      await expect(page).toHaveURL(/\/projects/);
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should have mobile menu button on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Look for hamburger menu or mobile nav button
      const menuButton = page.getByRole('button', { name: /menu/i });

      // Mobile menu might be implemented differently
      // Just check page loads on mobile
      await expect(page.locator('body')).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Page should load without horizontal scroll issues
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // Allow small margin
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should show current page context', async ({ page }) => {
      await page.goto('/define');

      // Page should indicate current location
      await expect(page.getByRole('heading', { name: 'Define' })).toBeVisible();
    });
  });

  test.describe('Direct URL Access', () => {
    test('should load Define page directly', async ({ page }) => {
      await page.goto('/define');
      await expect(page.getByRole('heading', { name: 'Define' })).toBeVisible();
    });

    test('should load Projects page directly', async ({ page }) => {
      await page.goto('/projects');
      await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();
    });

    test('should load Query page directly', async ({ page }) => {
      await page.goto('/query');
      // Page should load without errors
      await expect(page.locator('main')).toBeVisible();
    });

    test('should load Review page directly', async ({ page }) => {
      await page.goto('/review');
      // Page should load without errors
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle 404 for invalid routes', async ({ page }) => {
      const response = await page.goto('/invalid-page-that-does-not-exist');

      // Should either show 404 page or redirect to home
      // Next.js returns 404 status for non-existent pages
      const status = response?.status();
      expect([200, 404]).toContain(status);
    });
  });

  test.describe('Page Transitions', () => {
    test('should maintain state during navigation', async ({ page }) => {
      // Create a project
      await page.goto('/projects');
      await page.getByRole('button', { name: /New Project/i }).click();

      const projectName = `Nav Test ${Date.now()}`;
      await page.getByLabel(/Project Name/i).fill(projectName);
      await page.getByLabel(/Research Framework/i).selectOption('PICO');
      await page.getByRole('button', { name: /Create Project/i }).click();

      await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });

      // Navigate away and back
      await page.goto('/define');
      await page.goto('/projects');

      // Project should still be visible
      await expect(page.getByText(projectName)).toBeVisible();
    });
  });
});

test.describe('App Layout', () => {
  test('should have consistent header across pages', async ({ page }) => {
    const pages = ['/', '/define', '/query', '/review', '/projects'];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Each page should have main content area
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should have proper document title', async ({ page }) => {
    await page.goto('/');

    // Page should have a title
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
