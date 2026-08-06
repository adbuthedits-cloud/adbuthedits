const { test, expect } = require('@playwright/test');

test.describe('Home Page & Navigation E2E Tests', () => {

  test('Should load home page with logo and main sections', async ({ page }) => {
    await page.goto('/');

    // Verify title
    await expect(page).toHaveTitle(/Adbuth/i);

    // Verify logo is visible
    const logo = page.locator('header img[alt="logo"]');
    await expect(logo.first()).toBeVisible();

    // Verify navigation links
    const shopLink = page.locator('nav a[href*="/shop"]').first();
    await expect(shopLink).toBeVisible();
  });

  test('Should navigate from Home to Shop page', async ({ page }) => {
    await page.goto('/');
    const shopLink = page.locator('a[href*="/shop"]').first();
    await shopLink.click();

    await expect(page).toHaveURL(/\/shop/);
  });

});
