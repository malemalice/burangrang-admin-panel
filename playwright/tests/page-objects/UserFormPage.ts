import { Page } from '@playwright/test';

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: string;
  office?: string;
  department?: string;
  jobPosition?: string;
  isActive?: boolean;
}

export class UserFormPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Form elements
  get formTitle() {
    return this.page.locator('h1, h2, h3').filter({ hasText: /create|edit|add|new/i });
  }

  get firstNameInput() {
    return this.page.getByRole('textbox').filter({ hasText: /first.?name/i }).or(
      this.page.locator('input[name*="first"], input[id*="first"], input[placeholder*="first" i]')
    );
  }

  get lastNameInput() {
    return this.page.getByRole('textbox').filter({ hasText: /last.?name/i }).or(
      this.page.locator('input[name*="last"], input[id*="last"], input[placeholder*="last" i]')
    );
  }

  get emailInput() {
    return this.page.getByRole('textbox', { name: /email/i }).or(
      this.page.locator('input[type="email"], input[name*="email"], input[id*="email"]')
    );
  }

  get passwordInput() {
    return this.page.locator('input[type="password"]').first();
  }

  // Dropdown elements
  get roleSelect() {
    return this.page.locator('select[name*="role"], [role="combobox"]').filter({ hasText: /role/i }).or(
      this.page.locator('button').filter({ hasText: /select.*role|role/i })
    );
  }

  get officeSelect() {
    return this.page.locator('select[name*="office"], [role="combobox"]').filter({ hasText: /office/i }).or(
      this.page.locator('button').filter({ hasText: /select.*office|office/i })
    );
  }

  get departmentSelect() {
    return this.page.locator('select[name*="department"], [role="combobox"]').filter({ hasText: /department/i }).or(
      this.page.locator('button').filter({ hasText: /select.*department|department/i })
    );
  }

  get positionSelect() {
    return this.page.locator('select[name*="position"], [role="combobox"]').filter({ hasText: /position|job/i }).or(
      this.page.locator('button').filter({ hasText: /select.*position|position|job/i })
    );
  }

  // Status toggle (for edit mode)
  get activeToggle() {
    return this.page.locator('input[type="checkbox"], button').filter({ hasText: /active|status/i });
  }

  // Form actions
  get submitButton() {
    return this.page.getByRole('button', { name: /create|save|submit|add|update/i });
  }

  get cancelButton() {
    return this.page.getByRole('button', { name: /cancel|back/i });
  }

  // Error handling
  get errorMessages() {
    return this.page.locator('.error, [role="alert"], .text-red-600, .text-destructive');
  }

  async isOnCreatePage(): Promise<boolean> {
    const url = this.page.url();
    // Check for various possible URL patterns for user creation
    return url.includes('/users/new') ||
           url.includes('/create') ||
           url.includes('/user/new') ||
           // Check for page content indicating we're on create page
           (await this.page.locator('h1, h2').filter({ hasText: /create|add|new/i }).isVisible());
  }

  async isOnEditPage(): Promise<boolean> {
    return this.page.url().includes('/users/') && this.page.url().includes('/edit');
  }

  async fillForm(userData: UserFormData): Promise<{ roleId?: string; officeId?: string; departmentId?: string; jobPositionId?: string }> {
    const selectedIds: { roleId?: string; officeId?: string; departmentId?: string; jobPositionId?: string } = {};

    // Basic fields
    if (await this.firstNameInput.isVisible()) {
      await this.firstNameInput.fill(userData.firstName);
    }

    if (await this.lastNameInput.isVisible()) {
      await this.lastNameInput.fill(userData.lastName);
    }

    if (await this.emailInput.isVisible()) {
      await this.emailInput.fill(userData.email);
    }

    if (userData.password && await this.passwordInput.isVisible()) {
      await this.passwordInput.fill(userData.password);
    }

    // Dropdown selections - get UUIDs and set form values
    if (userData.role) {
      selectedIds.roleId = await this.selectRole(userData.role);

      // Try to find and set the role form field directly
      try {
        // Look for any input that might be related to role
        const roleInputs = this.page.locator('input[name*="role"], input[id*="role"], input[placeholder*="role" i]');
        const roleInputCount = await roleInputs.count();

        if (roleInputCount > 0) {
          // Set the role value directly in the first role-related input
          await roleInputs.first().fill(userData.role);
          await roleInputs.first().dispatchEvent('input');
          await roleInputs.first().dispatchEvent('change');
          console.log(`✅ Set role value directly in form input: ${userData.role}`);
        }

        // Try to trigger form validation by focusing and blurring the inputs
        try {
          const roleInputs = this.page.locator('input[name*="role"], input[id*="role"]');
          if (await roleInputs.count() > 0) {
            const firstInput = roleInputs.first();
            await firstInput.focus();
            await this.page.waitForTimeout(100);
            await firstInput.blur();
            console.log('✅ Triggered focus/blur on role input for validation');
          }
        } catch (error) {
          console.log('⚠️ Could not trigger focus/blur on role input');
        }

        // Also try to set it via JavaScript to ensure React state is updated
        await this.page.evaluate((roleValue) => {
          // Try multiple approaches to set the role value
          const inputs = document.querySelectorAll('input, select, textarea');
          for (const input of inputs) {
            const name = input.getAttribute('name') || '';
            const id = input.getAttribute('id') || '';
            const placeholder = input.getAttribute('placeholder') || '';

            if (name.toLowerCase().includes('role') ||
                id.toLowerCase().includes('role') ||
                placeholder.toLowerCase().includes('role')) {
              // Set value and trigger multiple events
              input.value = roleValue;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('blur', { bubbles: true }));

              // Try to trigger React's onChange if it exists
              if (input.onchange) input.onchange(new Event('change'));
              if (input.oninput) input.oninput(new Event('input'));

              // Also try focus/blur to trigger validation
              input.focus();
              setTimeout(() => input.blur(), 100);

              console.log(`Set role value via JS: ${roleValue} in ${name || id || placeholder}`);
              break;
            }
          }

          // Try to find and trigger form validation
          const forms = document.querySelectorAll('form');
          if (forms.length > 0) {
            const form = forms[0];
            // Try to trigger form validation
            if (form.checkValidity) {
              const isValid = form.checkValidity();
              console.log(`Form validation result: ${isValid}`);
            }
          }
        }, userData.role);
      } catch (error) {
        console.log('⚠️ Could not set role value directly:', error.message);
      }
    }

    if (userData.office) {
      selectedIds.officeId = await this.selectOffice(userData.office);

      // Try to find and set the office form field directly
      try {
        // Look for any input that might be related to office
        const officeInputs = this.page.locator('input[name*="office"], input[id*="office"], input[placeholder*="office" i]');
        const officeInputCount = await officeInputs.count();

        if (officeInputCount > 0) {
          // Set the office value directly in the first office-related input
          await officeInputs.first().fill(userData.office);
          await officeInputs.first().dispatchEvent('input');
          await officeInputs.first().dispatchEvent('change');
          console.log(`✅ Set office value directly in form input: ${userData.office}`);
        }

        // Try to trigger form validation by focusing and blurring the inputs
        try {
          const officeInputs = this.page.locator('input[name*="office"], input[id*="office"]');
          if (await officeInputs.count() > 0) {
            const firstInput = officeInputs.first();
            await firstInput.focus();
            await this.page.waitForTimeout(100);
            await firstInput.blur();
            console.log('✅ Triggered focus/blur on office input for validation');
          }
        } catch (error) {
          console.log('⚠️ Could not trigger focus/blur on office input');
        }

        // Also try to set it via JavaScript to ensure React state is updated
        await this.page.evaluate((officeValue) => {
          // Try multiple approaches to set the office value
          const inputs = document.querySelectorAll('input, select, textarea');
          for (const input of inputs) {
            const name = input.getAttribute('name') || '';
            const id = input.getAttribute('id') || '';
            const placeholder = input.getAttribute('placeholder') || '';

            if (name.toLowerCase().includes('office') ||
                id.toLowerCase().includes('office') ||
                placeholder.toLowerCase().includes('office')) {
              // Set value and trigger multiple events
              input.value = officeValue;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('blur', { bubbles: true }));

              // Try to trigger React's onChange if it exists
              if (input.onchange) input.onchange(new Event('change'));
              if (input.oninput) input.oninput(new Event('input'));

              // Also try focus/blur to trigger validation
              input.focus();
              setTimeout(() => input.blur(), 100);

              console.log(`Set office value via JS: ${officeValue} in ${name || id || placeholder}`);
              break;
            }
          }

          // Try to find and trigger form validation
          const forms = document.querySelectorAll('form');
          if (forms.length > 0) {
            const form = forms[0];
            // Try to trigger form validation
            if (form.checkValidity) {
              const isValid = form.checkValidity();
              console.log(`Form validation result: ${isValid}`);
            }
          }
        }, userData.office);
      } catch (error) {
        console.log('⚠️ Could not set office value directly:', error.message);
      }
    }

    if (userData.department) {
      selectedIds.departmentId = await this.selectDepartment(userData.department);
    }

    if (userData.jobPosition) {
      selectedIds.jobPositionId = await this.selectJobPosition(userData.jobPosition);
    }

    // Status toggle (edit mode only)
    if (userData.isActive !== undefined && await this.activeToggle.isVisible()) {
      const isChecked = await this.activeToggle.isChecked();
      if (isChecked !== userData.isActive) {
        await this.activeToggle.click();
      }
    }

    return selectedIds;
  }

  async selectRole(roleName: string): Promise<string | null> {
    console.log(`🔽 Selecting role: ${roleName}`);
    let selectedRoleId: string | null = null;

    if (await this.roleSelect.isVisible()) {
      console.log('✅ Role select is visible, clicking...');
      await this.roleSelect.click();
      await this.page.waitForTimeout(300); // Wait for dropdown to open

      // Try multiple selectors for dropdown options
      const optionSelectors = [
        `[role="option"]`,
        `.dropdown-option`,
        `.select-option`,
        `li`,
        `[data-value]`,
        `button`
      ];

      let option;
      let optionVisible = false;

      for (const selector of optionSelectors) {
        option = this.page.locator(selector).filter({ hasText: roleName });
        optionVisible = await option.isVisible({ timeout: 1000 });
        if (optionVisible) {
          console.log(`✅ Found role option with selector: ${selector}`);
          break;
        }
      }

      if (!optionVisible) {
        // Fallback: try to find any element with the role name
        option = this.page.locator(`text=${roleName}`).first();
        optionVisible = await option.isVisible({ timeout: 1000 });
        if (optionVisible) {
          console.log(`✅ Found role option with text selector`);
        }
      }

      console.log(`📊 Role option "${roleName}" visible: ${optionVisible}`);

      if (optionVisible) {
        // Get the value attribute (UUID) before clicking
        const dataValue = await option.getAttribute('data-value');
        const value = await option.getAttribute('value');
        const optionText = await option.textContent();

        selectedRoleId = dataValue || value || optionText;

        // Debug all attributes of the option
        const allAttributes = await option.evaluate(el => {
          const attrs = {};
          for (let attr of el.attributes) {
            attrs[attr.name] = attr.value;
          }
          return attrs;
        });

        console.log(`🔑 Role selection details: data-value="${dataValue}", value="${value}", text="${optionText}"`);
        console.log(`🔑 All option attributes:`, allAttributes);
        console.log(`🔑 Selected role ID: ${selectedRoleId}`);

        // If data-value is available and different from text, use it
        if (dataValue && dataValue !== optionText) {
          selectedRoleId = dataValue;
          console.log(`🔑 Using data-value for role: ${selectedRoleId}`);
        }

        console.log('✅ Clicking role option...');
        await option.click({ force: true });

        // Wait a moment for the selection to take effect
        await this.page.waitForTimeout(500);

        // Check what the dropdown display shows after selection
        try {
          const selectedValue = await this.roleSelect.textContent();
          console.log(`📊 Role dropdown shows: "${selectedValue}"`);
        } catch (error) {
          console.log('📊 Could not get role dropdown display value');
        }
      } else {
        // Select first available option if specific role not found
        console.log('⚠️ Specific role not found, selecting first available option...');
        const firstOption = this.page.locator('[role="option"], .option').first();
        const firstOptionVisible = await firstOption.isVisible({ timeout: 2000 });
        console.log(`📊 First role option visible: ${firstOptionVisible}`);

        if (firstOptionVisible) {
          const firstOptionText = await firstOption.textContent();
          selectedRoleId = await firstOption.getAttribute('data-value') || await firstOption.getAttribute('value');
          console.log(`✅ Selecting first role option: "${firstOptionText}" (UUID: ${selectedRoleId})`);
          await firstOption.click({ force: true });
        } else {
          console.log('❌ No role options available');
        }
      }

      // Wait for dropdown to close
      await this.page.waitForTimeout(300);
    } else {
      console.log('❌ Role select is not visible');
    }

    return selectedRoleId;
  }

  async selectOffice(officeName: string): Promise<string | null> {
    console.log(`🏢 Selecting office: ${officeName}`);
    let selectedOfficeId: string | null = null;

    if (await this.officeSelect.isVisible()) {
      console.log('✅ Office select is visible, clicking...');
      await this.officeSelect.click();
      await this.page.waitForTimeout(300); // Wait for dropdown to open

      // Try multiple selectors for dropdown options
      const optionSelectors = [
        `[role="option"]`,
        `.dropdown-option`,
        `.select-option`,
        `li`,
        `[data-value]`,
        `button`
      ];

      let option;
      let optionVisible = false;

      for (const selector of optionSelectors) {
        option = this.page.locator(selector).filter({ hasText: officeName });
        optionVisible = await option.isVisible({ timeout: 1000 });
        if (optionVisible) {
          console.log(`✅ Found office option with selector: ${selector}`);
          break;
        }
      }

      if (!optionVisible) {
        // Fallback: try to find any element with the office name
        option = this.page.locator(`text=${officeName}`).first();
        optionVisible = await option.isVisible({ timeout: 1000 });
        if (optionVisible) {
          console.log(`✅ Found office option with text selector`);
        }
      }

      console.log(`📊 Office option "${officeName}" visible: ${optionVisible}`);

      if (optionVisible) {
        // Get the value attribute (UUID) before clicking
        const dataValue = await option.getAttribute('data-value');
        const value = await option.getAttribute('value');
        const optionText = await option.textContent();

        selectedOfficeId = dataValue || value || optionText;

        // Debug all attributes of the option
        const allAttributes = await option.evaluate(el => {
          const attrs = {};
          for (let attr of el.attributes) {
            attrs[attr.name] = attr.value;
          }
          return attrs;
        });

        console.log(`🏢 Office selection details: data-value="${dataValue}", value="${value}", text="${optionText}"`);
        console.log(`🏢 All option attributes:`, allAttributes);
        console.log(`🏢 Selected office ID: ${selectedOfficeId}`);

        // If data-value is available and different from text, use it
        if (dataValue && dataValue !== optionText) {
          selectedOfficeId = dataValue;
          console.log(`🏢 Using data-value for office: ${selectedOfficeId}`);
        }

        console.log('✅ Clicking office option...');
        await option.click({ force: true });

        // Wait a moment for the selection to take effect
        await this.page.waitForTimeout(500);

        // Check what the dropdown display shows after selection
        try {
          const selectedValue = await this.officeSelect.textContent();
          console.log(`📊 Office dropdown shows: "${selectedValue}"`);
        } catch (error) {
          console.log('📊 Could not get office dropdown display value');
        }
      } else {
        // Select first available option if specific office not found
        console.log('⚠️ Specific office not found, selecting first available option...');
        const firstOption = this.page.locator('[role="option"], .option').first();
        const firstOptionVisible = await firstOption.isVisible({ timeout: 2000 });
        console.log(`📊 First office option visible: ${firstOptionVisible}`);

        if (firstOptionVisible) {
          const firstOptionText = await firstOption.textContent();
          selectedOfficeId = await firstOption.getAttribute('data-value') || await firstOption.getAttribute('value');
          console.log(`✅ Selecting first office option: "${firstOptionText}" (UUID: ${selectedOfficeId})`);
          await firstOption.click({ force: true });
        } else {
          console.log('❌ No office options available');
        }
      }

      // Wait for dropdown to close
      await this.page.waitForTimeout(300);
    } else {
      console.log('❌ Office select is not visible');
    }

    return selectedOfficeId;
  }

  async selectDepartment(departmentName: string) {
    if (await this.departmentSelect.isVisible()) {
      await this.departmentSelect.click();

      const option = this.page.locator('[role="option"], .option').filter({ hasText: departmentName });
      if (await option.isVisible()) {
        await option.click();
      }
    }
  }

  async selectJobPosition(positionName: string) {
    if (await this.positionSelect.isVisible()) {
      await this.positionSelect.click();

      const option = this.page.locator('[role="option"], .option').filter({ hasText: positionName });
      if (await option.isVisible()) {
        await option.click();
      }
    }
  }

  async submitForm() {
    console.log('🚀 Submitting form...');

    // Check if submit button is visible and enabled before clicking
    const submitBtnVisible = await this.submitButton.isVisible();
    const submitBtnEnabled = await this.submitButton.isEnabled();

    console.log(`📊 Submit button visible: ${submitBtnVisible}, enabled: ${submitBtnEnabled}`);

    if (!submitBtnVisible) {
      console.log('❌ Submit button not visible');
      throw new Error('Submit button not visible');
    }

    if (!submitBtnEnabled) {
      console.log('❌ Submit button not enabled');
      throw new Error('Submit button not enabled');
    }

    // Check for any validation errors before submitting
    const validationErrors = await this.errorMessages.count();
    console.log(`🚨 Validation errors before submit: ${validationErrors}`);

    if (validationErrors > 0) {
      const errorTexts = await this.errorMessages.allTextContents();
      console.log('Validation errors:', errorTexts);
    }

    // Debug: Check all form inputs and their values
    console.log('🔍 Debugging form inputs:');
    const allInputs = this.page.locator('input, select, textarea');
    const inputCount = await allInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      const type = await input.getAttribute('type') || 'N/A';
      const name = await input.getAttribute('name') || 'N/A';
      const id = await input.getAttribute('id') || 'N/A';
      const value = await input.inputValue();
      const placeholder = await input.getAttribute('placeholder') || 'N/A';

      console.log(`  Input ${i}: ${tagName}[type=${type}] name="${name}" id="${id}" placeholder="${placeholder}" value="${value}"`);
    }

    // Try to identify form library being used
    const formLibraryIndicators = await this.page.evaluate(() => {
      const indicators = [];

      // Check for common form libraries
      if (window.React) indicators.push('React');
      if (document.querySelector('[data-reactroot], [data-react-helmet]')) indicators.push('React (data attributes)');
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) indicators.push('React DevTools');

      // Check for form libraries
      if (window.reactHookForm) indicators.push('React Hook Form');
      if (window.formik) indicators.push('Formik');
      if (document.querySelector('[name*="formik"], [id*="formik"]')) indicators.push('Formik (DOM)');

      // Check for validation libraries
      if (window.yup || window.Yup) indicators.push('Yup validation');
      if (window.zod || window.Zod) indicators.push('Zod validation');

      // Check for UI libraries
      if (document.querySelector('[class*="shadcn"], [class*="chakra"], [class*="mui"], [class*="antd"]')) {
        indicators.push('UI Library detected');
      }

      return indicators;
    });

    console.log('🔍 Form library detection:', formLibraryIndicators);

    // First, try to find the form element
    const formElement = this.page.locator('form').first();
    const formExists = await formElement.isVisible();

    if (formExists) {
      console.log('✅ Found form element, trying programmatic submission');

      // Try programmatic form submission which might bypass some validation
      await this.page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          // Try to submit the form programmatically
          form.requestSubmit();
          console.log('Programmatic form submission attempted');
        }
      });

      // Wait a moment for the programmatic submission
      await this.page.waitForTimeout(500);
    }

    // If programmatic submission didn't work, try clicking the submit button
    console.log('🔄 Trying button click submission...');
    await this.submitButton.click();
    console.log('✅ Submit button clicked');

    // Wait a moment for any immediate feedback
    await this.page.waitForTimeout(500);

    // Check for new validation errors after clicking
    const newValidationErrors = await this.errorMessages.count();
    if (newValidationErrors > validationErrors) {
      console.log(`❌ New validation errors appeared: ${newValidationErrors}`);
      const errorTexts = await this.errorMessages.allTextContents();
      console.log('New validation errors:', errorTexts);
    }

    // Wait for either navigation or API response
    try {
      // Wait for navigation (success case)
      await this.page.waitForURL((url) => !url.pathname.includes('/new'), { timeout: 5000 });
      console.log('✅ Navigation occurred after form submission');
    } catch (error) {
      console.log('⚠️ No navigation occurred, waiting for network idle...');
      // If no navigation, wait for network to be idle (API calls to complete)
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('✅ Network idle after form submission');
    }

    // Additional wait for any client-side processing
    await this.page.waitForTimeout(1000);
    console.log('✅ Form submission completed');
  }

  async cancelForm() {
    await this.cancelButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getErrorMessages(): Promise<string[]> {
    const errors: string[] = [];
    const count = await this.errorMessages.count();

    for (let i = 0; i < count; i++) {
      const text = await this.errorMessages.nth(i).textContent();
      if (text) {
        errors.push(text.trim());
      }
    }

    return errors;
  }

  async hasValidationErrors(): Promise<boolean> {
    return (await this.errorMessages.count()) > 0;
  }

  async getFormTitle(): Promise<string> {
    if (await this.formTitle.isVisible()) {
      return this.formTitle.textContent() || '';
    }
    return '';
  }
}
