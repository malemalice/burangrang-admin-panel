import { Page } from '@playwright/test';
import { UserFormData } from '../types';

export class UserFormPage {
  constructor(private page: Page) {}

  // Form elements - using exact selectors from MCP Playwright analysis
  get firstNameInput() {
    return this.page.getByRole('textbox', { name: 'First Name' });
  }

  get lastNameInput() {
    return this.page.getByRole('textbox', { name: 'Last Name' });
  }

  get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email' });
  }

  get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  get roleSelect() {
    return this.page.getByRole('combobox', { name: 'Role' });
  }

  get officeSelect() {
    return this.page.getByRole('combobox', { name: 'Office' });
  }

  get departmentSelect() {
    return this.page.getByRole('combobox', { name: 'Department' });
  }

  get jobPositionSelect() {
    return this.page.getByRole('combobox', { name: 'Job Position' });
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

  async isOnEditPage(): Promise<boolean> {
    const url = this.page.url();
    const hasEditTitle = await this.page.locator('h1, h2, h3').filter({ hasText: /edit/i }).isVisible();
    return url.includes('/edit') || hasEditTitle;
  }

  // Form filling
  async fillForm(userData: UserFormData): Promise<void> {
    console.log('🔤 Filling user form...');

    // Fill text inputs
    await this.firstNameInput.fill(userData.firstName);
    console.log(`✅ Filled first name: ${userData.firstName}`);

    await this.lastNameInput.fill(userData.lastName);
    console.log(`✅ Filled last name: ${userData.lastName}`);

    await this.emailInput.fill(userData.email);
    console.log(`✅ Filled email: ${userData.email}`);

    if (userData.password) {
      await this.passwordInput.fill(userData.password);
      console.log(`✅ Filled password`);
    }

    // Fill dropdowns
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

  // Dropdown selection methods
  async selectRole(roleName: string): Promise<void> {
    console.log(`🔽 Selecting role: ${roleName}`);
    await this.roleSelect.click();
    await this.page.waitForTimeout(300);
    
    const option = this.page.getByRole('option', { name: roleName });
    await option.click();
    
    console.log(`✅ Selected role: ${roleName}`);
  }

  async selectOffice(officeName: string): Promise<void> {
    console.log(`🏢 Selecting office: ${officeName}`);
    await this.officeSelect.click();
    await this.page.waitForTimeout(300);
    
    const option = this.page.getByRole('option', { name: officeName });
    await option.click();
    
    console.log(`✅ Selected office: ${officeName}`);
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