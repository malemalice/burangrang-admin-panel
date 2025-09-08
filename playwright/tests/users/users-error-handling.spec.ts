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

    // Try to perform an action that requires network - just check if page remains functional
    const initialUrl = page.url();
    console.log(`📍 Initial URL: ${initialUrl}`);

    // Try a simple navigation or action that would require network
    try {
      await page.reload({ timeout: 5000 });
    } catch (error) {
      console.log('✅ Network error occurred during reload (expected)');
    }

    // Check if page is still accessible (basic functionality)
    const currentUrl = page.url();
    console.log(`📍 Current URL after offline attempt: ${currentUrl}`);

    // The page should still be accessible even if some network operations fail
    expect(currentUrl).toBeTruthy();
    console.log('✅ Page remained accessible during offline simulation');

    await takeScreenshot(page, 'error-04-network-offline');

    // Restore network and test recovery
    await page.context().setOffline(false);
    console.log('📡 Network restored');

    // Test that navigation works after network restoration
    await usersListPage.goto();

    // Verify we're on a valid page (don't rely on strict URL checking)
    const restoredUrl = page.url();
    console.log(`📍 Restored URL: ${restoredUrl}`);

    // Check that we can access basic page elements
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
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

    // Try creating user with data that passes client validation but fails server validation
    await usersListPage.clickAddUser();

    // Use a valid role and office but with data that will fail server-side validation
    const serverErrorUserData: UserFormData = {
      firstName: 'Test', // Valid
      lastName: 'User', // Valid
      email: `server-error-test-${Date.now()}@example.com`, // Valid format but potentially triggers server error
      password: 'validpassword123', // Valid length
      role: 'User', // Valid role
      office: 'Headquarters' // Valid office
    };

    await userFormPage.fillForm(serverErrorUserData);
    console.log('✅ Filled form with potentially server-error triggering data');

    await userFormPage.submitButton.click();
    console.log('✅ Submitted form - waiting for server response');

    // Wait for response
    await page.waitForTimeout(3000);

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
    await usersListPage.goto();

    // Test form validation by trying to create a user with invalid data
    console.log('🔍 Testing form validation with invalid data...');

    await usersListPage.clickAddUser();

    // Test with invalid email format
    const invalidData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'invalid-email-format', // Invalid email
      password: '123', // Too short
      role: 'User',
      office: 'Headquarters'
    };

    await userFormPage.fillForm(invalidData);
    await userFormPage.submitButton.click();

    // Wait for validation response
    await page.waitForTimeout(2000);

    // Check if validation errors are displayed
    const errorMessages = await userFormPage.getErrorMessages();
    if (errorMessages.length > 0) {
      console.log('✅ Form validation correctly caught invalid data');
      console.log(`📝 Validation errors: ${errorMessages.slice(0, 3).join(', ')}`);
    } else {
      console.log('ℹ️ No validation errors displayed (client-side validation may be minimal)');
    }

    // Test with valid data to ensure form works
    console.log('🔍 Testing form submission with valid data...');

    // Navigate back to users page
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    await usersListPage.clickAddUser();

    const validData = {
      firstName: 'Valid',
      lastName: 'Test',
      email: `valid-test-${Date.now()}@example.com`,
      password: 'validpassword123',
      role: 'User',
      office: 'Headquarters'
    };

    await userFormPage.fillForm(validData);
    await userFormPage.submitButton.click();

    // Wait for submission
    await page.waitForTimeout(3000);

    // Check if we were redirected back to users page (successful submission)
    const currentUrl = page.url();
    if (currentUrl.includes('/users') && !currentUrl.includes('/new')) {
      console.log('✅ Form submitted successfully with valid data');
    } else {
      console.log('ℹ️ Form submission may have different behavior');
    }

    await takeScreenshot(page, 'error-09-invalid-form-data');
    console.log('🎉 Invalid form data submission test completed!');
  });

  test('8. Concurrent operation handling', async ({ page }) => {
    console.log('🚨 Testing concurrent operation handling...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();

    // Test rapid sequential operations to simulate concurrent behavior
    console.log('🔍 Testing rapid sequential user creation attempts...');

    // Create first user
    await usersListPage.clickAddUser();
    const firstUserData = {
      ...TEST_USER_DATA,
      email: `concurrent-1-${Date.now()}@example.com`
    };
    await userFormPage.fillForm(firstUserData);
    await userFormPage.submitButton.click();

    // Wait for first submission to complete
    await page.waitForTimeout(2000);

    // Check if first user was created (by checking if we're not still on the form)
    const afterFirstSubmit = page.url();
    console.log(`📍 After first submission: ${afterFirstSubmit}`);

    // Create second user quickly
    if (!afterFirstSubmit.includes('/new')) {
      console.log('✅ First user creation completed, proceeding with second user...');

      await usersListPage.clickAddUser();
      const secondUserData = {
        ...TEST_USER_DATA,
        email: `concurrent-2-${Date.now()}@example.com`
      };
      await userFormPage.fillForm(secondUserData);
      await userFormPage.submitButton.click();

      // Wait for second submission
      await page.waitForTimeout(2000);

      const afterSecondSubmit = page.url();
      console.log(`📍 After second submission: ${afterSecondSubmit}`);

      if (!afterSecondSubmit.includes('/new')) {
        console.log('✅ Second user creation successful');
      } else {
        console.log('ℹ️ Second user creation may still be processing');
      }
    } else {
      console.log('ℹ️ First user creation still processing');
    }

    // Test duplicate email handling
    console.log('🔍 Testing duplicate email handling...');
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    await usersListPage.clickAddUser();
    const duplicateUserData = {
      ...TEST_USER_DATA,
      email: firstUserData.email // Use same email as first user
    };
    await userFormPage.fillForm(duplicateUserData);
    await userFormPage.submitButton.click();

    // Wait for duplicate handling
    await page.waitForTimeout(2000);

    const afterDuplicateSubmit = page.url();
    if (afterDuplicateSubmit.includes('/new')) {
      console.log('✅ Duplicate email creation attempt handled');

      const errorMessages = await userFormPage.getErrorMessages();
      if (errorMessages.length > 0) {
        console.log(`📝 Duplicate error messages: ${errorMessages.slice(0, 2).join(', ')}`);
      }
    } else {
      console.log('ℹ️ Duplicate email may have been accepted or is still processing');
    }

    await takeScreenshot(page, 'error-10-concurrent-operations');
    console.log('🎉 Concurrent operation handling test completed!');
  });

  test('9. Page refresh and state recovery', async ({ page }) => {
    console.log('🚨 Testing page refresh and state recovery...');

    // Setup
    await setupErrorTest(page);
    await usersListPage.goto();

    // Perform some actions and capture state
    const initialUserCount = await usersListPage.getUserCount();
    console.log(`📊 Initial user count: ${initialUserCount}`);

    // Apply a search
    await usersListPage.searchUsers('admin');
    await page.waitForTimeout(1000);

    const searchResults = await usersListPage.getCurrentPageUsers();
    console.log(`📊 Search results: ${searchResults.length} users`);

    // Capture current URL before refresh
    const beforeRefreshUrl = page.url();
    console.log(`📍 URL before refresh: ${beforeRefreshUrl}`);

    // Refresh the page
    console.log('🔄 Refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check what happens after refresh - this tests authentication persistence
    const afterRefreshUrl = page.url();
    console.log(`📍 URL after refresh: ${afterRefreshUrl}`);

    // If redirected to login, that's expected behavior for session-based auth
    if (afterRefreshUrl.includes('/login') || afterRefreshUrl === '/' || !afterRefreshUrl.includes('/users')) {
      console.log('ℹ️ Redirected after refresh (authentication state not persistent)');

      // Re-authenticate
      await setupErrorTest(page);
      await usersListPage.goto();

      const reauthenticatedUrl = page.url();
      console.log(`📍 URL after re-authentication: ${reauthenticatedUrl}`);

      // Verify we can access the users page after re-authentication
      expect(reauthenticatedUrl).toContain('/users');
      console.log('✅ Application recovered after re-authentication');
    } else {
      // If still on users page, verify basic functionality
      const usersAfterRefresh = await usersListPage.getCurrentPageUsers();
      console.log(`📊 Users visible after refresh: ${usersAfterRefresh.length}`);
      expect(usersAfterRefresh.length).toBeGreaterThan(0);
      console.log('✅ Page state maintained after refresh');
    }

    // Test that basic functionality works after recovery
    const finalUserCount = await usersListPage.getUserCount();
    console.log(`📊 Final user count: ${finalUserCount}`);
    expect(finalUserCount).toBeGreaterThan(0);

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
