import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from '../utils/test-helpers';

test('Investigate settings page structure', async ({ page }) => {
  const { loginPage } = await setupAuthenticatedSession(page);

  // Login
  await loginPage.goto();
  await loginPage.login('admin@example.com', 'admin');
  console.log('✅ Logged in successfully');

  // Navigate to settings
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');
  console.log(`📍 Current URL: ${page.url()}`);

  // Get all tab elements
  const tabs = page.locator('[role="tab"]');
  const tabCount = await tabs.count();
  console.log(`📊 Found ${tabCount} tabs:`);

  for (let i = 0; i < tabCount; i++) {
    const tabText = await tabs.nth(i).textContent();
    console.log(`  ${i + 1}. ${tabText}`);
  }

  // Check for user-related content
  const userElements = page.locator('button, a, div').filter({ hasText: /user|User|admin|Admin|manage|Manage/i });
  const userElementCount = await userElements.count();
  console.log(`📊 Found ${userElementCount} user-related elements:`);

  for (let i = 0; i < Math.min(userElementCount, 10); i++) {
    const elementText = await userElements.nth(i).textContent();
    console.log(`  ${i + 1}. ${elementText?.substring(0, 50)}...`);
  }

  // Take screenshot for analysis
  await page.screenshot({ path: 'screenshots/settings-page-investigation.png', fullPage: true });
  console.log('📸 Screenshot saved: screenshots/settings-page-investigation.png');

  // Also investigate Master Data section
  console.log('\n🔍 Investigating Master Data section...');
  await page.goto('/master-data');
  await page.waitForLoadState('networkidle');
  console.log(`📍 Master Data URL: ${page.url()}`);

  const masterDataTabs = page.locator('[role="tab"], nav a, .nav-link');
  const masterDataTabCount = await masterDataTabs.count();
  console.log(`📊 Found ${masterDataTabCount} navigation elements in Master Data:`);

  for (let i = 0; i < masterDataTabCount; i++) {
    const tabText = await masterDataTabs.nth(i).textContent();
    console.log(`  ${i + 1}. ${tabText}`);
  }

  // Look for user-related content in Master Data
  const masterDataUserElements = page.locator('button, a, div').filter({ hasText: /user|User/i });
  const masterDataUserCount = await masterDataUserElements.count();
  console.log(`📊 Found ${masterDataUserCount} user-related elements in Master Data`);

  await page.screenshot({ path: 'screenshots/master-data-investigation.png', fullPage: true });
  console.log('📸 Master Data screenshot saved: screenshots/master-data-investigation.png');
});
