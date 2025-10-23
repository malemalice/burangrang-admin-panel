import { Page } from '@playwright/test';

// Enhanced test isolation utilities
export async function isolateTest(page: Page): Promise<void> {
  // Clear all storage
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    console.log('⚠️ Could not clear storage (expected in some cases)');
  }

  // Clear cookies
  await page.context().clearCookies();

  // Navigate to home to ensure clean state
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export async function waitForStableState(page: Page, timeout = 5000): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Wait for any animations or transitions
  await page.waitForTimeout(500);

  // Wait for any loading indicators to disappear
  try {
    await page.waitForSelector('.loading, [aria-busy="true"]', {
      state: 'detached',
      timeout: timeout
    });
  } catch (error) {
    // Loading indicators might not exist, which is fine
  }
}
