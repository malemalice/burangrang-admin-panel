# Playwright Test Generation Template

## Overview
This template is designed to generate comprehensive Playwright test code based on MCP (Model Context Protocol) Playwright testing. The process involves:

1. **MCP Testing First**: Use Playwright MCP to manually test the functionality
2. **Test Code Generation**: Create automated test code based on actual behavior observed
3. **Validation**: Ensure tests work across all browsers and devices

## Template Structure

### Step 1: MCP Testing Phase
Use this prompt to test functionality with Playwright MCP:

```
"Please test the [MODULE_NAME] functionality of my admin panel application. I want you to:

1. Navigate to the [MODULE_PAGE] page (http://localhost:8080/[PAGE_PATH])
2. Take a screenshot of the initial page
3. Test the [PRIMARY_FUNCTIONALITY] with valid data:
   - [FIELD_1]: [VALID_VALUE_1]
   - [FIELD_2]: [VALID_VALUE_2]
   - [FIELD_3]: [VALID_VALUE_3]
4. Verify the operation was successful
5. Take a screenshot of the success state
6. Test with invalid data to ensure error handling works
7. Take a screenshot of any error messages
8. Test edge cases like empty forms, invalid formats, etc.
9. Verify any navigation, redirects, or state changes
10. Check for proper data persistence and API integration

Please provide detailed feedback on what you observe during the testing process, including:
- Element selectors that work
- Error message patterns
- Navigation behavior
- Data storage mechanisms (localStorage, cookies, etc.)
- Network requests made
- Any timing issues or delays
- Mobile responsiveness observations"
```

### Step 2: Test Code Generation
Based on MCP testing results, create test code using this template:

