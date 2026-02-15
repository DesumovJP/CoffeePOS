import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CoffeePOS/i);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /увійти/i })).toBeVisible();
  });
});
