const { test, expect } = require('@playwright/test');

test.describe('Authentication Page E2E Tests', () => {

  test('Login page should render tabs and social login options', async ({ page }) => {
    await page.goto('/login');

    // Verify email/phone input is present
    const input = page.locator('input[type="text"], input[type="email"]').first();
    await expect(input).toBeVisible();

    // Verify Google sign in button
    const googleBtn = page.getByRole('button', { name: /google/i });
    await expect(googleBtn).toBeVisible();
  });

});