```typescript
import { test, expect, Page } from '@playwright/test';

// Test data - Update based on your module
const TEST_DATA = {
  valid: {
    [FIELD_1]: '[VALID_VALUE_1]',
    [FIELD_2]: '[VALID_VALUE_2]',
    [FIELD_3]: '[VALID_VALUE_3]'
  },
  invalid: {
    [FIELD_1]: '[INVALID_VALUE_1]',
    [FIELD_2]: '[INVALID_VALUE_2]',
    [FIELD_3]: '[INVALID_VALUE_3]'
  }
};

// Helper function to take screenshot
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `screenshots/${name}.png`,
    fullPage: true 
  });
}

// Helper function to check specific data storage
async function checkDataStorage(page: Page): Promise<{ hasData: boolean; data: any }> {
  const result = await page.evaluate(() => {
    // Check localStorage, sessionStorage, or other storage mechanisms
    const data = localStorage.getItem('[STORAGE_KEY]');
    return {
      hasData: !!data,
      data: data ? JSON.parse(data) : null
    };
  });
  return result;
}

// Helper function to verify page state
async function isOnExpectedPage(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  return currentUrl.includes('[EXPECTED_PAGE_PATH]');
}

test.describe('[MODULE_NAME] Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies to ensure clean state
    await page.context().clearCookies();
    
    // Navigate to module page
    await page.goto('/[PAGE_PATH]');
    await page.waitForLoadState('networkidle');
    
    // Clear localStorage after navigation (when it's safe to do so)
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      console.log('Could not clear localStorage (this is expected in some browsers)');
    }
    
    // Wait for dynamic content to load
    await page.waitForTimeout(1000);
    
    // Take initial screenshot
    await takeScreenshot(page, '01-[module]-page-initial');
  });

  test('1. Navigate to [MODULE_NAME] page and verify elements', async ({ page }) => {
    // Verify we're on the correct page
    await expect(page).toHaveURL(/.*[PAGE_PATH]/);
    
    // Check for specific form elements based on actual implementation
    const [ELEMENT_1] = page.getByRole('[ROLE]', { name: '[ELEMENT_NAME]' });
    const [ELEMENT_2] = page.getByRole('[ROLE]', { name: '[ELEMENT_NAME]' });
    const [ACTION_BUTTON] = page.getByRole('button', { name: '[BUTTON_NAME]' });
    
    // Verify elements are visible
    await expect([ELEMENT_1]).toBeVisible();
    await expect([ELEMENT_2]).toBeVisible();
    await expect([ACTION_BUTTON]).toBeVisible();
    
    // Check for any optional elements (make them optional)
    const [OPTIONAL_ELEMENT] = page.locator('[SELECTOR]');
    const hasOptionalElement = await [OPTIONAL_ELEMENT].isVisible();
    if (hasOptionalElement) {
      console.log('✅ [Optional element] is visible');
    } else {
      console.log('ℹ️ [Optional element] not visible (this is optional)');
    }
    
    console.log('✅ [MODULE_NAME] page loaded successfully with all elements');
  });

  test('2. Test [PRIMARY_FUNCTIONALITY] with valid data', async ({ page }) => {
    // Fill in valid data using specific selectors
    const [FIELD_1_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [FIELD_2_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [SUBMIT_BUTTON] = page.getByRole('button', { name: '[BUTTON_NAME]' });
    
    await [FIELD_1_INPUT].fill(TEST_DATA.valid.[FIELD_1]);
    await [FIELD_2_INPUT].fill(TEST_DATA.valid.[FIELD_2]);
    
    // Take screenshot before action
    await takeScreenshot(page, '02-[module]-form-filled');
    
    // Perform action
    await [SUBMIT_BUTTON].click();
    
    // Wait for response with longer timeout
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Take screenshot after action
    await takeScreenshot(page, '03-after-[action]-attempt');
    
    // Check for success indicators
    const [SUCCESS_INDICATOR] = await checkDataStorage(page);
    console.log(`[Success indicator] present: ${[SUCCESS_INDICATOR].hasData}`);
    
    // Check if redirected or state changed
    const isOnExpectedPage = await isOnExpectedPage(page);
    console.log(`Redirected to expected page: ${isOnExpectedPage}`);
    console.log(`Current URL: ${page.url()}`);
    
    // Verify successful operation
    expect(isOnExpectedPage).toBeTruthy();
    expect([SUCCESS_INDICATOR].hasData).toBeTruthy();
    
    console.log('✅ Valid [PRIMARY_FUNCTIONALITY] test completed');
  });

  test('3. Test [PRIMARY_FUNCTIONALITY] with invalid data', async ({ page }) => {
    // Fill in invalid data using specific selectors
    const [FIELD_1_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [FIELD_2_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [SUBMIT_BUTTON] = page.getByRole('button', { name: '[BUTTON_NAME]' });
    
    await [FIELD_1_INPUT].fill(TEST_DATA.invalid.[FIELD_1]);
    await [FIELD_2_INPUT].fill(TEST_DATA.invalid.[FIELD_2]);
    
    // Take screenshot before action
    await takeScreenshot(page, '04-invalid-data-filled');
    
    // Perform action
    await [SUBMIT_BUTTON].click();
    
    // Wait for response and error message to appear
    await page.waitForTimeout(2000);
    
    // Take screenshot after action
    await takeScreenshot(page, '05-after-invalid-[action]');
    
    // Check for error message - look for various possible error message patterns
    const errorMessage = page.locator('[ERROR_SELECTOR]').filter({ hasText: /[ERROR_PATTERN]/i });
    const hasErrorMessage = await errorMessage.isVisible();
    
    if (hasErrorMessage) {
      const errorText = await errorMessage.textContent();
      console.log(`Error message displayed: ${errorText}`);
    } else {
      // Check if there are any other error indicators
      const anyError = page.locator('[ERROR_SELECTORS]');
      const errorCount = await anyError.count();
      console.log(`Found ${errorCount} potential error elements`);
      
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const text = await anyError.nth(i).textContent();
          console.log(`Error element ${i}: ${text}`);
          // Check if this element contains expected error text
          if (text && text.includes('[EXPECTED_ERROR_TEXT]')) {
            console.log('✅ Found expected error message');
            break;
          }
        }
      }
    }
    
    // Verify we're still on the same page or error is shown
    const stillOnPage = page.url().includes('/[PAGE_PATH]');
    expect(stillOnPage).toBeTruthy();
    
    // Check if any error element contains expected error text
    const hasExpectedError = await page.locator('text=[EXPECTED_ERROR_TEXT]').isVisible();
    if (hasExpectedError) {
      console.log('✅ Expected error message displayed');
    } else {
      console.log('ℹ️ No expected error message found, but stayed on page');
    }
    
    // Verify no data was stored
    const dataStorage = await checkDataStorage(page);
    expect(dataStorage.hasData).toBeFalsy();
    
    console.log('✅ Invalid [PRIMARY_FUNCTIONALITY] test completed');
  });

  test('4. Test empty form submission', async ({ page }) => {
    const [SUBMIT_BUTTON] = page.getByRole('button', { name: '[BUTTON_NAME]' });
    
    // Try to submit empty form
    await [SUBMIT_BUTTON].click();
    
    // Wait for response
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await takeScreenshot(page, '06-empty-form-submission');
    
    // Check for validation errors or error messages
    const validationErrors = page.locator('[ERROR_SELECTOR]').filter({ hasText: /[VALIDATION_PATTERN]/i });
    const hasValidationErrors = await validationErrors.count() > 0;
    
    if (hasValidationErrors) {
      console.log('✅ Form validation errors displayed for empty submission');
    }
    
    // Verify we're still on the same page
    const stillOnPage = page.url().includes('/[PAGE_PATH]');
    expect(stillOnPage).toBeTruthy();
    
    console.log('✅ Empty form submission test completed');
  });

  test('5. Test data persistence and storage', async ({ page }) => {
    // Perform valid operation first
    const [FIELD_1_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [FIELD_2_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [SUBMIT_BUTTON] = page.getByRole('button', { name: '[BUTTON_NAME]' });
    
    await [FIELD_1_INPUT].fill(TEST_DATA.valid.[FIELD_1]);
    await [FIELD_2_INPUT].fill(TEST_DATA.valid.[FIELD_2]);
    await [SUBMIT_BUTTON].click();
    
    // Wait for operation to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check data storage
    const dataStorage = await checkDataStorage(page);
    
    if (dataStorage.hasData) {
      console.log(`✅ Data stored: ${JSON.stringify(dataStorage.data)}`);
      
      // Verify data format if applicable
      if (dataStorage.data && typeof dataStorage.data === 'object') {
        expect(dataStorage.data).toHaveProperty('[EXPECTED_PROPERTY]');
      }
      
      // Take screenshot of successful data storage
      await takeScreenshot(page, '07-data-storage-verified');
    } else {
      console.log('❌ No data found in storage');
      console.log('ℹ️ This might be due to test isolation or different storage mechanism');
    }
  });

  test('6. Test [SECONDARY_FUNCTIONALITY] if applicable', async ({ page }) => {
    // First, perform valid operation
    const [FIELD_1_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [FIELD_2_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [SUBMIT_BUTTON] = page.getByRole('button', { name: '[BUTTON_NAME]' });
    
    await [FIELD_1_INPUT].fill(TEST_DATA.valid.[FIELD_1]);
    await [FIELD_2_INPUT].fill(TEST_DATA.valid.[FIELD_2]);
    await [SUBMIT_BUTTON].click();
    
    // Wait for operation to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify we're in the right state for secondary functionality
    const isReadyForSecondary = await isOnExpectedPage(page);
    if (!isReadyForSecondary) {
      console.log('❌ Not ready for secondary functionality - skipping test');
      return;
    }
    
    // Look for secondary functionality element
    const [SECONDARY_ELEMENT] = page.getByRole('[ROLE]', { name: '[ELEMENT_NAME]' });
    
    if (await [SECONDARY_ELEMENT].isVisible()) {
      // Take screenshot before secondary action
      await takeScreenshot(page, '08-before-[secondary-action]');
      
      // Perform secondary action
      await [SECONDARY_ELEMENT].click();
      
      // Wait for action to complete
      await page.waitForLoadState('networkidle');
      
      // Take screenshot after secondary action
      await takeScreenshot(page, '09-after-[secondary-action]');
      
      // Verify secondary action results
      const [SECONDARY_RESULT] = await checkDataStorage(page);
      expect([SECONDARY_RESULT].hasData).toBeFalsy(); // or appropriate expectation
      
      // Verify redirected to appropriate page
      const isOnFinalPage = page.url().includes('/[FINAL_PAGE_PATH]');
      expect(isOnFinalPage).toBeTruthy();
      
      console.log('✅ [SECONDARY_FUNCTIONALITY] test completed');
    } else {
      console.log('❌ [SECONDARY_ELEMENT] not found - skipping secondary functionality test');
    }
  });

  test('7. Test backend integration and API calls', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/[API_ENDPOINT]') || request.url().includes('/[MODULE_PATH]')) {
        requests.push(`${request.method()} ${request.url()}`);
      }
    });
    
    // Perform operation using specific selectors
    const [FIELD_1_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [FIELD_2_INPUT] = page.getByRole('[ROLE]', { name: '[FIELD_NAME]' });
    const [SUBMIT_BUTTON] = page.getByRole('button', { name: '[BUTTON_NAME]' });
    
    await [FIELD_1_INPUT].fill(TEST_DATA.valid.[FIELD_1]);
    await [FIELD_2_INPUT].fill(TEST_DATA.valid.[FIELD_2]);
    await [SUBMIT_BUTTON].click();
    
    // Wait for network requests to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Log network requests
    console.log('Network requests made:');
    requests.forEach(req => console.log(`  ${req}`));
    
    // Verify successful operation
    const isOnExpectedPage = await isOnExpectedPage(page);
    const dataStorage = await checkDataStorage(page);
    
    expect(isOnExpectedPage).toBeTruthy();
    expect(dataStorage.hasData).toBeTruthy();
    
    // Take final screenshot
    await takeScreenshot(page, '10-[module]-integration-complete');
    
    console.log('✅ Backend integration test completed');
  });
});
```

