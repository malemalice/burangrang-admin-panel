import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  SendVerificationEmailDto,
  SendPasswordResetEmailDto,
  SendTeamInvitationEmailDto,
  SendPasswordChangeEmailDto,
  SendTemplatedEmailDto,
} from './dto/mail.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as Handlebars from 'handlebars';
import { handlebarsHelpers } from './templates/helpers';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly prisma: PrismaService,
  ) {
    // Register handlebars helpers once
    Object.entries(handlebarsHelpers).forEach(([name, fn]) => {
      if (!Handlebars.helpers[name]) {
        Handlebars.registerHelper(name, fn as Handlebars.HelperDelegate);
      }
    });
  }

  async sendVerificationEmail(payload: SendVerificationEmailDto): Promise<void> {
    await this.sendByKey('verification', payload.email, {
      name: payload.name,
      verificationLink: payload.verificationLink,
    });
  }

  async sendPasswordResetEmail(payload: SendPasswordResetEmailDto): Promise<void> {
    await this.sendByKey('password-reset', payload.email, {
      name: payload.name,
      resetLink: payload.resetLink,
    });
  }

  async sendTeamInvitationEmail(payload: SendTeamInvitationEmailDto): Promise<void> {
    await this.sendByKey('team-invitation', payload.email, {
      name: payload.name,
      inviterName: payload.inviterName,
      invitationLink: payload.invitationLink,
      teamName: payload.teamName,
    });
  }

  async sendPasswordChangeNotification(payload: SendPasswordChangeEmailDto): Promise<void> {
    await this.sendByKey('password-change', payload.email, {
      name: payload.name,
      changedAt: payload.changedAt?.toISOString() ?? new Date().toISOString(),
    });
  }

  async sendTemplatedMail(payload: SendTemplatedEmailDto): Promise<void> {
    await this.sendByKey(payload.template as any, payload.email, payload.context, payload.subject);
  }

  private async sendByKey(
    key: 'verification' | 'password-reset' | 'team-invitation' | 'password-change' | string,
    to: string,
    context: Record<string, unknown> = {},
    subjectOverride?: string,
  ): Promise<void> {
    try {
      const tpl = await this.prisma.emailTemplate.findUnique({
        where: { key },
      });
      if (!tpl || !tpl.isActive) {
        this.logger.warn(`Email template not found or inactive for key "${key}"`);
        return;
      }

      const compiledSubject = Handlebars.compile(tpl.subjectTemplate, { noEscape: true });
      const compiledBody = Handlebars.compile(tpl.bodyTemplate, { noEscape: true });

      const subject = subjectOverride ?? compiledSubject(context);
      const html = compiledBody(context);

      await this.mailer.sendMail({
        to,
        subject,
        html,
      });
    } catch (error) {
      // Do not throw to avoid blocking critical flows
      this.logger.error(`Failed sending email with key "${key}" to ${to}: ${String(error)}`);
    }
  }
}

