import { Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Form elements - using getters to avoid initialization issues
  get emailInput() {
    return this.page.locator('#email');
  }

  get passwordInput() {
    return this.page.locator('#password');
  }

  get loginButton() {
    return this.page.locator('button[type="submit"]').filter({ hasText: 'Login' });
  }

  // Demo credentials (if present)
  get demoCredentials() {
    return this.page.locator('alert').filter({ hasText: 'Email:' });
  }

  async goto() {
    // First try to go to root - if not logged in, it should redirect to login
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');

    // Check if we're on login page after navigation
    if (!this.page.url().includes('/login')) {
      // We're already logged in, navigate to login page explicitly
      await this.page.goto('/login');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async login(email: string, password: string, expectSuccess: boolean = true) {
    console.log(`🔐 Attempting login for: ${email}`);

    // Wait for elements to be visible
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.loginButton.waitFor({ state: 'visible', timeout: 5000 });

    console.log('✅ Login form elements found');

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    console.log('✅ Form fields filled');

    await this.loginButton.click();
    console.log('✅ Login button clicked');

    if (expectSuccess) {
      // Wait for redirect to complete first (most reliable indicator)
      await this.page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 });
      console.log(`📍 Successfully redirected to: ${this.page.url()}`);

      // Wait for authentication tokens to be stored
      await this.page.waitForFunction(() => {
        return !!(localStorage.getItem('access_token') && localStorage.getItem('refresh_token'));
      }, { timeout: 5000 });
      console.log('✅ Authentication tokens stored');

      console.log('✅ Login process completed successfully');
    } else {
      // For failed login, wait a moment for the error to appear
      await this.page.waitForTimeout(2000);
      console.log('⏳ Waiting for login failure response');

      // Check if we're still on login page (expected for failed login)
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        console.log('✅ Login failed as expected - still on login page');
      }
    }
  }

  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('/login');
  }

  async hasDemoCredentials(): Promise<boolean> {
    return this.demoCredentials.isVisible();
  }

  async getDemoCredentialsText(): Promise<string | null> {
    if (await this.hasDemoCredentials()) {
      return this.demoCredentials.textContent();
    }
    return null;
  }
}
