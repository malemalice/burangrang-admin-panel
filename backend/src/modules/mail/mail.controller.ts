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
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplateDto } from './dto/email-template.dto';

@ApiTags('mail')
@ApiBearerAuth()
@Controller('mail')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class MailController {
  constructor(private readonly mailService: MailService) {}

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
      await this.mailService.sendTemplatedMailStrict(dto);
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
  @AllowOptionsBypass()
  @Permissions('mail-template:list')
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
  @ApiQuery({
    name: 'code',
    required: false,
    type: String,
    description: 'Filter by code (partial match)',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by name (partial match)',
  })
  @ApiQuery({
    name: 'options',
    required: false,
    type: Boolean,
    description: 'Set to true to bypass permission check (requires JWT auth only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of email templates.',
  })
  
  findAllTemplates(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('code') code?: string,
    @Query('name') name?: string,
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
      code,
      name,
    });
  }

  @Get('templates/:id')
  @Permissions('mail-template:read')
  @ApiOperation({ summary: 'Get email template by ID (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  
  findOneTemplate(@Param('id') id: string): Promise<EmailTemplateDto> {
    return this.mailService.findOneTemplate(id);
  }

  @Post('templates')
  @Permissions('mail-template:create')
  @ApiOperation({ summary: 'Create email template (private)' })
  @ApiBody({ type: CreateEmailTemplateDto })
  @ApiResponse({ status: 201, type: EmailTemplateDto })
  
  createTemplate(
    @Body() dto: CreateEmailTemplateDto,
  ): Promise<EmailTemplateDto> {
    return this.mailService.createTemplate(dto);
  }

  @Patch('templates/:id')
  @Permissions('mail-template:update')
  @ApiOperation({ summary: 'Update email template (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateEmailTemplateDto })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplateDto> {
    return this.mailService.updateTemplate(id, dto);
  }

  @Patch('templates/:id/toggle')
  @Permissions('mail-template:update')
  @ApiOperation({ summary: 'Toggle email template active state (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  
  toggleTemplate(@Param('id') id: string): Promise<EmailTemplateDto> {
    return this.mailService.toggleTemplate(id);
  }

  @Delete('templates/:id')
  @Permissions('mail-template:delete')
  @ApiOperation({ summary: 'Delete email template (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  
  async removeTemplate(@Param('id') id: string): Promise<{ ok: boolean }> {
    await this.mailService.removeTemplate(id);
    return { ok: true };
  }
}
