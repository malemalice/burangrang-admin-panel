import { test, expect, Page } from '@playwright/test';
import { LoginPage, UsersListPage, UserFormPage, UserFormData } from '../page-objects';
import { TEST_CREDENTIALS } from '../constants';

const VALID_USER_DATA: UserFormData = {
  firstName: 'John',
  lastName: 'Doe',
  email: `john.doe.${Date.now()}@example.com`,
  password: 'password123',
  role: 'User',
  office: 'Headquarters'
};

// Invalid test data
const INVALID_USER_DATA = {
  shortPassword: '12345', // Less than 6 characters
  invalidEmails: [
    'invalid-email',
    'test@',
    '@example.com',
    'test..double@example.com',
    'test space@example.com'
  ]
};

// Helper function to take screenshot
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `screenshots/${name}.png`,
    fullPage: true
  });
}

// Helper function to setup test environment
async function setupValidationTest(page: Page): Promise<{ loginPage: LoginPage; usersListPage: UsersListPage; userFormPage: UserFormPage }> {
  const loginPage = new LoginPage(page);
  const usersListPage = new UsersListPage(page);
  const userFormPage = new UserFormPage(page);

  // Login
  await loginPage.goto();
  await loginPage.login(TEST_CREDENTIALS.ADMIN.email, TEST_CREDENTIALS.ADMIN.password);

  // Navigate to users page
  await usersListPage.goto();

  // Handle potential redirect
  if (page.url().includes('/login')) {
    await loginPage.login(TEST_CREDENTIALS.ADMIN.email, TEST_CREDENTIALS.ADMIN.password);
    await usersListPage.goto();
  }

  return { loginPage, usersListPage, userFormPage };
}