### Step 3: Configuration Updates
Update `playwright.config.ts` if needed:

```typescript
// Add any module-specific configuration
// Ensure proper timeouts and settings
```

### Step 4: Package.json Scripts
Add module-specific test scripts:

```json
{
  "scripts": {
    "test:[module]": "playwright test tests/[module].spec.ts",
    "test:[module]:headed": "playwright test tests/[module].spec.ts --headed",
    "test:[module]:debug": "playwright test tests/[module].spec.ts --debug"
  }
}
```

## Usage Instructions

### For New Modules:

1. **Replace Placeholders**: Update all `[PLACEHOLDER]` values with actual module-specific information
2. **MCP Testing**: Run the MCP testing prompt first to understand actual behavior
3. **Update Selectors**: Replace generic selectors with actual ones discovered during MCP testing
4. **Customize Helpers**: Modify helper functions based on your module's specific needs
5. **Test Data**: Update test data with realistic values for your module
6. **Error Patterns**: Update error message patterns based on actual application behavior
7. **API Endpoints**: Replace API endpoint patterns with actual endpoints
8. **Screenshots**: Update screenshot names to be module-specific

### Key Principles:

- **Test Real Behavior**: Always use MCP testing first to understand actual behavior
- **Robust Selectors**: Use role-based selectors when possible, fallback to specific selectors
- **Error Handling**: Make error detection flexible and informative
- **Screenshots**: Capture screenshots at key points for debugging
- **Sequential Tests**: Use `fullyParallel: false` to prevent test interference
- **Clean State**: Clear storage between tests for isolation
- **Detailed Logging**: Include comprehensive console logging for debugging

### Common Patterns:

- **Form Testing**: Fill → Submit → Verify → Screenshot
- **Error Testing**: Invalid Data → Submit → Check Error → Verify State
- **Navigation Testing**: Action → Wait → Verify URL → Check State
- **Data Persistence**: Action → Check Storage → Verify Format
- **API Integration**: Monitor Requests → Verify Calls → Check Response

## Example Usage

For a "User Management" module:

1. Replace `[MODULE_NAME]` with "User Management"
2. Replace `[PAGE_PATH]` with "users"
3. Replace `[PRIMARY_FUNCTIONALITY]` with "user creation"
4. Replace field names with actual form fields
5. Update selectors based on MCP testing results
6. Customize error patterns and success indicators

This template ensures consistent, comprehensive test coverage across all modules while being flexible enough to adapt to different functionality patterns.
