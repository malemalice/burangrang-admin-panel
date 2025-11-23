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
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('reminders')
@ApiBearerAuth()
@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reminder' })
  @ApiResponse({
    status: 201,
    description: 'Reminder created successfully',
    type: ReminderDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async create(
    @Body() createReminderDto: CreateReminderDto,
    @Request() req,
  ): Promise<ReminderDto> {
    return this.remindersService.create(createReminderDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reminders for current user with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in message or entity' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'SENT', 'EXPIRED', 'CANCELLED', 'FAILED'], description: 'Filter by status' })
  @ApiQuery({ name: 'entity', required: false, type: String, description: 'Filter by entity/context' })
  @ApiQuery({ name: 'entityId', required: false, type: String, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'Filter to date (ISO 8601)' })
  @ApiResponse({
    status: 200,
    description: 'List of reminders retrieved successfully',
    type: [ReminderDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async getLogs(@Param('id') id: string, @Request() req): Promise<ReminderLogDto[]> {
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.remindersService.remove(id, req.user.id);
  }
}

