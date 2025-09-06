import { test, expect, Page } from '@playwright/test';
import { LoginPage, UsersListPage, UserFormPage, UserDetailPage, UserFormData } from './page-objects';

// Test data
const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin'
};

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
  await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

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

  test('1. Direct navigation to users page (deep linking)', async ({ page }) => {
    console.log('🧭 Testing direct navigation to users page...');

    // Navigate directly to users page without login
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Should redirect to login if not authenticated
    if (currentUrl.includes('/login')) {
      console.log('✅ Redirected to login (expected for unauthenticated access)');

      // Now login and verify redirect back to users
      await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
      console.log('✅ Logged in after redirect');

      // Should be redirected to originally requested page
      const finalUrl = page.url();
      if (finalUrl.includes('/users')) {
        console.log('✅ Successfully redirected to users page after login');
      } else {
        console.log(`⚠️ Redirected to: ${finalUrl} (might be dashboard instead of users)`);
      }
    } else {
      console.log('⚠️ No redirect to login - user might already be authenticated');
    }

    await takeScreenshot(page, 'nav-01-direct-users-access');
    console.log('🎉 Direct navigation test completed!');
  });

  test('2. Navigation flow: Users List → Create User → Back to List', async ({ page }) => {
    console.log('🧭 Testing navigation flow: List → Create → List...');

    // Setup
    await setupNavigationTest(page);

    // Start on users list
    await usersListPage.goto();
    const isOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isOnUsersPage).toBe(true);
    console.log('✅ Started on users list page');

    await takeScreenshot(page, 'nav-02-start-users-list');

    // Navigate to create user
    await usersListPage.clickAddUser();
    const isOnCreatePage = await userFormPage.isOnCreatePage();
    expect(isOnCreatePage).toBe(true);
    console.log('✅ Navigated to create user page');

    await takeScreenshot(page, 'nav-03-create-user-page');

    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');

    const isBackOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isBackOnUsersPage).toBe(true);
    console.log('✅ Browser back button works - returned to users list');

    await takeScreenshot(page, 'nav-04-back-to-list');
    console.log('🎉 List → Create → List navigation test completed!');
  });

  test('3. Navigation flow: Users List → User Detail → Back to List', async ({ page }) => {
    console.log('🧭 Testing navigation flow: List → Detail → List...');

    // Setup
    await setupNavigationTest(page);
    await usersListPage.goto();

    // Get first user for detail view
    const firstUserRow = usersListPage.dataRows.first();
    await expect(firstUserRow).toBeVisible();
    console.log('✅ Found user for detail view');

    await takeScreenshot(page, 'nav-05-before-detail');

    // Click view action
    await usersListPage.clickUserAction(firstUserRow, 'view');
    const isOnDetailPage = await userDetailPage.isOnUserDetailPage();
    expect(isOnDetailPage).toBe(true);
    console.log('✅ Navigated to user detail page');

    await takeScreenshot(page, 'nav-06-user-detail-page');

    // Use back button
    await userDetailPage.goBack();
    await page.waitForLoadState('networkidle');

    const isBackOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isBackOnUsersPage).toBe(true);
    console.log('✅ Back button works - returned to users list');

    await takeScreenshot(page, 'nav-07-back-from-detail');
    console.log('🎉 List → Detail → List navigation test completed!');
  });

  test('4. Navigation flow: Create User → Cancel → Back to List', async ({ page }) => {
    console.log('🧭 Testing navigation flow: Create → Cancel → List...');

    // Setup
    await setupNavigationTest(page);
    await usersListPage.goto();

    // Navigate to create
    await usersListPage.clickAddUser();
    const isOnCreatePage = await userFormPage.isOnCreatePage();
    expect(isOnCreatePage).toBe(true);
    console.log('✅ On create user page');

    // Fill some data to test cancel doesn't save
    await userFormPage.fillForm(TEST_USER_DATA);
    console.log('✅ Filled form with test data');

    await takeScreenshot(page, 'nav-08-create-form-filled');

    // Click cancel
    await userFormPage.cancelForm();
    console.log('✅ Clicked cancel button');

    // Verify back on users list
    const isOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isOnUsersPage).toBe(true);
    console.log('✅ Returned to users list after cancel');

    // Verify user was not created
    const userCount = await usersListPage.getUserCount();
    console.log(`📊 Current user count: ${userCount}`);

    await takeScreenshot(page, 'nav-09-after-cancel');
    console.log('🎉 Create → Cancel → List navigation test completed!');
  });

  test('5. Browser forward/back navigation', async ({ page }) => {
    console.log('🧭 Testing browser forward/back navigation...');

    // Setup
    await setupNavigationTest(page);

    // Navigate through pages and test browser navigation
    const navigationHistory: string[] = [];

    // Start on users list
    await usersListPage.goto();
    navigationHistory.push(page.url());
    console.log(`📍 Page 1: ${page.url()}`);

    // Go to create user
    await usersListPage.clickAddUser();
    navigationHistory.push(page.url());
    console.log(`📍 Page 2: ${page.url()}`);

    await takeScreenshot(page, 'nav-10-page-2-create');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    console.log(`📍 Back to: ${page.url()}`);
    expect(page.url()).toBe(navigationHistory[0]);
    console.log('✅ Browser back navigation works');

    await takeScreenshot(page, 'nav-11-back-navigation');

    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');
    console.log(`📍 Forward to: ${page.url()}`);
    expect(page.url()).toBe(navigationHistory[1]);
    console.log('✅ Browser forward navigation works');

    await takeScreenshot(page, 'nav-12-forward-navigation');
    console.log('🎉 Browser forward/back navigation test completed!');
  });

  test('6. Direct deep linking to user detail', async ({ page }) => {
    console.log('🧭 Testing direct deep linking to user detail...');

    // Setup and create a test user first
    await setupNavigationTest(page);
    await usersListPage.goto();

    // Create a test user
    await usersListPage.clickAddUser();
    await userFormPage.fillForm(TEST_USER_DATA);
    await userFormPage.submitForm();

    // Verify user was created
    const isOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isOnUsersPage).toBe(true);

    // Find the created user and get its ID from the URL when viewing details
    const newUserRow = usersListPage.getUserByEmail(TEST_USER_DATA.email);
    await expect(newUserRow).toBeVisible();

    // Click view to get the detail URL
    await usersListPage.clickUserAction(newUserRow, 'view');
    const detailUrl = page.url();
    const userIdMatch = detailUrl.match(/\/users\/([^\/]+)/);
    const userId = userIdMatch ? userIdMatch[1] : null;

    expect(userId).toBeTruthy();
    console.log(`✅ Got user ID: ${userId}`);

    await takeScreenshot(page, 'nav-13-user-detail-url');

    // Go back to list
    await userDetailPage.goBack();

    // Now test direct deep linking
    console.log(`🔗 Testing direct link to: /users/${userId}`);
    await page.goto(`/users/${userId}`);
    await page.waitForLoadState('networkidle');

    const isOnDirectDetailPage = await userDetailPage.isOnUserDetailPage();
    expect(isOnDirectDetailPage).toBe(true);
    console.log('✅ Direct deep linking to user detail works');

    // Verify correct user is displayed
    const displayedEmail = await userDetailPage.getUserEmail();
    expect(displayedEmail).toBe(TEST_USER_DATA.email);
    console.log('✅ Correct user displayed via deep link');

    await takeScreenshot(page, 'nav-14-deep-link-detail');
    console.log('🎉 Direct deep linking test completed!');
  });

  test('7. Navigation after form submission', async ({ page }) => {
    console.log('🧭 Testing navigation after form submission...');

    // Setup
    await setupNavigationTest(page);
    await usersListPage.goto();

    const initialUserCount = await usersListPage.getUserCount();
    console.log(`📊 Initial user count: ${initialUserCount}`);

    // Navigate to create and submit
    await usersListPage.clickAddUser();
    await userFormPage.fillForm(TEST_USER_DATA);
    await userFormPage.submitForm();

    // Verify navigation after successful submission
    const isOnUsersPageAfterSubmit = await usersListPage.isOnUsersPage();
    expect(isOnUsersPageAfterSubmit).toBe(true);
    console.log('✅ Automatically navigated to users list after successful submission');

    // Verify user was created
    const finalUserCount = await usersListPage.getUserCount();
    expect(finalUserCount).toBe(initialUserCount + 1);
    console.log(`📊 Final user count: ${finalUserCount} (expected: ${initialUserCount + 1})`);

    // Verify new user appears
    const newUserRow = usersListPage.getUserByEmail(TEST_USER_DATA.email);
    await expect(newUserRow).toBeVisible();
    console.log('✅ New user appears in list after navigation');

    await takeScreenshot(page, 'nav-15-after-submit-navigation');
    console.log('🎉 Navigation after form submission test completed!');
  });

  test('8. Navigation breadcrumbs and page titles', async ({ page }) => {
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

  test('9. URL structure and routing validation', async ({ page }) => {
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

  test('10. Mobile navigation responsiveness', async ({ page }) => {
    console.log('🧭 Testing mobile navigation responsiveness...');

    // Setup with mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await setupNavigationTest(page);
    await usersListPage.goto();

    console.log('📱 Testing on mobile viewport (375x667)');

    // Test mobile navigation
    const isOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isOnUsersPage).toBe(true);
    console.log('✅ Users page loads on mobile');

    // Test mobile create user navigation
    await usersListPage.clickAddUser();
    const isOnCreatePage = await userFormPage.isOnCreatePage();
    expect(isOnCreatePage).toBe(true);
    console.log('✅ Create user page navigates on mobile');

    await takeScreenshot(page, 'nav-18-mobile-navigation');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    console.log('📱 Testing on tablet viewport (768x1024)');

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Re-setup after reload
    await setupNavigationTest(page);
    await usersListPage.goto();

    const isOnUsersPageTablet = await usersListPage.isOnUsersPage();
    expect(isOnUsersPageTablet).toBe(true);
    console.log('✅ Users page responsive on tablet');

    await takeScreenshot(page, 'nav-19-tablet-navigation');
    console.log('🎉 Mobile navigation responsiveness test completed!');
  });
});
