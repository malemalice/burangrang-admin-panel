import { Page } from '@playwright/test';

export class UsersListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Page elements
  get pageHeader() {
    // Look for h1 specifically in the main content area
    return this.page.locator('main h1, [role="main"] h1').filter({ hasText: /users|Users/ });
  }

  get addUserButton() {
    // Look for Add User button - updated selector
    return this.page.locator('button').filter({ hasText: 'Add User' });
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
    const isUsersUrl = url.includes('/users') && !url.includes('/new') && !url.includes('/edit');

    // Also check for page content that indicates we're on users page
    let isUsersContent = false;
    try {
      // Check for multiple indicators that we're on the users page
      const hasUsersTitle = await this.page.locator('h1').filter({ hasText: 'Users' }).isVisible();
      const hasAddUserButton = await this.page.locator('button').filter({ hasText: 'Add User' }).isVisible();
      const hasUsersTable = await this.page.locator('table').isVisible();

      isUsersContent = hasUsersTitle && hasAddUserButton && hasUsersTable;
    } catch (error) {
      console.log('⚠️ Could not check users page content:', error.message);
    }

    console.log(`🔍 isOnUsersPage check: URL=${isUsersUrl}, Content=${isUsersContent}`);
    return isUsersUrl && isUsersContent;
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

  getUserByEmail(email: string) {
    return this.dataRows.filter({ hasText: email });
  }

  getUserByName(name: string) {
    return this.dataRows.filter({ hasText: name });
  }

  async clickUserAction(userRow: any, action: 'view' | 'edit' | 'delete') {
    // First, click the "Open menu" button to reveal the dropdown
    const openMenuButton = userRow.locator('button').filter({ hasText: /open menu/i });

    // Try multiple strategies to handle potential pointer interception
    let clicked = false;

    try {
      // Strategy 1: Normal click
      await openMenuButton.click({ timeout: 2000 });
      clicked = true;
      console.log('✅ Clicked Open menu button with normal click');
    } catch (error) {
      console.log('⚠️ Normal click failed, trying force click...');

      try {
        // Strategy 2: Force click
        await openMenuButton.click({ force: true, timeout: 2000 });
        clicked = true;
        console.log('✅ Clicked Open menu button with force click');
      } catch (error) {
        console.log('⚠️ Force click failed, trying JavaScript click...');

        try {
          // Strategy 3: JavaScript click
          await openMenuButton.evaluate(button => (button as HTMLElement).click());
          clicked = true;
          console.log('✅ Clicked Open menu button with JavaScript click');
        } catch (error) {
          console.log('❌ All click strategies failed for Open menu button');
          throw error;
        }
      }
    }

    if (!clicked) {
      throw new Error('Failed to click Open menu button');
    }

    // Wait for the dropdown menu to appear
    await this.page.waitForTimeout(300);

    // Then click the desired action from the dropdown
    const actionButton = this.page.locator('[role="menuitem"], button').filter({ hasText: new RegExp(action, 'i') });

    try {
      await actionButton.click({ timeout: 3000 });
      console.log(`✅ Clicked ${action} action from dropdown`);
    } catch (error) {
      console.log(`⚠️ Direct click failed for ${action}, trying alternatives...`);

      // Try force click
      try {
        await actionButton.click({ force: true, timeout: 2000 });
      } catch (error) {
        // Try JavaScript click as last resort
        await actionButton.evaluate(button => (button as HTMLElement).click());
      }
    }

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
