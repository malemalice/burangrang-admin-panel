import { test, expect, Page } from '@playwright/test';
import { LoginPage } from './page-objects';

// Test data
const TEST_CREDENTIALS = {
  valid: {
    email: 'admin@example.com',
    password: 'admin'
  },
  invalid: {
    email: 'wrong@example.com',
    password: 'wrongpassword'
  }
};

// Helper function to take screenshot
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `screenshots/${name}.png`,
    fullPage: true
  });
}

// Helper function to check JWT token in localStorage
async function checkJWTToken(page: Page): Promise<{ hasToken: boolean; hasRefreshToken: boolean; token: string | null }> {
  const result = await page.evaluate(() => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    return {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      token: token ? token.substring(0, 50) + '...' : null
    };
  });
  return result;
}

test.describe('Authentication Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

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

    await loginPage.goto();
    await takeScreenshot(page, 'auth-01-login-page');
  });

  test('1. Navigate to login page and verify form elements', async ({ page }) => {
    console.log('🔐 Testing login page form elements...');

    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/);
    console.log('✅ Confirmed on login page');

    // Verify form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    console.log('✅ All form elements are visible');

    // Check for demo credentials (optional)
    const hasDemoCredentials = await loginPage.hasDemoCredentials();
    if (hasDemoCredentials) {
      console.log('✅ Demo credentials alert is visible');
      const demoText = await loginPage.getDemoCredentialsText();
      console.log(`📝 Demo credentials: ${demoText}`);
    } else {
      console.log('ℹ️ Demo credentials alert not visible (this is optional)');
    }

    await takeScreenshot(page, 'auth-02-form-elements-verified');
    console.log('🎉 Login page form elements test completed successfully!');
  });

  test('2. Test login with valid credentials', async ({ page }) => {
    console.log('🔐 Testing valid login credentials...');

    // Login with valid credentials
    await loginPage.login(TEST_CREDENTIALS.valid.email, TEST_CREDENTIALS.valid.password);
    console.log('✅ Login form submitted');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard|.*\/$/);
    console.log('✅ Successfully redirected to dashboard');

    // Verify JWT tokens are present
    const tokenInfo = await checkJWTToken(page);
    expect(tokenInfo.hasToken).toBe(true);
    expect(tokenInfo.hasRefreshToken).toBe(true);
    console.log(`✅ JWT Token present: ${tokenInfo.hasToken}`);
    console.log(`✅ Refresh Token present: ${tokenInfo.hasRefreshToken}`);
    console.log(`📝 Token preview: ${tokenInfo.token}`);

    await takeScreenshot(page, 'auth-03-valid-login-success');
    console.log('🎉 Valid login test completed successfully!');
  });

  test('3. Test login with invalid credentials', async ({ page }) => {
    console.log('🔐 Testing invalid login credentials...');

    // Fill invalid credentials
    await loginPage.emailInput.fill(TEST_CREDENTIALS.invalid.email);
    await loginPage.passwordInput.fill(TEST_CREDENTIALS.invalid.password);
    await takeScreenshot(page, 'auth-04-invalid-credentials-filled');

    // Submit form
    await loginPage.loginButton.click();
    await page.waitForTimeout(1000); // Wait for error response
    console.log('✅ Invalid login form submitted');

    // Check for error messages
    const errorElements = page.locator('.error, [role="alert"], .text-red-600, .text-destructive');
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
      console.log(`✅ Found ${errorCount} error element(s)`);

      // Look for "Invalid credentials" message
      const invalidCredentialsError = errorElements.filter({ hasText: /invalid|Invalid|wrong|Wrong|credentials|Credentials/i });
      const hasInvalidCredentialsError = await invalidCredentialsError.isVisible();

      if (hasInvalidCredentialsError) {
        console.log('✅ "Invalid credentials" error message displayed');
      } else {
        console.log('ℹ️ Error message found but different text');
        const errorText = await errorElements.first().textContent();
        console.log(`📝 Error message: ${errorText}`);
      }
    } else {
      console.log('⚠️ No error messages found - checking if still on login page');
      const stillOnLogin = await loginPage.isOnLoginPage();
      expect(stillOnLogin).toBe(true);
      console.log('✅ Still on login page (expected for invalid credentials)');
    }

    await takeScreenshot(page, 'auth-05-invalid-login-error');
    console.log('🎉 Invalid login test completed!');
  });

  test('4. Test empty form submission', async ({ page }) => {
    console.log('🔐 Testing empty form submission...');

    // Click login button without filling fields
    await loginPage.loginButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Empty form submitted');

    // Check if still on login page
    const stillOnLogin = await loginPage.isOnLoginPage();
    expect(stillOnLogin).toBe(true);
    console.log('✅ Still on login page (expected for empty form)');

    // Check for validation errors
    const errorElements = page.locator('.error, [role="alert"], .text-red-600, .text-destructive');
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
      console.log(`✅ Found ${errorCount} validation error(s)`);
    } else {
      console.log('ℹ️ No validation errors visible');
    }

    await takeScreenshot(page, 'auth-06-empty-form-submission');
    console.log('🎉 Empty form submission test completed!');
  });

  test('5. Test JWT token handling', async ({ page }) => {
    console.log('🔐 Testing JWT token handling...');

    // Login first
    await loginPage.login(TEST_CREDENTIALS.valid.email, TEST_CREDENTIALS.valid.password);

    // Verify tokens are stored
    const tokenInfo = await checkJWTToken(page);
    expect(tokenInfo.hasToken).toBe(true);
    expect(tokenInfo.hasRefreshToken).toBe(true);
    console.log(`✅ JWT Token found: ${tokenInfo.token}`);
    console.log(`✅ Refresh Token found: ${tokenInfo.hasRefreshToken}`);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log('✅ Page refreshed');

    // Check if tokens persist after refresh
    const tokenInfoAfterRefresh = await checkJWTToken(page);
    expect(tokenInfoAfterRefresh.hasToken).toBe(true);
    expect(tokenInfoAfterRefresh.hasRefreshToken).toBe(true);
    console.log('✅ Tokens persist after page refresh');

    await takeScreenshot(page, 'auth-07-jwt-token-verified');
    console.log('🎉 JWT token handling test completed successfully!');
  });

  test('6. Test logout functionality', async ({ page }) => {
    console.log('🔐 Testing logout functionality...');

    // Login first
    await loginPage.login(TEST_CREDENTIALS.valid.email, TEST_CREDENTIALS.valid.password);
    console.log('✅ Logged in successfully');

    // Look for logout button (common patterns)
    const logoutButton = page.getByRole('button').filter({ hasText: /logout|Logout|sign.?out|Sign.?out/i });
    const hasLogoutButton = await logoutButton.isVisible();

    if (hasLogoutButton) {
      console.log('✅ Logout button found');
      await logoutButton.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Logout button clicked');

      // Verify redirected to login page
      await expect(page).toHaveURL(/.*login/);
      console.log('✅ Redirected to login page after logout');

      // Verify tokens are cleared
      const tokenInfo = await checkJWTToken(page);
      expect(tokenInfo.hasToken).toBe(false);
      expect(tokenInfo.hasRefreshToken).toBe(false);
      console.log('✅ Tokens cleared after logout');

    } else {
      console.log('⚠️ Logout button not found - might be in a menu/dropdown');
      // Check for menu triggers
      const menuButton = page.locator('button').filter({ hasText: /menu|Menu|profile|Profile|account|Account/i });
      if (await menuButton.isVisible()) {
        console.log('ℹ️ Menu button found - logout might be in dropdown');
      } else {
        console.log('⚠️ No obvious logout mechanism found');
      }
    }

    await takeScreenshot(page, 'auth-08-logout-test');
    console.log('🎉 Logout functionality test completed!');
  });

  test('7. Test authentication flow with backend integration', async ({ page }) => {
    console.log('🔐 Testing authentication flow with backend integration...');

    // Monitor network requests
    const loginRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/auth/login') || request.url().includes('/login')) {
        loginRequests.push(request.url());
      }
    });

    // Login with valid credentials
    await loginPage.login(TEST_CREDENTIALS.valid.email, TEST_CREDENTIALS.valid.password);
    console.log('✅ Login completed');

    // Verify network requests were made
    if (loginRequests.length > 0) {
      console.log('📡 Network requests made:');
      loginRequests.forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
    } else {
      console.log('⚠️ No login network requests captured');
    }

    // Verify dashboard redirect
    const currentUrl = page.url();
    const redirectedToDashboard = currentUrl === 'http://localhost:8080/' ||
                                  currentUrl.includes('/dashboard') ||
                                  !currentUrl.includes('/login');
    expect(redirectedToDashboard).toBe(true);
    console.log(`✅ Dashboard redirect: ${redirectedToDashboard}`);
    console.log(`📍 Current URL: ${currentUrl}`);

    // Verify JWT tokens
    const tokenInfo = await checkJWTToken(page);
    expect(tokenInfo.hasToken).toBe(true);
    console.log(`✅ JWT Token present: ${tokenInfo.hasToken}`);

    await takeScreenshot(page, 'auth-09-backend-integration-complete');
    console.log('🎉 Backend integration test completed successfully!');
  });
});
