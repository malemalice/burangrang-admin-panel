import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import { NotificationsService } from '../services/notifications.service';
import { NotificationDto } from '../dto/notification.dto';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { PaginatedResponse, FindAllQueryDto } from '../../../shared/types/pagination-params';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for title, message, or context' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
  @ApiQuery({ name: 'isRead', required: false, type: Number, description: 'Filter by read status (1 = read, 0 = unread)' })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  async getUserNotifications(
    @Query() query: FindAllQueryDto,
    @Request() req: any,
  ): Promise<PaginatedResponse<NotificationDto>> {
    return this.notificationsService.getUserNotifications(req.user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for user' })
  @ApiResponse({ status: 200, schema: { type: 'object', properties: { count: { type: 'number' } } } })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  async getUnreadCount(@Request() req: any): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all notification types' })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  async getNotificationTypes() {
    return this.notificationsService.getNotificationTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Notification ID' })
  @ApiResponse({ status: 200, type: NotificationDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<NotificationDto> {
    return this.notificationsService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new notification' })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ status: 201, type: NotificationDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Roles(Role.SUPER_ADMIN)
  async create(
    @Body() createDto: CreateNotificationDto,
    @Request() req: any,
  ): Promise<NotificationDto> {
    return this.notificationsService.createNotificationForRoles(createDto, req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', type: String, description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  async markAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  async markAllAsRead(@Request() req: any): Promise<void> {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification (admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Notification ID' })
  @ApiBody({ type: UpdateNotificationDto })
  @ApiResponse({ status: 200, type: NotificationDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @Roles(Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationDto,
  ): Promise<NotificationDto> {
    return this.notificationsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification (admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    return this.notificationsService.remove(id);
  }
}
