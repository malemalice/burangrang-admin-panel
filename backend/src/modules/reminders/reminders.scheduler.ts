import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * ReminderScheduler handles automatic execution of due reminders
 * Runs every minute to check for reminders that need to be triggered
 */
@Injectable()
export class RemindersScheduler {
  private readonly logger = new Logger(RemindersScheduler.name);
  private isProcessing = false; // Prevent duplicate execution

  constructor(
    private readonly remindersService: RemindersService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Cron job that runs every minute to process due reminders
   * As per requirements: executes every 1 minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleReminderCron() {
    // Prevent concurrent execution
    if (this.isProcessing) {
      this.logger.warn('Previous reminder processing is still running, skipping this cycle');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      this.logger.debug('Starting reminder processing cycle');

      // Fetch due reminders (max 500 as per requirements)
      const dueReminders = await this.remindersService.getDueReminders();

      if (dueReminders.length === 0) {
        this.logger.debug('No due reminders found');
        return;
      }

      this.logger.log(`Processing ${dueReminders.length} due reminder(s)`);

      // Process each reminder
      for (const reminder of dueReminders) {
        await this.processReminder(reminder);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Completed processing ${dueReminders.length} reminders in ${duration}ms`);
    } catch (error) {
      this.logger.error('Error in reminder cron job', error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single reminder
   * Creates notification, sends email, and updates reminder status
   */
  private async processReminder(reminder: any): Promise<void> {
    const startTime = Date.now();
    let notificationId: string | undefined;
    let emailSent = false;
    let error: string | undefined;

    try {
      this.logger.debug(`Processing reminder ${reminder.id} for user ${reminder.userId}`);

      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: reminder.userId },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new Error(`User ${reminder.userId} not found`);
      }

      // Create notification
      try {
        const notification = await this.notificationsService.createNotificationForRoles(
          {
            title: 'Reminder',
            message: reminder.message,
            context: reminder.entity,
            contextId: reminder.entityId,
            typeId: await this.getOrCreateReminderNotificationType(),
            roleIds: [user.roleId],
          },
          reminder.userId, // Created by the reminder owner
        );

        notificationId = notification.id;
        this.logger.debug(`Created notification ${notificationId} for reminder ${reminder.id}`);
      } catch (notificationError) {
        this.logger.error(
          `Failed to create notification for reminder ${reminder.id}`,
          notificationError.stack,
        );
        error = `Notification creation failed: ${notificationError.message}`;
      }

      // Send email (optional based on requirements)
      try {
        await this.sendReminderEmail(user, reminder);
        emailSent = true;
        this.logger.debug(`Sent email for reminder ${reminder.id}`);
      } catch (emailError) {
        this.logger.warn(
          `Failed to send email for reminder ${reminder.id}: ${emailError.message}`,
        );
        // Don't mark as failed if only email failed
        if (!error) {
          error = `Email sending failed: ${emailError.message}`;
        }
      }

      // Update reminder status and create log
      await this.remindersService.updateAfterExecution(
        reminder.id,
        !!notificationId, // Success if notification was created
        notificationId,
        emailSent,
        error,
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `Successfully processed reminder ${reminder.id} in ${duration}ms (notification: ${!!notificationId}, email: ${emailSent})`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to process reminder ${reminder.id} after ${duration}ms`,
        error.stack,
      );

      // Update reminder with failure status
      try {
        await this.remindersService.updateAfterExecution(
          reminder.id,
          false,
          notificationId,
          emailSent,
          error.message || 'Unknown error',
        );
      } catch (updateError) {
        this.logger.error(
          `Failed to update reminder ${reminder.id} after failure`,
          updateError.stack,
        );
      }
    }
  }

  /**
   * Send reminder email to user
   * TODO: Implement actual email sending logic using a mail service
   */
  private async sendReminderEmail(user: any, reminder: any): Promise<void> {
    // Placeholder for email sending logic
    // In production, integrate with Nodemailer, AWS SES, or SMTP
    
    this.logger.debug(`Would send email to ${user.email} with subject: "Reminder: ${reminder.entity || 'General'}"`);
    
    // Example email content:
    // To: user.email
    // Subject: Reminder: {context reference}
    // Body: reminder.message
    
    // Uncomment and implement when mail service is available:
    /*
    await this.mailService.sendMail({
      to: user.email,
      subject: `Reminder: ${reminder.entity ? reminder.entity.replace('t_', '') : 'General'}`,
      text: reminder.message,
      html: `
        <h2>Reminder</h2>
        <p>${reminder.message}</p>
        ${reminder.entity ? `<p><strong>Related to:</strong> ${reminder.entity}</p>` : ''}
        ${reminder.entityId ? `<p><strong>Reference ID:</strong> ${reminder.entityId}</p>` : ''}
      `,
    });
    */
  }

  /**
   * Get or create the reminder notification type
   */
  private async getOrCreateReminderNotificationType(): Promise<string> {
    const typeName = 'REMINDER';

    let notificationType = await this.prisma.notificationType.findFirst({
      where: { name: typeName },
    });

    if (!notificationType) {
      notificationType = await this.prisma.notificationType.create({
        data: {
          name: typeName,
          description: 'Scheduled reminder notifications',
        },
      });
      this.logger.log(`Created notification type: ${typeName}`);
    }

    return notificationType.id;
  }
}

