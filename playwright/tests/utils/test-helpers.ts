import { Page } from '@playwright/test';
import { LoginPage, UsersListPage, UserFormPage, UserDetailPage, UserFormData } from '../page-objects';

// Test data constants
export const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin'
};

export const DEFAULT_USER_DATA: UserFormData = {
  firstName: 'Test',
  lastName: 'User',
  email: `test.user.${Date.now()}@example.com`,
  password: 'password123',
  role: 'User',
  office: 'Headquarters'
};

// Screenshot helper
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `screenshots/${name}.png`,
    fullPage: true
  });
}

// JWT token helper
export async function checkJWTToken(page: Page): Promise<{ hasToken: boolean; hasRefreshToken: boolean; token: string | null }> {
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

// Test setup helpers
export async function setupAuthenticatedSession(page: Page): Promise<{
  loginPage: LoginPage;
  usersListPage: UsersListPage;
  userFormPage: UserFormPage;
  userDetailPage: UserDetailPage;
}> {
  const loginPage = new LoginPage(page);
  const usersListPage = new UsersListPage(page);
  const userFormPage = new UserFormPage(page);
  const userDetailPage = new UserDetailPage(page);

  // Clear storage
  await page.context().clearCookies();
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    console.log('Could not clear storage (expected in some cases)');
  }

  return { loginPage, usersListPage, userFormPage, userDetailPage };
}

export async function loginAndNavigateToUsers(page: Page): Promise<{
  loginPage: LoginPage;
  usersListPage: UsersListPage;
  userFormPage: UserFormPage;
  userDetailPage: UserDetailPage;
}> {
  const { loginPage, usersListPage, userFormPage, userDetailPage } = await setupAuthenticatedSession(page);

  // Login
  await loginPage.goto();
  await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

  // Navigate to users page
  await usersListPage.goto();

  // Handle potential redirect
  if (page.url().includes('/login')) {
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await usersListPage.goto();
  }

  // Additional wait for page to be fully ready (sidebar animations, etc.)
  await page.waitForTimeout(1000);

  return { loginPage, usersListPage, userFormPage, userDetailPage };
}

// User creation helpers
export async function createTestUser(
  page: Page,
  usersListPage: UsersListPage,
  userFormPage: UserFormPage,
  userData: Partial<UserFormData> = {}
): Promise<string> {
  const testUserData: UserFormData = {
    ...DEFAULT_USER_DATA,
    ...userData,
    email: userData.email || `test.user.${Date.now()}@example.com`
  };

  await usersListPage.clickAddUser();
  await userFormPage.fillForm(testUserData);
  await userFormPage.submitForm();

  // Verify creation
  const isOnUsersPage = await usersListPage.isOnUsersPage();
  if (isOnUsersPage) {
    console.log(`✅ Created test user: ${testUserData.firstName} ${testUserData.lastName}`);
    return testUserData.email;
  } else {
    throw new Error('Failed to create test user');
  }
}

export async function createMultipleTestUsers(
  page: Page,
  usersListPage: UsersListPage,
  userFormPage: UserFormPage,
  count: number
): Promise<string[]> {
  const createdEmails: string[] = [];

  for (let i = 0; i < count; i++) {
    const userData = {
      firstName: `Test${i}`,
      lastName: `User${i}`,
      email: `test${i}.user.${Date.now()}@example.com`
    };

    try {
      const email = await createTestUser(page, usersListPage, userFormPage, userData);
      createdEmails.push(email);
    } catch (error) {
      console.log(`⚠️ Failed to create user ${i}:`, error);
    }
  }

  return createdEmails;
}

// User search and filter helpers
export async function waitForSearchResults(page: Page, timeout = 2000) {
  await page.waitForTimeout(timeout);
}

export async function clearSearchInput(usersListPage: UsersListPage) {
  if (await usersListPage.searchInput.isVisible()) {
    await usersListPage.searchInput.clear();
    await usersListPage.searchInput.press('Enter');
    await waitForSearchResults(usersListPage.searchInput.page());
  }
}

