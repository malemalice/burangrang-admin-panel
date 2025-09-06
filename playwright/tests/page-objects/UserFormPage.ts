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

    // Dropdown selections - get UUIDs
    if (userData.role) {
      selectedIds.roleId = await this.selectRole(userData.role);
    }

    if (userData.office) {
      selectedIds.officeId = await this.selectOffice(userData.office);
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

      const option = this.page.locator('[role="option"], .option').filter({ hasText: roleName });
      const optionVisible = await option.isVisible({ timeout: 2000 });

      console.log(`📊 Role option "${roleName}" visible: ${optionVisible}`);

      if (optionVisible) {
        // Get the value attribute (UUID) before clicking
        selectedRoleId = await option.getAttribute('data-value') || await option.getAttribute('value');
        console.log(`🔑 Role UUID: ${selectedRoleId}`);

        console.log('✅ Clicking role option...');
        await option.click({ force: true });
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

      const option = this.page.locator('[role="option"], .option').filter({ hasText: officeName });
      const optionVisible = await option.isVisible({ timeout: 2000 });

      console.log(`📊 Office option "${officeName}" visible: ${optionVisible}`);

      if (optionVisible) {
        // Get the value attribute (UUID) before clicking
        selectedOfficeId = await option.getAttribute('data-value') || await option.getAttribute('value');
        console.log(`🏢 Office UUID: ${selectedOfficeId}`);

        console.log('✅ Clicking office option...');
        await option.click({ force: true });
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

    // Click the submit button
    await this.submitButton.click();
    console.log('✅ Submit button clicked');

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
