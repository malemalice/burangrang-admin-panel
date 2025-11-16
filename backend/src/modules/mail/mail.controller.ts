import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { MailService } from './mail.service';
import { SendTemplatedEmailDto } from './dto/mail.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplateDto } from './dto/email-template.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsHelperService } from '../../shared/services/settings.service';
import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';

@ApiTags('mail')
@ApiBearerAuth()
@Controller('mail')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
    private readonly settings: SettingsHelperService,
  ) {}

  @Public()
  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test sending a templated email (public endpoint)' })
  @ApiBody({ type: SendTemplatedEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Synchronous test send result with success or error details',
  })
  async testSend(
    @Body() dto: SendTemplatedEmailDto,
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      // Load template fresh from DB
      const tpl = await this.prisma.emailTemplate.findUnique({
        where: { code: dto.template as any },
      });
      if (!tpl || !tpl.isActive) {
        return {
          ok: false,
          error: `Email template not found or inactive for code "${dto.template}"`,
        };
      }

      // Compile templates
      const compiledSubject = Handlebars.compile(tpl.subjectTemplate, {
        noEscape: true,
      });
      const compiledBody = Handlebars.compile(tpl.bodyTemplate, {
        noEscape: true,
      });
      const subject = dto.subject ?? compiledSubject(dto.context || {});
      const html = compiledBody(dto.context || {});

      // Build transporter from current settings
      const provider =
        (
          await this.settings.getWithDefault('mail.provider', 'smtp')
        )?.toLowerCase() || 'smtp';
      const from =
        (await this.settings.getWithDefault(
          'mail.from',
          'no-reply@example.com',
        )) || 'no-reply@example.com';
      let defaults: { host: string; port: number; secure: boolean };
      if (provider === 'gmail') {
        defaults = { host: 'smtp.gmail.com', port: 465, secure: true };
      } else if (provider === 'mailgun') {
        defaults = { host: 'smtp.mailgun.org', port: 587, secure: false };
      } else {
        defaults = { host: 'localhost', port: 1025, secure: false };
      }
      const host =
        (await this.settings.getWithDefault('mail.host', defaults.host)) ||
        defaults.host;
      const portStr = await this.settings.get('mail.port');
      const port = Number.isFinite(Number(portStr))
        ? Number(portStr)
        : defaults.port;
      const secureStr =
        (await this.settings.getWithDefault(
          'mail.secure',
          String(defaults.secure),
        )) || String(defaults.secure);
      const secure = secureStr === 'true' || secureStr === '1';
      const user = (await this.settings.getWithDefault('mail.user', '')) || '';
      const pass =
        (await this.settings.getWithDefault('mail.password', '')) || '';
      const useStreamTransport =
        (!user || !pass) && host === 'localhost' && port === 1025;
      const transporter = useStreamTransport
        ? nodemailer.createTransport({
            streamTransport: true,
            buffer: true,
          } as any)
        : nodemailer.createTransport({
            host,
            port,
            secure,
            auth: user && pass ? { user, pass } : undefined,
          } as any);

      await transporter.sendMail({
        from,
        to: dto.email,
        subject,
        html,
      });
      return { ok: true };
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (typeof error === 'object' && error !== null) {
        // try common Nest/HTTP error shape
        const errObj = error as Record<string, unknown>;
        const response = errObj['response'];

        let responseMessage: string | undefined;
        if (response && typeof response === 'object') {
          const msg = (response as { message?: unknown }).message;
          if (typeof msg === 'string') {
            responseMessage = msg;
          }
        }

        let directMessage: string | undefined;
        const maybeMsg = errObj['message'];
        if (typeof maybeMsg === 'string') {
          directMessage = maybeMsg;
        }
        message = responseMessage || directMessage || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      return { ok: false, error: message };
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'List email templates (private)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by code, name or subject',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of email templates.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findAllTemplates(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{
    data: EmailTemplateDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.mailService.findAllTemplates({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
    });
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get email template by ID (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findOneTemplate(@Param('id') id: string): Promise<EmailTemplateDto> {
    return this.mailService.findOneTemplate(id);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create email template (private)' })
  @ApiBody({ type: CreateEmailTemplateDto })
  @ApiResponse({ status: 201, type: EmailTemplateDto })
  @Roles(Role.SUPER_ADMIN)
  createTemplate(
    @Body() dto: CreateEmailTemplateDto,
  ): Promise<EmailTemplateDto> {
    return this.mailService.createTemplate(dto);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update email template (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateEmailTemplateDto })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  @Roles(Role.SUPER_ADMIN)
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplateDto> {
    return this.mailService.updateTemplate(id, dto);
  }

  @Patch('templates/:id/toggle')
  @ApiOperation({ summary: 'Toggle email template active state (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  @Roles(Role.SUPER_ADMIN)
  toggleTemplate(@Param('id') id: string): Promise<EmailTemplateDto> {
    return this.mailService.toggleTemplate(id);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete email template (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @Roles(Role.SUPER_ADMIN)
  async removeTemplate(@Param('id') id: string): Promise<{ ok: boolean }> {
    await this.mailService.removeTemplate(id);
    return { ok: true };
  }
}
