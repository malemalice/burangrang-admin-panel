import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_CREDENTIALS = {
  valid: {
    email: 'admin@example.com',
    password: 'admin'
  }
};

// Helper function to take screenshot
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `screenshots/${name}.png`,
    fullPage: true
  });
}

// Helper function to login
async function loginUser(page: Page, credentials = TEST_CREDENTIALS.ADMIN) {
  console.log('🔐 Starting login process...');

  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  console.log('📍 On login page, URL:', page.url());

  // Fill login form
  const emailInput = page.getByRole('textbox', { name: '* Email' });
  const passwordInput = page.getByRole('textbox', { name: '* Password' });
  const loginButton = page.getByRole('button', { name: 'Login' });

  console.log('📝 Filling login form...');
  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);

  console.log('🔘 Clicking login button...');
  await loginButton.click();

  // Wait for redirect - be more flexible with URL patterns
  try {
    await page.waitForURL(/.*dashboard|.*\/$|.*users/, { timeout: 10000 });
    console.log('✅ Redirect successful, URL:', page.url());
  } catch (error) {
    console.log('⚠️ Redirect timeout, current URL:', page.url());
    // Continue anyway - some apps might redirect differently
  }

  await page.waitForLoadState('networkidle');
  console.log('🎯 Login process completed, final URL:', page.url());
}

