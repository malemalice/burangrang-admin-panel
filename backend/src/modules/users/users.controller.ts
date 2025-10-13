import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PurchasedItemDto } from './dto/purchased-item.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { Request } from 'express';
import { UserDto } from './dto/user.dto';

// Define interface for request with user property
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user with this email already exists.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: any,
  ): Promise<UserDto> {
    return this.usersService.create(createUserDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
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
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
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
    description: 'Search term for name or email',
  })
  @ApiQuery({
    name: 'officeId',
    required: false,
    type: String,
    description: 'Filter by office ID',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    type: String,
    description: 'Filter by role ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of users.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total number of users' },
          },
        },
      },
    },
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('officeId') officeId?: string,
    @Query('roleId') roleId?: string,
  ): Promise<{
    data: UserDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.usersService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      officeId,
      roleId,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiResponse({
    status: 200,
    description: 'Return current user profile.',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  async getProfile(@Req() req: RequestWithUser): Promise<UserDto> {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserDto> {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid current password or token.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @Get('me/purchased-items')
  @ApiOperation({
    summary: 'Get current user purchased items',
    description:
      'Returns all purchased items (both courses and products) from fulfilled orders with enrollment status for courses',
  })
  @ApiResponse({
    status: 200,
    description: 'Return list of purchased items.',
    type: [PurchasedItemDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async getPurchasedItems(
    @Req() req: RequestWithUser,
  ): Promise<PurchasedItemDto[]> {
    const items = await this.usersService.getPurchasedItems(req.user.id);
    return items;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the user.',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
