import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('should load and display title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Project Vision/);
    await expect(page.locator('h1')).toContainText('Project Vision');
  });
});