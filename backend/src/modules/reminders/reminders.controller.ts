import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { FindRemindersDto } from './dto/find-reminders.dto';
import { ReminderDto, ReminderLogDto } from './dto/reminder.dto';
import { ReminderOccurrenceDto } from './dto/occurrence.dto';
import { FindOccurrencesDto } from './dto/find-occurrences.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';

@ApiTags('reminders')
@ApiBearerAuth()
@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  // ----- Occurrence endpoints (registered before :id to avoid route collision) -----

  @Get('occurrences')
  @ApiOperation({
    summary: 'List reminder occurrences in a date range (calendar query)',
  })
  @ApiQuery({ name: 'from', required: true, type: String })
  @ApiQuery({ name: 'to', required: true, type: String })
  @ApiQuery({ name: 'scope', required: false, enum: ['mine', 'all'] })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'subjectType', required: false, type: String })
  @ApiQuery({ name: 'subjectId', required: false, type: String })
  @ApiQuery({ name: 'reminderId', required: false, type: String })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiResponse({ status: 200, type: [ReminderOccurrenceDto] })
  @Permissions('reminder:list')
  async findOccurrences(
    @Query() query: FindOccurrencesDto,
    @Request() req,
  ): Promise<ReminderOccurrenceDto[]> {
    return this.remindersService.findOccurrences(req.user.id, query);
  }

  @Patch('occurrences/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an occurrence (group-level ack)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ReminderOccurrenceDto })
  @Permissions('reminder:update')
  async acknowledgeOccurrence(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ReminderOccurrenceDto> {
    return this.remindersService.acknowledgeOccurrence(id, req.user.id);
  }

  @Patch('occurrences/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss an occurrence (group-level dismiss)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ReminderOccurrenceDto })
  @Permissions('reminder:update')
  async dismissOccurrence(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ReminderOccurrenceDto> {
    return this.remindersService.dismissOccurrence(id, req.user.id);
  }

  // ----- existing reminder endpoints -----

  @Post()
  @ApiOperation({ summary: 'Create a new reminder' })
  @ApiResponse({
    status: 201,
    description: 'Reminder created successfully',
    type: ReminderDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('reminder:create')
  async create(
    @Body() createReminderDto: CreateReminderDto,
    @Request() req,
  ): Promise<ReminderDto> {
    return this.remindersService.create(createReminderDto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @ApiOperation({
    summary: 'Get all reminders for current user with pagination and filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Search in message or entity',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'SENT', 'EXPIRED', 'CANCELLED', 'FAILED'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'entity',
    required: false,
    type: String,
    description: 'Filter by entity/context',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    type: String,
    description: 'Filter by entity ID',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Filter from date (ISO 8601)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Filter to date (ISO 8601)',
  })
  @ApiQuery({
    name: 'options',
    required: false,
    type: Boolean,
    description: 'Set to true to bypass permission check (requires JWT auth only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reminders retrieved successfully',
    type: [ReminderDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('reminder:list')
  async findAll(@Query() query: FindRemindersDto, @Request() req) {
    return this.remindersService.findAll(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reminder by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Reminder ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder retrieved successfully',
    type: ReminderDto,
  })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('reminder:read')
  async findOne(@Param('id') id: string, @Request() req): Promise<ReminderDto> {
    return this.remindersService.findOne(id, req.user.id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get execution logs for a reminder' })
  @ApiParam({ name: 'id', type: String, description: 'Reminder ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder logs retrieved successfully',
    type: [ReminderLogDto],
  })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('reminder:read')
  async getLogs(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ReminderLogDto[]> {
    return this.remindersService.getLogs(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reminder' })
  @ApiParam({ name: 'id', type: String, description: 'Reminder ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder updated successfully',
    type: ReminderDto,
  })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('reminder:update')
  async update(
    @Param('id') id: string,
    @Body() updateReminderDto: UpdateReminderDto,
    @Request() req,
  ): Promise<ReminderDto> {
    return this.remindersService.update(id, req.user.id, updateReminderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/delete a reminder' })
  @ApiParam({ name: 'id', type: String, description: 'Reminder ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('reminder:delete')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.remindersService.remove(id, req.user.id);
  }

  @Post(':id/trigger')
  @ApiOperation({ summary: 'Manually trigger notification for a reminder' })
  @ApiParam({ name: 'id', type: String, description: 'Reminder ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification triggered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        notificationId: { type: 'string' },
      },
      required: ['success', 'message'],
    },
  })
  @ApiResponse({ status: 400, description: 'Reminder does not meet criteria' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('reminder:update')
  async triggerNotification(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ success: boolean; message: string; notificationId?: string }> {
    return this.remindersService.triggerNotification(id, req.user.id);
  }
}
