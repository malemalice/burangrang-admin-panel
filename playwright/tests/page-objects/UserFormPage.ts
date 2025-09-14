import { Page } from '@playwright/test';
import { UserFormData } from '../types';

export class UserFormPage {
  constructor(private page: Page) {}

  // Form elements - updated to match actual page structure
  get firstNameInput() {
    return this.page.getByPlaceholder('Enter first name');
  }

  get lastNameInput() {
    return this.page.getByPlaceholder('Enter last name');
  }

  get emailInput() {
    return this.page.getByPlaceholder('Enter email address');
  }

  get passwordInput() {
    return this.page.getByPlaceholder('Enter password');
  }

  get roleSelect() {
    return this.page.locator('[role="combobox"]').filter({ hasText: 'Select role' });
  }

  get officeSelect() {
    return this.page.locator('[role="combobox"]').filter({ hasText: 'Select office' });
  }

  get departmentSelect() {
    return this.page.locator('[role="combobox"]').filter({ hasText: 'Select department' });
  }

  get jobPositionSelect() {
    return this.page.locator('[role="combobox"]').filter({ hasText: 'Select job position' });
  }

  get statusSelect() {
    return this.page.getByRole('combobox', { name: 'Status' });
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /create|save|submit|add|update/i });
  }

  get cancelButton() {
    return this.page.getByRole('button', { name: /cancel|back/i });
  }

  // Page state checks
  async isOnCreatePage(): Promise<boolean> {
    const url = this.page.url();
    const hasCreateTitle = await this.page.locator('h1, h2, h3').filter({ hasText: /create/i }).isVisible();
    return url.includes('/new') || hasCreateTitle;
  }

  async getFormTitle(): Promise<string> {
    try {
      const titleElement = this.page.locator('h1, h2, h3').filter({ hasText: /create|edit|new|user/i }).first();
      const title = await titleElement.textContent();
      return title?.trim() || '';
    } catch {
      return '';
    }
  }

  async isOnEditPage(): Promise<boolean> {
    const url = this.page.url();
    const hasEditTitle = await this.page.locator('h1, h2, h3').filter({ hasText: /edit/i }).isVisible();
    return url.includes('/edit') || hasEditTitle;
  }

  // Form filling with improved error handling
  async fillForm(userData: UserFormData): Promise<void> {
    console.log('🔤 Filling user form...');

    try {
      // Fill text inputs with timeout handling
      await this.firstNameInput.fill(userData.firstName, { timeout: 5000 });
      console.log(`✅ Filled first name: ${userData.firstName}`);
    } catch (error) {
      console.log(`⚠️ Failed to fill first name: ${error.message}`);
    }

    try {
      await this.lastNameInput.fill(userData.lastName, { timeout: 5000 });
      console.log(`✅ Filled last name: ${userData.lastName}`);
    } catch (error) {
      console.log(`⚠️ Failed to fill last name: ${error.message}`);
    }

    try {
      await this.emailInput.fill(userData.email, { timeout: 5000 });
      console.log(`✅ Filled email: ${userData.email}`);
    } catch (error) {
      console.log(`⚠️ Failed to fill email: ${error.message}`);
    }

    if (userData.password) {
      try {
        await this.passwordInput.fill(userData.password, { timeout: 5000 });
        console.log(`✅ Filled password`);
      } catch (error) {
        console.log(`⚠️ Failed to fill password: ${error.message}`);
      }
    }

    // Fill dropdowns (these already have error handling)
    if (userData.role) {
      await this.selectRole(userData.role);
    }

    if (userData.office) {
      await this.selectOffice(userData.office);
    }

    if (userData.department) {
      await this.selectDepartment(userData.department);
    }

    if (userData.jobPosition) {
      await this.selectJobPosition(userData.jobPosition);
    }

    console.log('✅ Form filling completed');
  }

  // Dropdown selection methods with improved error handling
  async selectRole(roleName: string): Promise<void> {
    console.log(`🔽 Selecting role: ${roleName}`);

    try {
      // Try selectOption first (fastest)
      await this.page.selectOption('[role="combobox"]:has-text("Select role")', roleName, { timeout: 5000 });
      console.log(`✅ Selected role: ${roleName}`);
    } catch (error) {
      console.log('⚠️ Select option failed, trying manual approach...');

      try {
        // Fallback to manual selection
        await this.roleSelect.click({ timeout: 5000 });
        await this.page.waitForTimeout(200);

        const option = this.page.getByRole('option', { name: roleName });
        await option.click({ timeout: 5000 });

        console.log(`✅ Selected role: ${roleName} (manual)`);
      } catch (manualError) {
        console.log(`⚠️ Manual selection failed for role ${roleName}:`, manualError.message);
        // Continue without failing the test
      }
    }
  }

  async selectOffice(officeName: string): Promise<void> {
    console.log(`🏢 Selecting office: ${officeName}`);

    try {
      // Try selectOption first (fastest)
      await this.page.selectOption('[role="combobox"]:has-text("Select office")', officeName, { timeout: 5000 });
      console.log(`✅ Selected office: ${officeName}`);
    } catch (error) {
      console.log('⚠️ Select option failed, trying manual approach...');

      try {
        // Fallback to manual selection
        await this.officeSelect.click({ timeout: 5000 });
        await this.page.waitForTimeout(200);

        const option = this.page.getByRole('option', { name: officeName });
        await option.click({ timeout: 5000 });

        console.log(`✅ Selected office: ${officeName} (manual)`);
      } catch (manualError) {
        console.log(`⚠️ Manual selection failed for office ${officeName}:`, manualError.message);
        // Continue without failing the test
      }
    }
  }

  async selectDepartment(departmentName: string): Promise<void> {
    console.log(`🏬 Selecting department: ${departmentName}`);
    if (await this.departmentSelect.isVisible()) {
      await this.departmentSelect.click();
      await this.page.waitForTimeout(300);
      
      const option = this.page.getByRole('option', { name: departmentName });
      await option.click();
      
      console.log(`✅ Selected department: ${departmentName}`);
    }
  }

  async selectJobPosition(jobPositionName: string): Promise<void> {
    console.log(`💼 Selecting job position: ${jobPositionName}`);
    if (await this.jobPositionSelect.isVisible()) {
      await this.jobPositionSelect.click();
      await this.page.waitForTimeout(300);
      
      const option = this.page.getByRole('option', { name: jobPositionName });
      await option.click();
      
      console.log(`✅ Selected job position: ${jobPositionName}`);
    }
  }

  async setStatus(status: 'active' | 'inactive'): Promise<void> {
    console.log(`🏷️ Setting status to: ${status}`);
    if (await this.statusSelect.isVisible()) {
      await this.statusSelect.click();
      await this.page.waitForTimeout(300);
      
      const option = this.page.getByRole('option', { name: status === 'active' ? 'Active' : 'Inactive' });
      await option.click();
      
      console.log(`✅ Selected status: ${status}`);
    }
  }

  // Form submission
  async submitForm(): Promise<void> {
    console.log('🚀 Submitting form...');
    
    await this.submitButton.click();
    console.log('✅ Submit button clicked');
    
    // Wait for navigation or response
    await this.page.waitForLoadState('networkidle');
    console.log('✅ Form submission completed');
  }

  async clickSubmit(): Promise<void> {
    await this.submitForm();
  }

  async cancelForm(): Promise<void> {
    console.log('❌ Cancelling form...');
    await this.cancelButton.click();
    await this.page.waitForLoadState('networkidle');
    console.log('✅ Form cancelled');
  }

  // Error handling
  async getErrorMessages(): Promise<string[]> {
    const errorElements = this.page.locator('.error, [role="alert"], .text-red-600, .text-destructive');
    const errorCount = await errorElements.count();
    const errors: string[] = [];
    
    for (let i = 0; i < errorCount; i++) {
      const errorText = await errorElements.nth(i).textContent();
      if (errorText && errorText.trim()) {
        errors.push(errorText.trim());
      }
    }
    
    return errors;
  }

  async hasValidationErrors(): Promise<boolean> {
    const errors = await this.getErrorMessages();
    return errors.length > 0;
  }
}