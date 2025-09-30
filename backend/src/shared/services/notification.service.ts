import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Mock email service - sends password via email
   */
  async sendPasswordEmail(email: string, password: string, firstName: string, lastName: string): Promise<void> {
    // Mock implementation - in real app, integrate with email service (SendGrid, AWS SES, etc.)
    this.logger.log(`📧 EMAIL SENT - Password delivery to ${email}`);
    this.logger.log(`   Recipient: ${firstName} ${lastName}`);
    this.logger.log(`   Password: ${password}`);
    this.logger.log(`   Subject: Welcome! Your account password`);
    this.logger.log(`   Body: Hello ${firstName}, your temporary password is: ${password}. Please change it after first login.`);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Mock SMS service - sends password via SMS
   */
  async sendPasswordSMS(phone: string, password: string, firstName: string, lastName: string): Promise<void> {
    // Mock implementation - in real app, integrate with SMS service (Twilio, AWS SNS, etc.)
    this.logger.log(`📱 SMS SENT - Password delivery to ${phone}`);
    this.logger.log(`   Recipient: ${firstName} ${lastName}`);
    this.logger.log(`   Password: ${password}`);
    this.logger.log(`   Message: Welcome ${firstName}! Your password: ${password}. Change after first login.`);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Send password via appropriate channel (email or SMS)
   */
  async sendPassword(
    email: string | undefined, 
    phone: string | undefined, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<void> {
    if (email) {
      await this.sendPasswordEmail(email, password, firstName, lastName);
    } else if (phone) {
      await this.sendPasswordSMS(phone, password, firstName, lastName);
    }
  }

  /**
   * Generate a secure temporary password
   */
  generateTemporaryPassword(): string {
    // Generate 8-character password with letters and numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
