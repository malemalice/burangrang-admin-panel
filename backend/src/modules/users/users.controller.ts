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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { Request } from 'express';
import { UserDto } from './dto/user.dto';
import { Permissions } from 'src/shared/decorators/permissions.decorator';

// Define interface for request with user property
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permissions('user:create')
  create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  // @Roles(Role.ADMIN)
  @Permissions('user:list')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('officeId') officeId?: string,
    @Query('roleId') roleId?: string,
  ): Promise<{ data: UserDto[]; meta: { total: number } }> {
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
  async getProfile(@Req() req: RequestWithUser): Promise<UserDto> {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @Permissions('user:read')
  findOne(@Param('id') id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permissions('user:update')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permissions('user:delete')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