// Data extraction helpers
export async function getUserRowData(row: any): Promise<string> {
  return row.textContent() || '';
}

export async function extractEmailFromUserRow(rowText: string): Promise<string | null> {
  const emailMatch = rowText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return emailMatch ? emailMatch[1] : null;
}

export async function extractNameFromUserRow(rowText: string): Promise<string> {
  // Extract name from typical format: "First Last email@domain.com ..."
  const nameMatch = rowText.match(/^([^@]+)@/);
  return nameMatch ? nameMatch[1].trim() : '';
}

// Validation helpers
export async function waitForLoadingToComplete(page: Page) {
  await page.waitForLoadState('networkidle');
  // Additional wait for any dynamic content
  await page.waitForTimeout(500);
}

export async function waitForElementToBeVisible(locator: any, timeout = 5000) {
  await locator.waitFor({ state: 'visible', timeout });
}

export async function waitForElementToBeHidden(locator: any, timeout = 5000) {
  await locator.waitFor({ state: 'hidden', timeout });
}

// Error handling helpers
export async function getAllErrorMessages(page: Page): Promise<string[]> {
  const errorElements = page.locator('.error, [role="alert"], .text-red-600, .text-destructive');
  const errorMessages: string[] = [];

  const count = await errorElements.count();
  for (let i = 0; i < count; i++) {
    const text = await errorElements.nth(i).textContent();
    if (text) {
      errorMessages.push(text.trim());
    }
  }

  return errorMessages;
}

export async function hasValidationErrors(userFormPage: UserFormPage): Promise<boolean> {
  return await userFormPage.hasValidationErrors();
}

// Random data generators
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test.${random}.${timestamp}@example.com`;
}

export function generateRandomName(): string {
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Tom', 'Emma'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Williams', 'Jones', 'Garcia', 'Miller', 'Davis'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

// Network monitoring helpers
export function monitorNetworkRequests(page: Page): { requests: any[]; responses: any[] } {
  const networkData = {
    requests: [] as any[],
    responses: [] as any[]
  };

  page.on('request', request => {
    networkData.requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  });

  page.on('response', response => {
    networkData.responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      timestamp: Date.now()
    });
  });

  return networkData;
}

// Performance measurement helpers
export async function measurePageLoadTime(page: Page, url: string): Promise<number> {
  const startTime = Date.now();

  await page.goto(url);
  await page.waitForLoadState('networkidle');

  const endTime = Date.now();
  return endTime - startTime;
}

export async function measureActionTime(page: Page, action: () => Promise<void>): Promise<number> {
  const startTime = Date.now();
  await action();
  const endTime = Date.now();
  return endTime - startTime;
}

// Cleanup helpers
export async function cleanupTestUsers(page: Page, usersListPage: UsersListPage, userDetailPage: UserDetailPage, testEmails: string[]) {
  console.log(`🧹 Cleaning up ${testEmails.length} test users...`);

  for (const email of testEmails) {
    try {
      const userRow = usersListPage.getUserByEmail(email);
      if (await userRow.isVisible()) {
        await usersListPage.clickUserAction(userRow, 'view');
        await userDetailPage.clickDelete();
        await userDetailPage.confirmDelete();
        console.log(`✅ Deleted test user: ${email}`);
      }
    } catch (error) {
      console.log(`⚠️ Failed to delete test user ${email}:`, error);
    }
  }
}

// Browser compatibility helpers
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 });
}

export async function setTabletViewport(page: Page) {
  await page.setViewportSize({ width: 768, height: 1024 });
}

export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
}

// Test data factories
export function createUserData(overrides: Partial<UserFormData> = {}): UserFormData {
  return {
    ...DEFAULT_USER_DATA,
    ...overrides,
    email: overrides.email || generateRandomEmail()
  };
}

export function createMultipleUserData(count: number): UserFormData[] {
  return Array.from({ length: count }, () => createUserData());
}
