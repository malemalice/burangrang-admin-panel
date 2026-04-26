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
import { CreateGuestWorkerDto } from './dto/create-guest-worker.dto';
import { CreateWorkPermitWorkerDto } from './dto/create-work-permit-worker.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { Request } from 'express';
import { UserDto } from './dto/user.dto';
import { WorkPermitWorkerProfileResponseDto } from './dto/work-permit-worker-profile.dto';
import { UpdateWorkerDocumentsDto } from './dto/update-worker-documents.dto';

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
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('user:create')
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
  
  create(@Body() createUserDto: CreateUserDto, @Req() req: any): Promise<UserDto> {
    return this.usersService.create(createUserDto, req.user.id);
  }

  @Post('guest-worker')
  @Permissions('user:create')
  @ApiOperation({ summary: 'Create a guest worker (user with Guest role and random password)' })
  @ApiBody({ type: CreateGuestWorkerDto })
  @ApiResponse({
    status: 201,
    description: 'The guest worker has been successfully created.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or Guest role/office not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user with this email already exists.',
  })
  createGuestWorker(
    @Body() dto: CreateGuestWorkerDto,
    @Req() req: any,
  ): Promise<UserDto> {
    return this.usersService.createGuestWorker(dto, req.user.id);
  }

  @Post('work-permit-worker')
  @Permissions('user:create')
  @ApiOperation({
    summary:
      'Create a work permit worker (user with Contractor role and random password)',
  })
  @ApiBody({ type: CreateWorkPermitWorkerDto })
  @ApiResponse({
    status: 201,
    description: 'The work permit worker has been successfully created.',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation error or Contractor role/office not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user with this email already exists.',
  })
  createWorkPermitWorker(
    @Body() dto: CreateWorkPermitWorkerDto,
    @Req() req: any,
  ): Promise<UserDto> {
    return this.usersService.createWorkPermitWorker(dto, req.user.id, {
      role: req.user.role as string,
      companyId: req.user.companyId ?? null,
    });
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('user:list')
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
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: String,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'jobPositionId',
    required: false,
    type: String,
    description: 'Filter by job position ID',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    type: String,
    description:
      'Filter by company ID (Super Admin only; others are scoped to their company)',
  })
  @ApiQuery({
    name: 'roleCode',
    required: false,
    type: String,
    description: 'Filter by role code (e.g. CONTRACTOR)',
  })
  @ApiQuery({
    name: 'options',
    required: false,
    type: Boolean,
    description: 'Set to true to bypass permission check (requires JWT auth only)',
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
  
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('officeId') officeId?: string,
    @Query('roleId') roleId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('jobPositionId') jobPositionId?: string,
    @Query('companyId') companyId?: string,
    @Query('roleCode') roleCode?: string,
  ): Promise<{ data: UserDto[]; meta: { total: number; page: number; limit: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    // Trim search term and only use if not empty
    const trimmedSearch = search?.trim();
    const finalSearch = trimmedSearch && trimmedSearch.length > 0 ? trimmedSearch : undefined;

    return this.usersService.findAll(
      {
        page: pageNumber,
        limit: limitNumber,
        sortBy,
        sortOrder,
        isActive: isActiveBoolean,
        search: finalSearch,
        officeId,
        roleId,
        departmentId,
        jobPositionId,
        companyId,
        roleCode,
      },
      req.user
        ? {
            role: req.user.role as string,
            companyId: req.user.companyId ?? null,
          }
        : undefined,
    );
  }

  @Get('me')
  @Permissions('user:read')
  @ApiOperation({ summary: 'Get current user profile' })
  
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
  @Permissions('user:update')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token.' })
  
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserDto> {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('me/change-password')
  @Permissions('auth:change-password')
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
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid current password or token.' })
  
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @Get(':id/work-permit-worker-profile')
  @Permissions('user:read')
  @ApiOperation({
    summary:
      'Work permit worker profile: user summary plus permit assignments (join rows); certificate/health URLs and screening from worker profile (`t_worker`)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'User and per–work-permit worker assignments.',
    type: WorkPermitWorkerProfileResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong company or role.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  getWorkPermitWorkerProfile(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<WorkPermitWorkerProfileResponseDto> {
    return this.usersService.getWorkPermitWorkerProfile(id, {
      role: req.user.role as string,
      requesterUserId: req.user.id as string,
    });
  }

  @Patch(':id/worker-documents')
  @Permissions('user:read', 'upload:create')
  @ApiOperation({
    summary:
      'Update worker profile documents (`t_worker`), e.g. certificate URL (upload file elsewhere, then save URL)',
  })
  @ApiParam({ name: 'id', description: 'Worker user ID', type: String })
  @ApiBody({ type: UpdateWorkerDocumentsDto })
  @ApiResponse({
    status: 200,
    description: 'Updated certificate URL on worker profile.',
    schema: {
      type: 'object',
      properties: {
        certificateUrl: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong company.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  updateWorkerDocuments(
    @Param('id') id: string,
    @Body() dto: UpdateWorkerDocumentsDto,
    @Req() req: any,
  ): Promise<{ certificateUrl: string | null }> {
    return this.usersService.updateWorkerDocuments(id, dto, {
      role: req.user.role as string,
      requesterUserId: req.user.id as string,
    });
  }

  @Get(':id')
  @Permissions('user:read')
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
  
  findOne(@Param('id') id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('user:update')
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
  
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions('user:delete')
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
  
  remove(@Param('id') id: string, @Req() req: Request & { user: { id: string } }): Promise<void> {
    return this.usersService.remove(id, req.user.id);
  }
}