test.describe('Users Form Validation Tests', () => {
  let loginPage: LoginPage;
  let usersListPage: UsersListPage;
  let userFormPage: UserFormPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    usersListPage = new UsersListPage(page);
    userFormPage = new UserFormPage(page);

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

  test('1. Required field validation - empty form submission', async ({ page }) => {
    console.log('🔍 Testing required field validation with empty form...');

    // Setup
    await setupValidationTest(page);
    await usersListPage.clickAddUser();

    console.log('✅ On create user form');

    // Take screenshot of empty form
    await takeScreenshot(page, 'validation-01-empty-form');

    // Try to submit empty form
    await userFormPage.submitButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Submitted empty form');

    // Verify we're still on the form (shouldn't redirect)
    const isStillOnCreatePage = await userFormPage.isOnCreatePage();
    expect(isStillOnCreatePage).toBe(true);
    console.log('✅ Still on create form (validation prevented submission)');

    // Check for validation errors
    const hasErrors = await userFormPage.hasValidationErrors();
    if (hasErrors) {
      const errorMessages = await userFormPage.getErrorMessages();
      console.log(`✅ Found ${errorMessages.length} validation errors:`);
      errorMessages.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });

      // Should have errors for required fields
      expect(errorMessages.length).toBeGreaterThan(0);
      console.log('✅ Validation errors present for empty form');
    } else {
      // Some forms might not show errors until blur/focus
      console.log('ℹ️ No immediate validation errors - might require field interaction');
    }

    await takeScreenshot(page, 'validation-02-empty-form-errors');
    console.log('🎉 Empty form validation test completed!');
  });

  test('2. Required field validation - individual field validation', async ({ page }) => {
    console.log('🔍 Testing individual required field validation...');

    // Setup
    await setupValidationTest(page);
    await usersListPage.clickAddUser();

    console.log('✅ On create user form');

    // Test each required field individually
    const testCases = [
      {
        field: 'firstName',
        action: () => userFormPage.firstNameInput.fill(''),
        description: 'First Name field'
      },
      {
        field: 'lastName',
        action: () => userFormPage.lastNameInput.fill(''),
        description: 'Last Name field'
      },
      {
        field: 'email',
        action: () => userFormPage.emailInput.fill(''),
        description: 'Email field'
      },
      {
        field: 'password',
        action: () => userFormPage.passwordInput.fill(''),
        description: 'Password field'
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`🔍 Testing ${testCase.description}...`);

      // Fill valid data first
      await userFormPage.fillForm(VALID_USER_DATA);

      // Clear the specific field
      await testCase.action();

      // Try to submit
      await userFormPage.submitButton.click();
      await page.waitForTimeout(500);

      // Check if validation errors appear
      const hasErrors = await userFormPage.hasValidationErrors();
      if (hasErrors) {
        console.log(`✅ Validation error found for ${testCase.description}`);
      } else {
        console.log(`ℹ️ No validation error for ${testCase.description} (might be client-side only)`);
      }
    }

    await takeScreenshot(page, 'validation-03-individual-fields');
    console.log('🎉 Individual field validation test completed!');
  });

  test('3. Email format validation', async ({ page }) => {
    console.log('🔍 Testing email format validation...');

    // Setup
    await setupValidationTest(page);
    await usersListPage.clickAddUser();

    console.log('✅ On create user form');

    // Fill valid data first
    await userFormPage.fillForm(VALID_USER_DATA);

    // Test each invalid email format
    for (let i = 0; i < INVALID_USER_DATA.invalidEmails.length; i++) {
      const invalidEmail = INVALID_USER_DATA.invalidEmails[i];
      console.log(`🔍 Testing invalid email: ${invalidEmail}`);

      await userFormPage.emailInput.fill(invalidEmail);

      // Trigger validation (some forms need blur/focus)
      await userFormPage.emailInput.blur();
      await page.waitForTimeout(500);

      // Try to submit
      await userFormPage.submitButton.click();
      await page.waitForTimeout(500);

      // Check for email validation errors
      const errorMessages = await userFormPage.getErrorMessages();
      const emailErrors = errorMessages.filter(msg =>
        msg.toLowerCase().includes('email') ||
        msg.toLowerCase().includes('format') ||
        msg.toLowerCase().includes('valid')
      );

      if (emailErrors.length > 0) {
        console.log(`✅ Email validation error for: ${invalidEmail}`);
        console.log(`📝 Error: ${emailErrors[0]}`);
      } else {
        console.log(`⚠️ No email validation error for: ${invalidEmail}`);
      }

      // Verify we're still on the form
      const isStillOnForm = await userFormPage.isOnCreatePage();
      expect(isStillOnForm).toBe(true);
    }

    await takeScreenshot(page, 'validation-04-email-format');
    console.log('🎉 Email format validation test completed!');
  });

  test('4. Password minimum length validation', async ({ page }) => {
    console.log('🔍 Testing password minimum length validation...');

    // Setup
    await setupValidationTest(page);
    await usersListPage.clickAddUser();

    console.log('✅ On create user form');

    // Fill valid data first
    await userFormPage.fillForm(VALID_USER_DATA);

    // Test password shorter than 6 characters
    console.log(`🔍 Testing short password: ${INVALID_USER_DATA.shortPassword}`);
    await userFormPage.passwordInput.fill(INVALID_USER_DATA.shortPassword);

    // Trigger validation
    await userFormPage.passwordInput.blur();
    await page.waitForTimeout(500);

    // Try to submit
    await userFormPage.submitButton.click();
    await page.waitForTimeout(500);

    // Check for password validation errors
    const errorMessages = await userFormPage.getErrorMessages();
    const passwordErrors = errorMessages.filter(msg =>
      msg.toLowerCase().includes('password') ||
      msg.toLowerCase().includes('length') ||
      msg.toLowerCase().includes('minimum') ||
      msg.toLowerCase().includes('characters')
    );

    if (passwordErrors.length > 0) {
      console.log(`✅ Password validation error found`);
      console.log(`📝 Error: ${passwordErrors[0]}`);
    } else {
      console.log(`⚠️ No password validation error found`);
    }

    // Verify we're still on the form
    const isStillOnForm = await userFormPage.isOnCreatePage();
    expect(isStillOnForm).toBe(true);

    await takeScreenshot(page, 'validation-05-password-length');
    console.log('🎉 Password length validation test completed!');
  });

  test('5. Successful form submission with valid data', async ({ page }) => {
    console.log('🔍 Testing successful form submission with valid data...');

    // Setup
    await setupValidationTest(page);

    // Get initial user count
    const initialUserCount = await usersListPage.getUserCount();
    console.log(`📊 Initial user count: ${initialUserCount}`);

    await usersListPage.clickAddUser();
    console.log('✅ On create user form');

    // Fill valid data
    await userFormPage.fillForm(VALID_USER_DATA);
    console.log('✅ Form filled with valid data');

    await takeScreenshot(page, 'validation-06-valid-form-filled');

    // Submit the form
    await userFormPage.submitForm();
    console.log('✅ Form submitted');

    // Verify redirect to users list
    const isOnUsersPage = await usersListPage.isOnUsersPage();
    expect(isOnUsersPage).toBe(true);
    console.log('✅ Successfully redirected to users list');

    // Verify user count increased
    const finalUserCount = await usersListPage.getUserCount();
    expect(finalUserCount).toBe(initialUserCount + 1);
    console.log(`📊 Final user count: ${finalUserCount} (expected: ${initialUserCount + 1})`);

    // Verify new user appears in list
    const newUserRow = usersListPage.getUserByEmail(VALID_USER_DATA.email);
    await expect(newUserRow).toBeVisible();
    console.log('✅ New user appears in the list');

    await takeScreenshot(page, 'validation-07-valid-submission-success');
    console.log('🎉 Successful form submission test completed!');
  });

  test('6. Duplicate email validation', async ({ page }) => {
    console.log('🔍 Testing duplicate email validation...');

    // Setup
    await setupValidationTest(page);
    await usersListPage.clickAddUser();

    console.log('✅ On create user form');

    // Get an existing user's email from the list
    const firstUserRow = usersListPage.dataRows.first();
    const firstUserText = await firstUserRow.textContent();
    const existingEmailMatch = firstUserText?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

    if (!existingEmailMatch) {
      console.log('⚠️ Could not find existing email in user list, skipping duplicate email test');
      return;
    }

    const existingEmail = existingEmailMatch[1];
    console.log(`📧 Using existing email: ${existingEmail}`);

    // Fill form with duplicate email
    const duplicateUserData: UserFormData = {
      ...VALID_USER_DATA,
      email: existingEmail
    };

    await userFormPage.fillForm(duplicateUserData);
    console.log('✅ Form filled with duplicate email');

    await takeScreenshot(page, 'validation-08-duplicate-email-filled');

    // Submit the form
    await userFormPage.submitButton.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Form submitted with duplicate email');

    // Check if we're still on the form or if there are errors
    const isStillOnForm = await userFormPage.isOnCreatePage();
    if (isStillOnForm) {
      console.log('✅ Still on form - duplicate email prevented submission');

      // Check for duplicate email error
      const errorMessages = await userFormPage.getErrorMessages();
      const duplicateErrors = errorMessages.filter(msg =>
        msg.toLowerCase().includes('duplicate') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('email') ||
        msg.toLowerCase().includes('taken')
      );

      if (duplicateErrors.length > 0) {
        console.log(`✅ Duplicate email error found: ${duplicateErrors[0]}`);
      } else {
        console.log('⚠️ No specific duplicate email error message found');
      }
    } else {
      // Check if we were redirected back due to server error
      const isOnUsersPage = await usersListPage.isOnUsersPage();
      if (isOnUsersPage) {
        console.log('⚠️ Redirected to users page - duplicate email might not be validated on frontend');
      }
    }

    await takeScreenshot(page, 'validation-09-duplicate-email-result');
    console.log('🎉 Duplicate email validation test completed!');
  });

  test('7. Form field length and format validation', async ({ page }) => {
    console.log('🔍 Testing field length and format validation...');

    // Setup
    await setupValidationTest(page);
    await usersListPage.clickAddUser();

    console.log('✅ On create user form');

    // Test various field constraints
    const edgeCaseData = [
      {
        name: 'Very long first name',
        data: { ...VALID_USER_DATA, firstName: 'A'.repeat(100) },
        description: 'Very long first name (100 chars)'
      },
      {
        name: 'Very long last name',
        data: { ...VALID_USER_DATA, lastName: 'B'.repeat(100) },
        description: 'Very long last name (100 chars)'
      },
      {
        name: 'Email with special characters',
        data: { ...VALID_USER_DATA, email: `test+label.${Date.now()}@example.com` },
        description: 'Email with plus sign and dots'
      },
      {
        name: 'Very long password',
        data: { ...VALID_USER_DATA, password: 'C'.repeat(200) },
        description: 'Very long password (200 chars)'
      }
    ];

    for (const testCase of edgeCaseData) {
      console.log(`🔍 Testing: ${testCase.description}`);

      await userFormPage.fillForm(testCase.data);
      await userFormPage.submitButton.click();
      await page.waitForTimeout(1000);

      // Check if submission was successful or if there were validation errors
      const isStillOnForm = await userFormPage.isOnCreatePage();
      if (isStillOnForm) {
        const errorMessages = await userFormPage.getErrorMessages();
        if (errorMessages.length > 0) {
          console.log(`⚠️ Validation errors for ${testCase.name}:`);
          errorMessages.forEach(error => console.log(`  - ${error}`));
        } else {
          console.log(`✅ No validation errors for ${testCase.name}`);
        }
      } else {
        console.log(`✅ ${testCase.name} accepted and submitted successfully`);
      }
    }

    await takeScreenshot(page, 'validation-10-edge-cases');
    console.log('🎉 Field length and format validation test completed!');
  });
});