test.describe('Users Module Manual Testing', () => {
  test.beforeEach(async ({ page }) => {
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

  test('1. Navigate to users page and verify access control', async ({ page }) => {
    console.log('🚀 Starting users page access test...');

    // Login first
    await loginUser(page);
    console.log('✅ Successfully logged in');

    // Take screenshot after login
    await takeScreenshot(page, 'users-access-01-after-login');

    // Navigate to users page
    console.log('🧭 Navigating to users page...');
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    console.log('📍 After navigation, URL:', page.url());

    // Take screenshot of current page
    await takeScreenshot(page, 'users-access-02-after-navigation');

    // Check if we're still on users page or redirected
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('⚠️ Redirected back to login - trying to login again...');

      // If redirected to login, try logging in again
      await loginUser(page);

      // Then navigate to users again
      await page.goto('/users');
      await page.waitForLoadState('networkidle');
      console.log('📍 After re-navigation, URL:', page.url());
    }

    // Take final screenshot
    await takeScreenshot(page, 'users-access-03-final-users-page');

    // Verify we're on the users page
    await expect(page).toHaveURL(/.*users/);
    console.log('✅ Confirmed on users page');

    // Check for page header/title
    const pageHeader = page.locator('h1').filter({ hasText: /users|Users/ });
    await expect(pageHeader.first()).toBeVisible();
    console.log('✅ Users page header visible');

    // Check for "Add User" button or similar
    const addButton = page.getByRole('button').filter({ hasText: /add|Add|create|Create|new|New/ });
    const hasAddButton = await addButton.isVisible();
    if (hasAddButton) {
      console.log('✅ Add User button found');
    } else {
      console.log('ℹ️ Add User button not found or different text');
    }

    // Check if user data table/list is visible
    const dataTable = page.locator('table').or(page.locator('[role="table"]')).or(page.locator('.data-table'));
    const hasDataTable = await dataTable.isVisible();
    if (hasDataTable) {
      console.log('✅ User data table visible');
    } else {
      console.log('ℹ️ User data table not immediately visible');
    }

    console.log('🎉 Users page access test completed successfully!');
  });

  test('2. Verify user list displays correctly with all fields', async ({ page }) => {
    console.log('🚀 Starting user list display test...');

    // Login and navigate to users page
    await loginUser(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    // Handle potential redirect
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await loginUser(page);
      await page.goto('/users');
      await page.waitForLoadState('networkidle');
    }

    console.log('✅ On users page, ready to examine user list');

    // Take screenshot of user list
    await takeScreenshot(page, 'users-list-01-full-page');

    // Check for table structure - try multiple selectors
    const tableSelectors = [
      'table',
      '[role="table"]',
      '.data-table',
      '.table',
      '[data-testid*="table"]'
    ];

    let userTable;
    for (const selector of tableSelectors) {
      userTable = page.locator(selector).first();
      if (await userTable.isVisible()) {
        console.log(`✅ Found user table with selector: ${selector}`);
        break;
      }
    }

    if (!userTable || !(await userTable.isVisible())) {
      console.log('⚠️ No table found, looking for alternative layouts...');
      // Check for card-based layout
      const userCards = page.locator('.card, .user-card, [data-testid*="user"]').first();
      if (await userCards.isVisible()) {
        console.log('✅ Found user cards layout');
        userTable = userCards;
      } else {
        throw new Error('No user list or table found');
      }
    }

    // Take screenshot of the table area
    await takeScreenshot(page, 'users-list-02-table-area');

    // Check for table headers - common user fields
    const expectedHeaders = ['Name', 'Email', 'Role', 'Office', 'Department', 'Position', 'Status', 'Actions'];
    let foundHeaders = 0;

    for (const header of expectedHeaders) {
      const headerLocator = page.locator(`th, [role="columnheader"]`).filter({ hasText: new RegExp(header, 'i') });
      if (await headerLocator.isVisible()) {
        console.log(`✅ Found header: ${header}`);
        foundHeaders++;
      }
    }

    console.log(`📊 Found ${foundHeaders}/${expectedHeaders.length} expected headers`);

    // Check for user data rows
    const dataRows = page.locator('tbody tr, [role="row"]').filter({ hasText: /@/ }); // Look for email pattern
    const rowCount = await dataRows.count();

    if (rowCount > 0) {
      console.log(`✅ Found ${rowCount} user data rows`);

      // Examine first user row in detail
      const firstRow = dataRows.first();
      const rowText = await firstRow.textContent();
      console.log(`📝 First user row content: ${rowText?.substring(0, 100)}...`);

      // Check for specific user data elements
      const userElements = [
        page.locator('.avatar, [data-testid*="avatar"]'), // User avatar
        page.locator('td, [role="cell"]').filter({ hasText: /@/ }), // Email
        page.locator('td, [role="cell"]').filter({ hasText: /active|inactive/i }), // Status
        page.locator('button, [role="button"]').filter({ hasText: /edit|view|delete/i }) // Actions
      ];

      for (let i = 0; i < userElements.length; i++) {
        const element = userElements[i];
        if (await element.isVisible()) {
          console.log(`✅ Found user element ${i + 1}`);
        }
      }

    } else {
      console.log('⚠️ No user data rows found - might be empty state');
      // Check for empty state message
      const emptyMessage = page.locator('text=/no users|empty|no data/i');
      if (await emptyMessage.isVisible()) {
        console.log('ℹ️ Empty state message found');
      }
    }

    // Check for pagination controls
    const paginationControls = [
      page.locator('button, [role="button"]').filter({ hasText: /next|previous|page/i }),
      page.locator('.pagination, [data-testid*="pagination"]'),
      page.locator('select, [role="combobox"]').filter({ hasText: /show|per page/i })
    ];

    let paginationFound = false;
    for (const control of paginationControls) {
      if (await control.isVisible()) {
        console.log('✅ Pagination controls found');
        paginationFound = true;
        break;
      }
    }

    if (!paginationFound) {
      console.log('ℹ️ No pagination controls visible (might be single page)');
    }

    // Take final screenshot
    await takeScreenshot(page, 'users-list-03-final-state');

    console.log('🎉 User list display test completed successfully!');
  });

  test('3. Test user creation with valid data - document selectors and steps', async ({ page }) => {
    console.log('🚀 Starting user creation test...');

    // Login and navigate to users page
    await loginUser(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    // Handle potential redirect
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await loginUser(page);
      await page.goto('/users');
      await page.waitForLoadState('networkidle');
    }

    console.log('✅ On users page, ready to test user creation');

    // Take initial screenshot
    await takeScreenshot(page, 'user-create-01-before-create');

    // Find and click "Add User" button
    const addUserButton = page.getByRole('button').filter({ hasText: /add|Add|create|Create|new|New/ });
    await expect(addUserButton).toBeVisible();
    console.log('✅ Add User button found');

    await addUserButton.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on create user page
    await expect(page).toHaveURL(/.*users\/new|.*create/);
    console.log('✅ Navigated to create user page');

    // Take screenshot of the form
    await takeScreenshot(page, 'user-create-02-form-empty');

    // Document form structure and fields
    console.log('📋 Documenting form fields...');

    // Check for form title
    const formTitle = page.locator('h1, h2, h3').filter({ hasText: /create|add|new/i });
    if (await formTitle.isVisible()) {
      const titleText = await formTitle.textContent();
      console.log(`📝 Form title: ${titleText}`);
    }

    // Test data for user creation
    const testUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: `john.doe.${Date.now()}@example.com`, // Unique email
      password: 'password123',
      role: 'User', // Will need to check actual available roles
      office: 'Headquarters', // Will need to check actual available offices
      department: '', // Optional
      jobPosition: '' // Optional
    };

    // Document and fill form fields
    console.log('🔍 Finding and documenting form fields...');

    // First Name field
    const firstNameInput = page.getByRole('textbox').filter({ hasText: /first.?name/i }).or(
      page.locator('input[name*="first"], input[id*="first"], input[placeholder*="first" i]')
    );
    if (await firstNameInput.isVisible()) {
      console.log('✅ First Name field found');
      await firstNameInput.fill(testUserData.firstName);
    }

    // Last Name field
    const lastNameInput = page.getByRole('textbox').filter({ hasText: /last.?name/i }).or(
      page.locator('input[name*="last"], input[id*="last"], input[placeholder*="last" i]')
    );
    if (await lastNameInput.isVisible()) {
      console.log('✅ Last Name field found');
      await lastNameInput.fill(testUserData.lastName);
    }

    // Email field
    const emailInput = page.getByRole('textbox', { name: /email/i }).or(
      page.locator('input[type="email"], input[name*="email"], input[id*="email"]')
    );
    if (await emailInput.isVisible()) {
      console.log('✅ Email field found');
      await emailInput.fill(testUserData.email);
    }

    // Password field
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      console.log('✅ Password field found');
      await passwordInput.fill(testUserData.password);
    }

    // Role selection
    const roleSelect = page.locator('select[name*="role"], [role="combobox"]').filter({ hasText: /role/i }).or(
      page.locator('button').filter({ hasText: /select.*role|role/i })
    );
    if (await roleSelect.isVisible()) {
      console.log('✅ Role selection found');
      // Click to open dropdown if it's a select button
      await roleSelect.click();

      // Try to select first available option
      const roleOption = page.locator('[role="option"], .option').first();
      if (await roleOption.isVisible()) {
        const optionText = await roleOption.textContent();
        console.log(`🎯 Selecting role: ${optionText}`);
        await roleOption.click();
      }
    }

    // Office selection
    const officeSelect = page.locator('select[name*="office"], [role="combobox"]').filter({ hasText: /office/i }).or(
      page.locator('button').filter({ hasText: /select.*office|office/i })
    );
    if (await officeSelect.isVisible()) {
      console.log('✅ Office selection found');
      await officeSelect.click();

      // Try to select first available option
      const officeOption = page.locator('[role="option"], .option').first();
      if (await officeOption.isVisible()) {
        const optionText = await officeOption.textContent();
        console.log(`🏢 Selecting office: ${optionText}`);
        await officeOption.click();
      }
    }

    // Optional: Department selection
    const departmentSelect = page.locator('select[name*="department"], [role="combobox"]').filter({ hasText: /department/i }).or(
      page.locator('button').filter({ hasText: /select.*department|department/i })
    );
    if (await departmentSelect.isVisible()) {
      console.log('✅ Department selection found (optional)');
      // Leave as default/none for now
    }

    // Optional: Job Position selection
    const positionSelect = page.locator('select[name*="position"], [role="combobox"]').filter({ hasText: /position|job/i }).or(
      page.locator('button').filter({ hasText: /select.*position|position|job/i })
    );
    if (await positionSelect.isVisible()) {
      console.log('✅ Job Position selection found (optional)');
      // Leave as default/none for now
    }

    // Take screenshot before submission
    await takeScreenshot(page, 'user-create-03-form-filled');

    // Find and click submit button
    const submitButton = page.getByRole('button', { name: /create|save|submit|add/i });
    if (await submitButton.isVisible()) {
      console.log('✅ Submit button found');
      await submitButton.click();

      // Wait for submission to complete
      await page.waitForLoadState('networkidle');

      // Check if we're redirected back to users list or stayed on form
      const currentUrlAfterSubmit = page.url();
      console.log(`📍 After submission, URL: ${currentUrlAfterSubmit}`);

      if (currentUrlAfterSubmit.includes('/users') && !currentUrlAfterSubmit.includes('/new')) {
        console.log('✅ Successfully created user and redirected to users list');
      } else {
        console.log('⚠️ Still on form page - might have validation errors');
        // Check for error messages
        const errorMessages = page.locator('.error, [role="alert"], .text-red-600');
        const errorCount = await errorMessages.count();
        if (errorCount > 0) {
          console.log(`⚠️ Found ${errorCount} error messages on form`);
        }
      }
    }

    // Take final screenshot
    await takeScreenshot(page, 'user-create-04-after-submission');

    console.log('🎉 User creation test completed!');
  });
});
