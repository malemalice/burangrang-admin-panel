import { Page } from '@playwright/test';

export class UserDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Page elements
  get pageTitle() {
    return this.page.locator('h1, h2').filter({ hasText: /user|User|details|Details/i });
  }

  get backButton() {
    return this.page.getByRole('button').filter({ hasText: /back|Back/ });
  }

  get editButton() {
    return this.page.getByRole('button').filter({ hasText: /edit|Edit/ });
  }

  get deleteButton() {
    return this.page.getByRole('button').filter({ hasText: /delete|Delete/i });
  }

  // User information fields
  get userName() {
    return this.page.locator('div, span, p').filter({ hasText: /name|Name/ }).locator('xpath=following-sibling::*').first();
  }

  get userEmail() {
    return this.page.locator('div, span, p').filter({ hasText: /email|Email/i }).locator('xpath=following-sibling::*').first();
  }

  get userRole() {
    return this.page.locator('div, span, p').filter({ hasText: /role|Role/i }).locator('xpath=following-sibling::*').first();
  }

  get userOffice() {
    return this.page.locator('div, span, p').filter({ hasText: /office|Office/i }).locator('xpath=following-sibling::*').first();
  }

  get userDepartment() {
    return this.page.locator('div, span, p').filter({ hasText: /department|Department/i }).locator('xpath=following-sibling::*').first();
  }

  get userPosition() {
    return this.page.locator('div, span, p').filter({ hasText: /position|job|Job/i }).locator('xpath=following-sibling::*').first();
  }

  get userStatus() {
    return this.page.locator('div, span, p').filter({ hasText: /status|Status/i }).locator('xpath=following-sibling::*').first();
  }

  get lastLogin() {
    return this.page.locator('div, span, p').filter({ hasText: /last.?login|Last.?Login/i }).locator('xpath=following-sibling::*').first();
  }

  get createdAt() {
    return this.page.locator('div, span, p').filter({ hasText: /created|Created/i }).locator('xpath=following-sibling::*').first();
  }

  get updatedAt() {
    return this.page.locator('div, span, p').filter({ hasText: /updated|Updated/i }).locator('xpath=following-sibling::*').first();
  }

  // Alternative selectors for user data (in case the above don't work)
  get dataLabels() {
    return this.page.locator('label, .label, [class*="label"]');
  }

  get dataValues() {
    return this.page.locator('.value, [class*="value"], span:not([class]), div:not([class])');
  }

  // Delete confirmation dialog
  get deleteDialog() {
    return this.page.locator('[role="dialog"], .modal, .dialog').filter({ hasText: /delete|Delete/ });
  }

  get confirmDeleteButton() {
    return this.page.getByRole('button', { name: /delete|Delete|confirm|Confirm/i });
  }

  get cancelDeleteButton() {
    return this.page.getByRole('button', { name: /cancel|Cancel/i });
  }

  async isOnUserDetailPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/users/') && !url.includes('/edit') && !url.includes('/new');
  }

  async getUserIdFromUrl(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/users\/([^\/]+)/);
    return match ? match[1] : '';
  }

  async getUserName(): Promise<string> {
    try {
      return await this.userName.textContent() || '';
    } catch {
      // Fallback: look for name in general content
      const nameElement = this.page.locator('text=/[A-Z][a-z]+ [A-Z][a-z]+/').first();
      return await nameElement.textContent() || '';
    }
  }

  async getUserEmail(): Promise<string> {
    try {
      return await this.userEmail.textContent() || '';
    } catch {
      // Fallback: look for email pattern
      const emailElement = this.page.locator('text=/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/').first();
      return await emailElement.textContent() || '';
    }
  }

  async getUserRole(): Promise<string> {
    try {
      return await this.userRole.textContent() || '';
    } catch {
      return '';
    }
  }

  async getUserOffice(): Promise<string> {
    try {
      return await this.userOffice.textContent() || '';
    } catch {
      return '';
    }
  }

  async getUserDepartment(): Promise<string> {
    try {
      return await this.userDepartment.textContent() || '';
    } catch {
      return '';
    }
  }

  async getUserPosition(): Promise<string> {
    try {
      return await this.userPosition.textContent() || '';
    } catch {
      return '';
    }
  }

  async getUserStatus(): Promise<string> {
    try {
      return await this.userStatus.textContent() || '';
    } catch {
      return '';
    }
  }

  async getLastLogin(): Promise<string> {
    try {
      return await this.lastLogin.textContent() || '';
    } catch {
      return '';
    }
  }

  async getCreatedAt(): Promise<string> {
    try {
      return await this.createdAt.textContent() || '';
    } catch {
      return '';
    }
  }

  async getUpdatedAt(): Promise<string> {
    try {
      return await this.updatedAt.textContent() || '';
    } catch {
      return '';
    }
  }

  async clickEdit() {
    await this.editButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickDelete() {
    await this.deleteButton.click();
    // Wait for dialog to appear
    await this.page.waitForTimeout(500);
  }

  async confirmDelete() {
    if (await this.deleteDialog.isVisible()) {
      await this.confirmDeleteButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async cancelDelete() {
    if (await this.deleteDialog.isVisible()) {
      await this.cancelDeleteButton.click();
    }
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getAllUserData(): Promise<Record<string, string>> {
    return {
      name: await this.getUserName(),
      email: await this.getUserEmail(),
      role: await this.getUserRole(),
      office: await this.getUserOffice(),
      department: await this.getUserDepartment(),
      position: await this.getUserPosition(),
      status: await this.getUserStatus(),
      lastLogin: await this.getLastLogin(),
      createdAt: await this.getCreatedAt(),
      updatedAt: await this.getUpdatedAt()
    };
  }
}
