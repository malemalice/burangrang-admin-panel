import { Injectable, Logger } from '@nestjs/common';
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
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplateDto } from './dto/email-template.dto';
import { Prisma } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer';

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

  /**
   * Strict test sender used by /mail/test to surface delivery errors synchronously.
   * Mirrors sendByKey but rethrows errors instead of swallowing them.
   */
  async sendTemplatedMailStrict(payload: SendTemplatedEmailDto): Promise<void> {
    const code = payload.template as any;
    const to = payload.email;
    const context = payload.context ?? {};
    const subjectOverride = payload.subject;

    const tpl = await this.prisma.emailTemplate.findUnique({
      where: { code },
    });
    if (!tpl || !tpl.isActive) {
      throw new Error(`Email template not found or inactive for code "${code}"`);
    }

    const compiledSubject = Handlebars.compile(tpl.subjectTemplate, { noEscape: true });
    const compiledBody = Handlebars.compile(tpl.bodyTemplate, { noEscape: true });

    const subject = subjectOverride ?? compiledSubject(context);
    const html = compiledBody(context);

    await this.mailer.sendMail({ to, subject, html });
  }

  private async sendByKey(
    code: 'verification' | 'password-reset' | 'team-invitation' | 'password-change' | string,
    to: string,
    context: Record<string, unknown> = {},
    subjectOverride?: string,
  ): Promise<void> {
    try {
      const tpl = await this.prisma.emailTemplate.findUnique({
        where: { code },
      });
      if (!tpl || !tpl.isActive) {
        this.logger.warn(`Email template not found or inactive for code "${code}"`);
        return;
      }

      const compiledSubject = Handlebars.compile(tpl.subjectTemplate, { noEscape: true });
      const compiledBody = Handlebars.compile(tpl.bodyTemplate, { noEscape: true });

      const subject = subjectOverride ?? compiledSubject(context);
      const html = compiledBody(context);

      await this.mailer.sendMail({ to, subject, html });
    } catch (error) {
      // Do not throw to avoid blocking critical flows
      this.logger.error(`Failed sending email with code "${code}" to ${to}: ${String(error)}`);
    }
  }

  // Email Template Management
  async findAllTemplates(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: EmailTemplateDto[]; meta: { total: number; page: number; limit: number } }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.EmailTemplateWhereInput = {
      AND: [
        params.isActive === undefined ? {} : { isActive: params.isActive },
        params.search
          ? {
              OR: [
                { code: { contains: params.search, mode: 'insensitive' } },
                { name: { contains: params.search, mode: 'insensitive' } },
                { subjectTemplate: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const orderBy: Prisma.EmailTemplateOrderByWithRelationInput | undefined =
      params.sortBy
        ? { [params.sortBy]: params.sortOrder ?? 'asc' } as any
        : { createdAt: 'desc' };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.emailTemplate.count({ where }),
      this.prisma.emailTemplate.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const data: EmailTemplateDto[] = rows.map(
      (r) =>
        new EmailTemplateDto({
          id: r.id,
          code: r.code,
          name: r.name,
          subjectTemplate: r.subjectTemplate,
          bodyTemplate: r.bodyTemplate,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }),
    );

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async findOneTemplate(id: string): Promise<EmailTemplateDto> {
    const tpl = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!tpl) {
      throw new Error('Email template not found');
    }
    return new EmailTemplateDto(tpl);
    }

  async createTemplate(dto: CreateEmailTemplateDto): Promise<EmailTemplateDto> {
    // Ensure code is unique
    const existing = await this.prisma.emailTemplate.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new Error('Email template code already exists');
    }
    const created = await this.prisma.emailTemplate.create({
      data: {
        code: dto.code,
        name: dto.name,
        subjectTemplate: dto.subjectTemplate,
        bodyTemplate: dto.bodyTemplate,
        isActive: dto.isActive ?? true,
      },
    });
    return new EmailTemplateDto(created);
  }

  async updateTemplate(id: string, dto: UpdateEmailTemplateDto): Promise<EmailTemplateDto> {
    const existing = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Email template not found');
    }
    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        subjectTemplate: dto.subjectTemplate ?? undefined,
        bodyTemplate: dto.bodyTemplate ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
    return new EmailTemplateDto(updated);
  }

  async toggleTemplate(id: string): Promise<EmailTemplateDto> {
    const existing = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Email template not found');
    }
    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    return new EmailTemplateDto(updated);
  }

  async removeTemplate(id: string): Promise<void> {
    const existing = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return;
    }
    await this.prisma.emailTemplate.delete({ where: { id } });
  }
}

