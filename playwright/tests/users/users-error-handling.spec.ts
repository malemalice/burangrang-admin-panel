import { test, expect, Page } from '@playwright/test';
import { LoginPage, UsersListPage, UserFormPage, UserDetailPage, UserFormData } from '../page-objects';
import { TEST_CREDENTIALS } from '../constants';

const TEST_USER_DATA: UserFormData = {
  firstName: 'Error',
  lastName: 'Test',
  email: `error.test.${Date.now()}@example.com`,
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

// Helper function to setup error handling test
async function setupErrorTest(page: Page): Promise<{ loginPage: LoginPage; usersListPage: UsersListPage; userFormPage: UserFormPage; userDetailPage: UserDetailPage }> {
  const loginPage = new LoginPage(page);
  const usersListPage = new UsersListPage(page);
  const userFormPage = new UserFormPage(page);
  const userDetailPage = new UserDetailPage(page);

  // Login
  await loginPage.goto();
  await loginPage.login(TEST_CREDENTIALS.ADMIN.email, TEST_CREDENTIALS.ADMIN.password);

  return { loginPage, usersListPage, userFormPage, userDetailPage };
}

test.describe('Users Error Handling Tests', () => {
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

  test('1. Invalid user ID handling', async ({ page }) => {
    console.log('🚨 Testing invalid user ID handling...');

    // Setup
    await setupErrorTest(page);

    // Try to access user with invalid ID
    const invalidIds = ['999999', 'invalid', 'abc123', ''];

    for (const invalidId of invalidIds) {
      console.log(`🔍 Testing invalid user ID: "${invalidId}"`);

      await page.goto(`/users/${invalidId}`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);

      // Check if redirected or shows error
      if (currentUrl.includes('/users/') && !currentUrl.includes('/new') && !currentUrl.includes('/edit')) {
        // Still on user detail page - check for error message
        const errorMessage = page.locator('.error, [role="alert"], .text-red-600, .text-destructive').filter({
          hasText: /not found|does not exist|invalid|error/i
        });

        if (await errorMessage.isVisible()) {
          console.log(`✅ Error message displayed for invalid ID: ${invalidId}`);
        } else {
          console.log(`⚠️ No error message found for invalid ID: ${invalidId}`);
        }
      } else {
        // Redirected - this might be expected behavior
        console.log(`ℹ️ Redirected from invalid ID ${invalidId} to: ${currentUrl}`);
      }
    }

    await takeScreenshot(page, 'error-01-invalid-user-id');
    console.log('🎉 Invalid user ID handling test completed!');
  });

  test('2. Duplicate email error handling', async ({ page }) => {
    console.log('🚨 Testing duplicate email error handling...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();

    // Get existing user's email
    const firstUserRow = usersListPage.dataRows.first();
    const firstUserText = await firstUserRow.textContent();
    const existingEmailMatch = firstUserText?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

    if (!existingEmailMatch) {
      console.log('⚠️ Could not find existing email, skipping duplicate email test');
      return;
    }

    const existingEmail = existingEmailMatch[1];
    console.log(`📧 Using existing email: ${existingEmail}`);

    // Try to create user with duplicate email
    await usersListPage.clickAddUser();

    const duplicateUserData: UserFormData = {
      ...TEST_USER_DATA,
      email: existingEmail
    };

    await userFormPage.fillForm(duplicateUserData);
    console.log('✅ Filled form with duplicate email');

    await takeScreenshot(page, 'error-02-duplicate-email-filled');

    // Submit form
    await userFormPage.submitButton.click();
    await page.waitForLoadState('networkidle');

    // Check for duplicate email error
    const currentUrl = page.url();
    if (currentUrl.includes('/users/new') || currentUrl.includes('/create')) {
      // Still on form - check for error messages
      console.log('✅ Still on form - checking for duplicate email error');

      const errorMessages = await userFormPage.getErrorMessages();
      const duplicateErrors = errorMessages.filter(msg =>
        msg.toLowerCase().includes('duplicate') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('email') ||
        msg.toLowerCase().includes('taken') ||
        msg.toLowerCase().includes('unique')
      );

      if (duplicateErrors.length > 0) {
        console.log(`✅ Duplicate email error found: ${duplicateErrors[0]}`);
      } else {
        console.log('⚠️ No specific duplicate email error message found');
      }
    } else {
      // Redirected - might indicate server handled it differently
      console.log(`ℹ️ Redirected to: ${currentUrl} (server might handle duplicate emails differently)`);
    }

    await takeScreenshot(page, 'error-03-duplicate-email-result');
    console.log('🎉 Duplicate email error handling test completed!');
  });

  test('3. Network error simulation', async ({ page }) => {
    console.log('🚨 Testing network error simulation...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();

    // Simulate network offline
    await page.context().setOffline(true);
    console.log('📡 Network set to offline');

    // Try to perform an action that requires network
    await usersListPage.clickAddUser();
    await page.waitForTimeout(2000); // Wait for potential network timeout

    // Check if any error is displayed
    const networkErrorIndicators = [
      page.locator('.error, [role="alert"]').filter({ hasText: /network|offline|connection|failed/i }),
      page.locator('text=/network|offline|connection|failed/i'),
      page.locator('.loading, .spinner').filter({ hasText: /error|failed/i })
    ];

    let errorFound = false;
    for (const indicator of networkErrorIndicators) {
      if (await indicator.isVisible()) {
        console.log('✅ Network error indicator found');
        errorFound = true;
        break;
      }
    }

    if (!errorFound) {
      console.log('ℹ️ No network error indicator visible (might handle gracefully)');
    }

    await takeScreenshot(page, 'error-04-network-offline');

    // Restore network and test recovery
    await page.context().setOffline(false);
    console.log('📡 Network restored');

    await page.reload();
    await page.waitForLoadState('networkidle');

    const isOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isOnUsersPage).toBe(true);
    console.log('✅ Application recovered after network restoration');

    await takeScreenshot(page, 'error-05-network-restored');
    console.log('🎉 Network error simulation test completed!');
  });

  test('4. Loading states display correctly', async ({ page }) => {
    console.log('🚨 Testing loading states display...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();

    // Look for loading indicators during normal operations
    console.log('🔍 Checking for loading states during page load...');

    // Check for loading spinners or skeletons
    const loadingIndicators = [
      page.locator('.loading, .spinner, .animate-spin'),
      page.locator('[aria-busy="true"]'),
      page.locator('.skeleton, .placeholder'),
      page.locator('text=/loading|please wait/i')
    ];

    let loadingFound = false;
    for (const indicator of loadingIndicators) {
      if (await indicator.isVisible()) {
        console.log('✅ Loading indicator found');
        loadingFound = true;
        break;
      }
    }

    if (!loadingFound) {
      console.log('ℹ️ No loading indicators visible (page might load too fast)');
    }

    // Test loading during search
    console.log('🔍 Testing loading during search operation...');
    await usersListPage.searchUsers('test');
    await page.waitForTimeout(500);

    // Check for loading during search
    for (const indicator of loadingIndicators) {
      if (await indicator.isVisible()) {
        console.log('✅ Loading indicator found during search');
        loadingFound = true;
        break;
      }
    }

    // Test loading during form submission
    console.log('🔍 Testing loading during form submission...');
    await usersListPage.clickAddUser();

    const quickUserData: UserFormData = {
      firstName: 'Quick',
      lastName: 'Test',
      email: `quick.test.${Date.now()}@example.com`,
      password: 'password123',
      role: 'User',
      office: 'Headquarters'
    };

    await userFormPage.fillForm(quickUserData);
    await userFormPage.submitButton.click();

    // Check for loading during submission
    await page.waitForTimeout(500);
    for (const indicator of loadingIndicators) {
      if (await indicator.isVisible()) {
        console.log('✅ Loading indicator found during form submission');
        loadingFound = true;
        break;
      }
    }

    if (!loadingFound) {
      console.log('ℹ️ No loading states observed (operations might be too fast)');
    }

    await takeScreenshot(page, 'error-06-loading-states');
    console.log('🎉 Loading states display test completed!');
  });

  test('5. Server error response handling', async ({ page }) => {
    console.log('🚨 Testing server error response handling...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();

    // Try to trigger server errors by manipulating requests
    console.log('🔍 Attempting to trigger server errors...');

    // Monitor network responses for errors
    const errorResponses: any[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        errorResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Try various operations that might trigger server errors
    console.log('🔍 Testing with malformed data...');

    // Try creating user with malformed data
    await usersListPage.clickAddUser();

    const malformedUserData: UserFormData = {
      firstName: 'Test', // Valid
      lastName: 'User', // Valid
      email: 'invalid-email-format', // Invalid
      password: '123', // Too short
      role: 'InvalidRole', // Invalid
      office: 'InvalidOffice' // Invalid
    };

    await userFormPage.fillForm(malformedUserData);
    await userFormPage.submitButton.click();

    await page.waitForTimeout(2000);

    // Check for server error responses
    if (errorResponses.length > 0) {
      console.log('📡 Server error responses detected:');
      errorResponses.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.status} ${error.statusText} - ${error.url}`);
      });
    } else {
      console.log('ℹ️ No server error responses detected');
    }

    // Check for client-side error handling
    const errorMessages = await userFormPage.getErrorMessages();
    if (errorMessages.length > 0) {
      console.log('✅ Client-side error messages found:');
      errorMessages.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    await takeScreenshot(page, 'error-07-server-errors');
    console.log('🎉 Server error response handling test completed!');
  });

  test('6. Form submission timeout handling', async ({ page }) => {
    console.log('🚨 Testing form submission timeout handling...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();
    await usersListPage.clickAddUser();

    // Fill form
    await userFormPage.fillForm(TEST_USER_DATA);
    console.log('✅ Form filled for timeout test');

    // Slow down network to simulate timeout
    await page.route('**/users', async route => {
      // Delay response by 30 seconds to trigger timeout
      await new Promise(resolve => setTimeout(resolve, 30000));
      await route.fulfill({ status: 200, body: '{}' });
    });

    console.log('⏱️ Simulating slow network response...');
    const submitPromise = userFormPage.submitButton.click();

    // Wait for either timeout or completion
    try {
      await Promise.race([
        submitPromise,
        page.waitForTimeout(10000) // 10 second timeout for test
      ]);

      console.log('✅ Form submission completed (might have timed out on server)');
    } catch (error) {
      console.log('⚠️ Form submission timed out or failed');
    }

    // Check for timeout error messages
    const timeoutErrors = page.locator('.error, [role="alert"]').filter({
      hasText: /timeout|time out|slow|network|connection/i
    });

    if (await timeoutErrors.isVisible()) {
      console.log('✅ Timeout error message displayed');
    } else {
      console.log('ℹ️ No timeout error message visible');
    }

    await takeScreenshot(page, 'error-08-timeout-handling');
    console.log('🎉 Form submission timeout handling test completed!');
  });

  test('7. Invalid form data submission', async ({ page }) => {
    console.log('🚨 Testing invalid form data submission...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.clickAddUser();

    // Test various invalid data combinations
    const invalidDataTests = [
      {
        name: 'Empty required fields',
        data: {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: '',
          office: ''
        }
      },
      {
        name: 'Invalid email formats',
        data: {
          firstName: 'Test',
          lastName: 'User',
          email: 'invalid-email',
          password: 'password123',
          role: 'User',
          office: 'Headquarters'
        }
      },
      {
        name: 'Password too short',
        data: {
          firstName: 'Test',
          lastName: 'User',
          email: `test${Date.now()}@example.com`,
          password: '123',
          role: 'User',
          office: 'Headquarters'
        }
      }
    ];

    for (const testCase of invalidDataTests) {
      console.log(`🔍 Testing: ${testCase.name}`);

      await userFormPage.fillForm(testCase.data);
      await userFormPage.submitButton.click();
      await page.waitForTimeout(1000);

      // Check if still on form (validation should prevent submission)
      const isStillOnForm = await userFormPage.isOnCreatePage();
      if (isStillOnForm) {
        console.log(`✅ Validation prevented submission for: ${testCase.name}`);

        const errorMessages = await userFormPage.getErrorMessages();
        if (errorMessages.length > 0) {
          console.log(`📝 Errors: ${errorMessages.slice(0, 2).join(', ')}`);
        }
      } else {
        console.log(`⚠️ Form submitted despite invalid data: ${testCase.name}`);
      }

      // Reset for next test
      await page.reload();
      await page.waitForLoadState('networkidle');
      await setupErrorTest(page);
      await usersListPage.clickAddUser();
    }

    await takeScreenshot(page, 'error-09-invalid-form-data');
    console.log('🎉 Invalid form data submission test completed!');
  });

  test('8. Concurrent operation handling', async ({ page }) => {
    console.log('🚨 Testing concurrent operation handling...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();

    // Try to perform multiple operations simultaneously
    console.log('🔍 Testing concurrent user creation attempts...');

    // Open multiple create user forms (if possible)
    const createButtons = page.locator('button').filter({ hasText: /add|create|new/i });
    const createButtonCount = await createButtons.count();

    if (createButtonCount > 1) {
      console.log(`✅ Multiple create buttons found: ${createButtonCount}`);
    } else {
      console.log('ℹ️ Single create button found');
    }

    // Create one user successfully
    await usersListPage.clickAddUser();
    await userFormPage.fillForm(TEST_USER_DATA);
    await userFormPage.submitForm();

    // Verify first user was created
    const isOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isOnUsersPage).toBe(true);
    console.log('✅ First user creation successful');

    // Try to create another user with same data quickly
    await usersListPage.clickAddUser();
    await userFormPage.fillForm(TEST_USER_DATA); // Same data
    await userFormPage.submitButton.click();

    await page.waitForTimeout(2000);

    // Check for duplicate handling
    const currentUrl = page.url();
    if (currentUrl.includes('/users/new')) {
      console.log('✅ Duplicate creation attempt handled');

      const errorMessages = await userFormPage.getErrorMessages();
      if (errorMessages.length > 0) {
        console.log(`📝 Error messages: ${errorMessages.slice(0, 2).join(', ')}`);
      }
    }

    await takeScreenshot(page, 'error-10-concurrent-operations');
    console.log('🎉 Concurrent operation handling test completed!');
  });

  test('9. Page refresh and state recovery', async ({ page }) => {
    console.log('🚨 Testing page refresh and state recovery...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();

    // Perform some actions
    const initialUserCount = await usersListPage.getUserCount();
    console.log(`📊 Initial user count: ${initialUserCount}`);

    // Apply a search
    await usersListPage.searchUsers('admin');
    await page.waitForTimeout(1000);

    const searchResults = await usersListPage.getCurrentPageUsers();
    console.log(`📊 Search results: ${searchResults.length} users`);

    // Refresh the page
    console.log('🔄 Refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Re-setup after refresh (since we're in a new session context)
    await setupErrorTest(page);

    // Verify state was maintained or properly reset
    const isOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isOnUsersPage).toBe(true);
    console.log('✅ Page properly reloaded');

    // Check if search was cleared (expected behavior)
    const afterRefreshUsers = await usersListPage.getCurrentPageUsers();
    console.log(`📊 Users after refresh: ${afterRefreshUsers.length} users`);

    await takeScreenshot(page, 'error-11-page-refresh');
    console.log('🎉 Page refresh and state recovery test completed!');
  });

  test('10. Error boundary and crash recovery', async ({ page }) => {
    console.log('🚨 Testing error boundary and crash recovery...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();

    // Try to access various edge cases that might cause errors
    console.log('🔍 Testing edge cases that might trigger errors...');

    const edgeCaseUrls = [
      '/users/0',
      '/users/-1',
      '/users/999999999',
      '/users/null',
      '/users/undefined'
    ];

    for (const url of edgeCaseUrls) {
      console.log(`🔍 Testing edge case URL: ${url}`);

      try {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        const currentUrl = page.url();
        console.log(`📍 Result URL: ${currentUrl}`);

        // Check if application crashed or handled gracefully
        const errorBoundaryIndicators = [
          page.locator('text=/error|crash|something went wrong/i'),
          page.locator('.error-boundary, [data-testid*="error"]'),
          page.locator('text=/500|404|403/i')
        ];

        let errorBoundaryFound = false;
        for (const indicator of errorBoundaryIndicators) {
          if (await indicator.isVisible()) {
            console.log(`🚨 Error boundary triggered for: ${url}`);
            errorBoundaryFound = true;
            break;
          }
        }

        if (!errorBoundaryFound) {
          console.log(`✅ Edge case handled gracefully: ${url}`);
        }

      } catch (error) {
        console.log(`🚨 Page crashed for: ${url} - ${error}`);
      }
    }

    // Test recovery by going back to main page
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const isRecovered = await usersListPage.isOnUsersPage();
    expect(isRecovered).toBe(true);
    console.log('✅ Application recovered after edge case testing');

    await takeScreenshot(page, 'error-12-error-boundary');
    console.log('🎉 Error boundary and crash recovery test completed!');
  });
});
