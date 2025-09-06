import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from './utils/test-helpers';

test('Test direct navigation to user creation', async ({ page }) => {
  const { loginPage } = await setupAuthenticatedSession(page);

  // Login
  await loginPage.goto();
  await loginPage.login('admin@example.com', 'admin');
  console.log('✅ Logged in successfully');

  // Navigate directly to users page
  await page.goto('/users');
  await page.waitForLoadState('networkidle');
  console.log(`📍 Users page URL: ${page.url()}`);

  // Check if Add User button exists
  const addUserButton = page.locator('button').filter({ hasText: /add user|create user/i });
  const hasAddButton = await addUserButton.isVisible();
  console.log(`📊 Add User button visible: ${hasAddButton}`);

  if (hasAddButton) {
    // Use multiple strategies to handle sidebar overlay
    let clicked = false;

    // Strategy 1: CSS override
    try {
      await page.addStyleTag({
        content: `
          aside[class*="sidebar"], aside[class*="fixed"] {
            pointer-events: none !important;
            z-index: -1 !important;
          }
        `
      });
      await addUserButton.click();
      clicked = true;
      console.log('✅ Clicked Add User button using CSS override');
    } catch (error) {
      console.log('⚠️ CSS override failed, trying force click...');
    }

    // Strategy 2: Force click
    if (!clicked) {
      try {
        await addUserButton.click({ force: true });
        clicked = true;
        console.log('✅ Clicked Add User button using force click');
      } catch (error) {
        console.log('⚠️ Force click failed, trying JavaScript click...');
      }
    }

    // Strategy 3: JavaScript click
    if (!clicked) {
      try {
        await addUserButton.evaluate(button => (button as HTMLElement).click());
        clicked = true;
        console.log('✅ Clicked Add User button using JavaScript click');
      } catch (error) {
        console.log('❌ All click strategies failed');
        throw error;
      }
    }

    await page.waitForLoadState('networkidle');

    const afterClickUrl = page.url();
    console.log(`📍 URL after Add User click: ${afterClickUrl}`);

    // Check if we're on the create page
    if (afterClickUrl.includes('/users/new')) {
      console.log('✅ Successfully navigated to user creation page');

      // Wait a bit for any async loading
      await page.waitForTimeout(2000);

      // Take a screenshot to see what's actually rendered
      await page.screenshot({ path: 'screenshots/user-create-page-actual.png', fullPage: true });
      console.log('📸 Screenshot saved: screenshots/user-create-page-actual.png');

      // Get page content for debugging
      const pageContent = await page.textContent('body');
      console.log(`📄 Page content length: ${pageContent?.length || 0} characters`);

      // Look for any error messages
      const errorElements = page.locator('.error, [role="alert"], .text-red-600, .text-destructive');
      const errorCount = await errorElements.count();
      console.log(`🚨 Error elements found: ${errorCount}`);

      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorElements.nth(i).textContent();
          console.log(`  Error ${i + 1}: ${errorText}`);
        }
      }

      // Look for any loading indicators
      const loadingElements = page.locator('.loading, .spinner, [aria-busy="true"]');
      const loadingCount = await loadingElements.count();
      console.log(`⏳ Loading elements found: ${loadingCount}`);

      // Check for form-related content
      const formElements = page.locator('form, [role="form"]');
      const formCount = await formElements.count();
      console.log(`📝 Form elements found: ${formCount}`);

      // Check for input fields with different selectors
      const inputFields = page.locator('input');
      const inputCount = await inputFields.count();
      console.log(`📝 Input fields found: ${inputCount}`);

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const inputType = await inputFields.nth(i).getAttribute('type');
        const inputPlaceholder = await inputFields.nth(i).getAttribute('placeholder');
        console.log(`  Input ${i + 1}: type="${inputType}", placeholder="${inputPlaceholder}"`);
      }

      // Check for buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      console.log(`🔘 Buttons found: ${buttonCount}`);

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const buttonText = await buttons.nth(i).textContent();
        console.log(`  Button ${i + 1}: "${buttonText}"`);
      }

      // Check if we're looking at a blank page or error
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      console.log(`📰 Headings found: ${headingCount}`);

      for (let i = 0; i < headingCount; i++) {
        const headingText = await headings.nth(i).textContent();
        console.log(`  Heading ${i + 1}: "${headingText}"`);
      }

      // Check for specific form elements with more flexible selectors
      const emailField = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email"]');
      const firstNameField = page.locator('input[name*="first"], input[name*="name"], input[placeholder*="first"]');
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /create|save|submit|add/i });

      const hasEmailField = await emailField.isVisible();
      const hasFirstNameField = await firstNameField.isVisible();
      const hasSubmitButton = await submitButton.isVisible();

      console.log(`📊 Form elements found: Email: ${hasEmailField}, First Name: ${hasFirstNameField}, Submit: ${hasSubmitButton}`);

      if (hasEmailField && hasFirstNameField && hasSubmitButton) {
        console.log('✅ User creation form is properly loaded');
      } else {
        console.log('❌ User creation form is missing elements');
        console.log('🔍 This might indicate:');
        console.log('  - UserForm component not rendering');
        console.log('  - API calls failing to load data (roles, offices, etc.)');
        console.log('  - React routing issue');
        console.log('  - Component error state');
      }
    } else {
      console.log(`❌ Did not navigate to /users/new, went to: ${afterClickUrl}`);
    }
  } else {
    console.log('❌ Add User button not found');
  }

  await page.screenshot({ path: 'screenshots/navigation-test-result.png', fullPage: true });
});
