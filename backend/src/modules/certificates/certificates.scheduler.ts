import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CertificatesService } from './certificates.service';

@Injectable()
export class CertificatesScheduler {
  private readonly logger = new Logger(CertificatesScheduler.name);
  private isProcessing = false;

  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * Daily post-expiry reminders.
   * Requirement: after expired date (validityDate < now), send reminder email daily.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async sendExpiredCertificatesDailyEmailsCron() {
    if (process.env.DISABLE_SCHEDULERS === 'true') {
      return;
    }

    if (this.isProcessing) {
      this.logger.warn(
        'Previous expired-certificate email job is still running, skipping this cycle',
      );
      return;
    }

    this.isProcessing = true;
    const startedAt = Date.now();

    try {
      const { scanned, emailed, skippedDedupe } =
        await this.certificatesService.sendExpiredCertificatesDepartmentEmailsDaily();
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        `Expired certificate daily emails done (scanned=${scanned}, emailed=${emailed}, skippedDedupe=${skippedDedupe}) in ${durationMs}ms`,
      );
    } catch (e) {
      this.logger.error('Expired certificate daily email job failed', e);
    } finally {
      this.isProcessing = false;
    }
  }
}

