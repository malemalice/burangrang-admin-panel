import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  SendVerificationEmailDto,
  SendPasswordResetEmailDto,
  SendTeamInvitationEmailDto,
  SendPasswordChangeEmailDto,
  SendTemplatedEmailDto,
} from './dto/mail.dto';
import { templateRegistry, MailTemplateKey } from './templates/registry';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

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
    await this.sendByKey(payload.template, payload.email, payload.context, payload.subject);
  }

  private async sendByKey(
    key: MailTemplateKey,
    to: string,
    context: Record<string, unknown> = {},
    subjectOverride?: string,
  ): Promise<void> {
    const entry = templateRegistry[key];
    const subject =
      subjectOverride ??
      (typeof entry.subject === 'function' ? entry.subject(context) : entry.subject);

    await this.mailer.sendMail({
      to,
      subject,
      template: entry.file,
      context,
    });
  }
}


