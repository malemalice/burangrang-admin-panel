import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ReminderTargetTypeEnum } from './dto/reminder.dto';

/**
 * Reminder scheduler.
 *
 *  - `handleReminderCron` (every minute): processes due ReminderOccurrence rows,
 *    creates notifications via NotificationsService, stamps the occurrence as FIRED,
 *    writes a ReminderLog, and keeps the materialised window full for recurring reminders.
 *
 *  - `handleMissedSweep` (every 15 minutes): flips FIRED occurrences past the grace
 *    window without ack/dismiss to MISSED.
 *
 * The legacy `Reminder.remindAt` advance is kept via RemindersService.updateAfterExecution
 * for back-compat with anything reading the parent row directly.
 */
@Injectable()
export class RemindersScheduler {
  private readonly logger = new Logger(RemindersScheduler.name);
  private isProcessing = false;

  /** Keep this many days of occurrences materialised ahead for each recurring reminder. */
  private static readonly MATERIALIZE_WINDOW_DAYS = 90;

  constructor(
    private readonly remindersService: RemindersService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleReminderCron() {
    if (process.env.DISABLE_SCHEDULERS === 'true') return;
    if (this.isProcessing) {
      this.logger.warn(
        'Previous reminder processing is still running, skipping this cycle',
      );
      return;
    }
    this.isProcessing = true;
    const startTime = Date.now();

    try {
      const dueOccurrences = await this.remindersService.getDueOccurrences();
      if (dueOccurrences.length === 0) return;

      this.logger.log(`Processing ${dueOccurrences.length} due occurrence(s)`);

      for (const occ of dueOccurrences) {
        await this.processOccurrence(occ);
      }

      this.logger.log(
        `Completed processing ${dueOccurrences.length} occurrences in ${Date.now() - startTime}ms`,
      );
    } catch (error: any) {
      this.logger.error('Error in reminder cron job', error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  @Cron('*/15 * * * *')
  async handleMissedSweep() {
    if (process.env.DISABLE_SCHEDULERS === 'true') return;
    try {
      const flipped = await this.remindersService.sweepMissed();
      if (flipped > 0) {
        this.logger.log(`Marked ${flipped} occurrence(s) as MISSED`);
      }
    } catch (error: any) {
      this.logger.error('Error in missed-sweep job', error.stack);
    }
  }

  private async processOccurrence(occ: any): Promise<void> {
    // Atomically claim the occurrence. Two concurrent instances may both pick up the
    // same SCHEDULED row from getDueOccurrences. Only the first UPDATE that finds
    // state='SCHEDULED' will succeed; the other gets count=0 and skips.
    // @ts-ignore - prisma client regen pending
    const claimed = await this.prisma.reminderOccurrence.updateMany({
      where: { id: occ.id, state: 'SCHEDULED' },
      data: { state: 'FIRED', firedAt: new Date() },
    });
    if (claimed.count === 0) {
      this.logger.warn(
        `Occurrence ${occ.id} already claimed by another instance, skipping`,
      );
      return;
    }

    const reminder = occ.reminder;
    const startTime = Date.now();
    let notificationId: string | undefined;
    let emailSent = false;
    let errorMsg: string | undefined;

    try {
      const recipients = await this.getRecipients(
        reminder.targetType as ReminderTargetTypeEnum,
        reminder.targetId,
      );

      if (recipients.length === 0) {
        throw new Error(
          `No recipients found for reminder ${reminder.id} (targetType=${reminder.targetType}, targetId=${reminder.targetId})`,
        );
      }

      const roleIds = [
        ...new Set(recipients.map((r: any) => r.roleId).filter(Boolean)),
      ] as string[];
      const userIds: string[] =
        roleIds.length === 0
          ? [...new Set(recipients.map((r: any) => r.id).filter(Boolean) as string[])]
          : [];

      if (roleIds.length > 0 || userIds.length > 0) {
        try {
          const notification =
            await this.notificationsService.createNotificationForRoles(
              {
                title: 'Reminder',
                message: reminder.message,
                context: reminder.entity ?? undefined,
                contextId: reminder.entityId ?? undefined,
                typeId: await this.remindersService.getOrCreateReminderNotificationType(),
                roleIds,
                userIds: userIds.length > 0 ? userIds : undefined,
              },
              reminder.createdBy,
            );
          notificationId = notification.id;
          emailSent = true; // NotificationsService dispatches emails as part of create
        } catch (notifErr: any) {
          this.logger.error(
            `Failed to create notification for occurrence ${occ.id}`,
            notifErr.stack,
          );
          errorMsg = `Notification creation failed: ${notifErr.message}`;
        }
      }

      if (notificationId) {
        await this.remindersService.markOccurrenceFired(occ.id, notificationId);
      } else {
        await this.remindersService.markOccurrenceFailed(
          occ.id,
          errorMsg ?? 'No notification created',
        );
      }

      // Legacy: keep Reminder.remindAt advancing + write existing ReminderLog telemetry.
      await this.remindersService.updateAfterExecution(
        reminder.id,
        !!notificationId,
        notificationId,
        emailSent,
        errorMsg,
      );

      // Keep the rolling window full for recurring reminders.
      if (reminder.repeatType && reminder.repeatType !== 'NONE') {
        await this.remindersService.materializeOccurrences(
          reminder.id,
          new Date(
            Date.now() +
              RemindersScheduler.MATERIALIZE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
          ),
        );
      }

      this.logger.log(
        `Processed occurrence ${occ.id} in ${Date.now() - startTime}ms ` +
          `(recipients=${recipients.length}, notification=${!!notificationId})`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to process occurrence ${occ.id} after ${Date.now() - startTime}ms`,
        error.stack,
      );
      try {
        await this.remindersService.markOccurrenceFailed(
          occ.id,
          error.message ?? 'Unknown error',
        );
        await this.remindersService.updateAfterExecution(
          reminder.id,
          false,
          undefined,
          false,
          error.message ?? 'Unknown error',
        );
      } catch (innerErr: any) {
        this.logger.error(
          `Failed to record failure for occurrence ${occ.id}`,
          innerErr.stack,
        );
      }
    }
  }

  private async getRecipients(
    targetType: ReminderTargetTypeEnum,
    targetId: string,
  ): Promise<any[]> {
    switch (targetType) {
      case ReminderTargetTypeEnum.USER: {
        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
          include: { role: true },
        });
        return user ? [user] : [];
      }
      case ReminderTargetTypeEnum.ROLE:
        return this.prisma.user.findMany({
          where: { roleId: targetId, isActive: true },
          include: { role: true },
        });
      case ReminderTargetTypeEnum.DEPARTMENT:
        return this.prisma.user.findMany({
          where: { departmentId: targetId, isActive: true },
          include: { role: true },
        });
      case ReminderTargetTypeEnum.OFFICE:
        return this.prisma.user.findMany({
          where: { officeId: targetId, isActive: true },
          include: { role: true },
        });
      default:
        this.logger.warn(`Unknown target type: ${targetType}`);
        return [];
    }
  }
}
