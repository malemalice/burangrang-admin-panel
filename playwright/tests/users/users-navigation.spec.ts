import { test, expect, Page } from '@playwright/test';
import { LoginPage, UsersListPage, UserFormPage, UserDetailPage, UserFormData } from '../page-objects';
import { TEST_CREDENTIALS } from '../constants';

const TEST_USER_DATA: UserFormData = {
  firstName: 'Nav',
  lastName: 'Test',
  email: `nav.test.${Date.now()}@example.com`,
  password: 'password123',
  role: 'User',
  office: 'Headquarters'
};

// Helper function to take screenshot
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `screenshots/${name}.png`,
    fullPage: true
  });
}

// Helper function to setup navigation test
async function setupNavigationTest(page: Page): Promise<{ loginPage: LoginPage; usersListPage: UsersListPage; userFormPage: UserFormPage; userDetailPage: UserDetailPage }> {
  const loginPage = new LoginPage(page);
  const usersListPage = new UsersListPage(page);
  const userFormPage = new UserFormPage(page);
  const userDetailPage = new UserDetailPage(page);

  // Login
  await loginPage.goto();
  await loginPage.login(TEST_CREDENTIALS.ADMIN.email, TEST_CREDENTIALS.ADMIN.password);

  return { loginPage, usersListPage, userFormPage, userDetailPage };
}

test.describe('Users Navigation Tests', () => {
  let loginPage: LoginPage;
  let usersListPage: UsersListPage;
  let userFormPage: UserFormPage;
  let userDetailPage: UserDetailPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    usersListPage = new UsersListPage(page);
    userFormPage = new UserFormPage(page);
    userDetailPage = new UserDetailPage(page);

    // Clear cookies and storage
    await page.context().clearCookies();
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      console.log('Could not clear storage (expected in some cases)');
    }
  });

  test('1. Navigation breadcrumbs and page titles', async ({ page }) => {
    console.log('🧭 Testing navigation breadcrumbs and page titles...');

    // Setup
    await setupNavigationTest(page);
    await usersListPage.goto();

    // Check main users page title
    const usersPageTitle = await page.title();
    console.log(`📄 Users page title: "${usersPageTitle}"`);

    // Navigate to create user
    await usersListPage.clickAddUser();

    // Check create page title
    const createPageTitle = await page.title();
    console.log(`📄 Create page title: "${createPageTitle}"`);

    // Check form title
    const formTitle = await userFormPage.getFormTitle();
    console.log(`📝 Form title: "${formTitle}"`);

    // Go back and check detail page
    await page.goBack();
    await usersListPage.clickUserAction(usersListPage.dataRows.first(), 'view');

    const detailPageTitle = await page.title();
    console.log(`📄 Detail page title: "${detailPageTitle}"`);

    // Check if user name is in detail title
    const userName = await userDetailPage.getUserName();
    console.log(`👤 User name in detail: "${userName}"`);

    await takeScreenshot(page, 'nav-16-page-titles-breadcrumbs');
    console.log('🎉 Navigation breadcrumbs and page titles test completed!');
  });

  test('2. URL structure and routing validation', async ({ page }) => {
    console.log('🧭 Testing URL structure and routing validation...');

    // Setup
    await setupNavigationTest(page);

    // Test various URL patterns
    const urlTests = [
      { url: '/users', expected: 'users list page' },
      { url: '/users/new', expected: 'create user page' },
      { url: '/users/nonexistent', expected: 'handle invalid user ID' }
    ];

    for (const test of urlTests) {
      console.log(`🔗 Testing URL: ${test.url}`);

      await page.goto(test.url);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      console.log(`📍 Result URL: ${currentUrl}`);

      if (test.url === '/users') {
        const isOnUsersPage = await usersListPage.isOnUsersPage();
        expect(isOnUsersPage).toBe(true);
        console.log(`✅ ${test.expected}`);
      } else if (test.url === '/users/new') {
        const isOnCreatePage = await userFormPage.isOnCreatePage();
        expect(isOnCreatePage).toBe(true);
        console.log(`✅ ${test.expected}`);
      } else if (test.url.includes('/nonexistent')) {
        // Should handle gracefully (either redirect or show error)
        console.log(`ℹ️ Handled invalid user ID: ${currentUrl}`);
      }
    }

    await takeScreenshot(page, 'nav-17-url-structure');
    console.log('🎉 URL structure and routing validation test completed!');
  });

  test('3. Basic navigation flow', async ({ page }) => {
    console.log('🧭 Testing basic navigation flow...');

    // Setup
    await setupNavigationTest(page);

    // Test navigation to users list
    await usersListPage.goto();
    const isOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isOnUsersPage).toBe(true);
    console.log('✅ Users list page loads correctly');

    // Test navigation to create user form
    await usersListPage.clickAddUser();
    const isOnCreatePage = await userFormPage.isOnCreatePage();
    expect(isOnCreatePage).toBe(true);
    console.log('✅ Create user form loads correctly');

    // Test form title
    const formTitle = await userFormPage.getFormTitle();
    expect(formTitle).toContain('Create');
    console.log(`✅ Form title displays correctly: "${formTitle}"`);

    await takeScreenshot(page, 'nav-18-basic-navigation');
    console.log('🎉 Basic navigation flow test completed!');
  });
});
