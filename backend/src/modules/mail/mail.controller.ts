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

@ApiTags('mail')
@ApiBearerAuth()
@Controller('mail')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Public()
  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test sending a templated email (public endpoint)' })
  @ApiBody({ type: SendTemplatedEmailDto })
  @ApiResponse({ status: 200, description: 'Email queued/sent' })
  async testSend(@Body() dto: SendTemplatedEmailDto): Promise<{ ok: boolean }> {
    await this.mailService.sendTemplatedMail(dto);
    return { ok: true };
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
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
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
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
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
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
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
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
    return this.mailService.updateTemplate(id, dto);
  }

  @Patch('templates/:id/toggle')
  @ApiOperation({ summary: 'Toggle email template active state (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  @Roles(Role.SUPER_ADMIN)
  toggleTemplate(@Param('id') id: string): Promise<EmailTemplateDto> {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
    return this.mailService.toggleTemplate(id);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete email template (private)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @Roles(Role.SUPER_ADMIN)
  async removeTemplate(@Param('id') id: string): Promise<{ ok: boolean }> {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-call */
    await this.mailService.removeTemplate(id);
    return { ok: true };
  }
}
