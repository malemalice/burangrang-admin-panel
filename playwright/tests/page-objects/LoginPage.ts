import { Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Form elements - using getters to avoid initialization issues
  get emailInput() {
    return this.page.getByRole('textbox', { name: '* Email' });
  }

  get passwordInput() {
    return this.page.getByRole('textbox', { name: '* Password' });
  }

  get loginButton() {
    return this.page.getByRole('button', { name: 'Login' });
  }

  // Demo credentials (if present)
  get demoCredentials() {
    return this.page.locator('alert').filter({ hasText: 'Email:' });
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    // Wait for redirect
    await this.page.waitForURL(/.*dashboard|.*\/$/);
    await this.page.waitForLoadState('networkidle');
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
