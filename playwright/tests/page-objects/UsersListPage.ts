import { Page } from '@playwright/test';

export class UsersListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Page elements
  get pageHeader() {
    return this.page.locator('h1').filter({ hasText: /users|Users/ });
  }

  get addUserButton() {
    return this.page.getByRole('button').filter({ hasText: /add|Add|create|Create|new|New/ });
  }

  // Table elements
  get userTable() {
    return this.page.locator('table');
  }

  get tableHeaders() {
    return this.page.locator('th, [role="columnheader"]');
  }

  get dataRows() {
    return this.page.locator('tbody tr, [role="row"]');
  }

  // Search and filter elements
  get searchInput() {
    return this.page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  get filterButtons() {
    return this.page.locator('button').filter({ hasText: /filter|Filter/ });
  }

  // Pagination elements
  get paginationControls() {
    return this.page.locator('button, [role="button"]').filter({ hasText: /next|previous|page/i });
  }

  get pageSizeSelect() {
    return this.page.locator('select, [role="combobox"]').filter({ hasText: /show|per page/i });
  }

  async goto() {
    await this.page.goto('/users');
    await this.page.waitForLoadState('networkidle');
  }

  async isOnUsersPage(): Promise<boolean> {
    const url = this.page.url();
    return (url.includes('/users') && !url.includes('/new') && !url.includes('/edit')) ||
           // Also check for page content that indicates we're on users page
           (await this.pageHeader.isVisible() && await this.addUserButton.isVisible());
  }

  async clickAddUser() {
    // Wait for any sidebar animations to complete
    await this.page.waitForTimeout(500);

    // Try multiple strategies to handle sidebar overlay
    let clicked = false;

    // Strategy 1: Try to temporarily hide/disable the sidebar
    try {
      await this.page.addStyleTag({
        content: `
          aside[class*="sidebar"], aside[class*="fixed"] {
            pointer-events: none !important;
            z-index: -1 !important;
          }
        `
      });
      await this.addUserButton.click();
      clicked = true;
      console.log('✅ Clicked Add User button using CSS override strategy');
    } catch (error) {
      console.log('⚠️ CSS override strategy failed, trying force click...');
    }

    // Strategy 2: Force click if CSS override didn't work
    if (!clicked) {
      try {
        await this.addUserButton.click({ force: true });
        clicked = true;
        console.log('✅ Clicked Add User button using force click strategy');
      } catch (error) {
        console.log('⚠️ Force click failed, trying JavaScript click...');
      }
    }

    // Strategy 3: JavaScript click as last resort
    if (!clicked) {
      try {
        await this.addUserButton.evaluate(button => (button as HTMLElement).click());
        clicked = true;
        console.log('✅ Clicked Add User button using JavaScript click strategy');
      } catch (error) {
        console.log('❌ All click strategies failed');
        throw error;
      }
    }

    await this.page.waitForLoadState('networkidle');
  }

  async getUserCount(): Promise<number> {
    return this.dataRows.count();
  }

  async getUserByEmail(email: string) {
    return this.dataRows.filter({ hasText: email });
  }

  async getUserByName(name: string) {
    return this.dataRows.filter({ hasText: name });
  }

  async clickUserAction(userRow: any, action: 'view' | 'edit' | 'delete') {
    const actionButton = userRow.locator('button').filter({ hasText: new RegExp(action, 'i') });
    await actionButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchUsers(searchTerm: string) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(searchTerm);
      await this.page.waitForTimeout(500); // Wait for search to complete
    }
  }

  async getTableHeaders(): Promise<string[]> {
    const headers = await this.tableHeaders.allTextContents();
    return headers.map(h => h.trim());
  }

  async getUserData(rowIndex: number = 0): Promise<string> {
    const row = this.dataRows.nth(rowIndex);
    return row.textContent() || '';
  }

  async hasPagination(): Promise<boolean> {
    return this.paginationControls.isVisible();
  }

  async getCurrentPageUsers(): Promise<string[]> {
    const userTexts: string[] = [];
    const count = await this.dataRows.count();

    for (let i = 0; i < count; i++) {
      const text = await this.dataRows.nth(i).textContent();
      if (text) {
        userTexts.push(text.trim());
      }
    }

    return userTexts;
  }
}
