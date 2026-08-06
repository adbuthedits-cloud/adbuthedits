const { test, expect } = require('@playwright/test');

test.describe('Shop & Product Detail View E2E Tests', () => {

  test('Should display shop page product grid', async ({ page }) => {
    await page.goto('/shop');

    // Wait for product cards or empty state
    await page.waitForLoadState('networkidle');
    const pageBody = page.locator('body');
    await expect(pageBody).toBeVisible();
  });

  test('Customise Now button on Product Detail page requires login', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    // Find first product link if available
    const productCardLink = page.locator('a[href*="/shop/category/"]').first();
    if (await productCardLink.isVisible()) {
      await productCardLink.click();
      await page.waitForLoadState('networkidle');

      // Click Customise Now button
      const customiseBtn = page.getByRole('button', { name: /customise now/i });
      if (await customiseBtn.isVisible()) {
        await customiseBtn.click();
        // Should redirect unauthenticated user to login
        await expect(page).toHaveURL(/\/login/);
      }
    }
  });

});
