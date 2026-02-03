import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomDto } from './dto/room.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('rooms')
@ApiBearerAuth()
@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Permissions('room:create')
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'The room has been successfully created.', type: RoomDto })
  create(@Body() createRoomDto: CreateRoomDto): Promise<RoomDto> {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('room:list')
  @ApiOperation({ summary: 'Get all rooms with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'areaId', required: false, type: String })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({ status: 200, description: 'Return all rooms.', type: [RoomDto] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('areaId') areaId?: string,
  ): Promise<{ data: RoomDto[]; meta: { total: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.roomsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      areaId,
    });
  }

  @Get(':id')
  @Permissions('room:read')
  @ApiOperation({ summary: 'Get a room by id' })
  @ApiResponse({ status: 200, description: 'Return the room.', type: RoomDto })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  findOne(@Param('id') id: string): Promise<RoomDto> {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('room:update')
  @ApiOperation({ summary: 'Update a room' })
  @ApiResponse({ status: 200, description: 'The room has been successfully updated.', type: RoomDto })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<RoomDto> {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  @Permissions('room:delete')
  @ApiOperation({ summary: 'Delete a room' })
  @ApiResponse({ status: 200, description: 'The room has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.roomsService.remove(id);
  }
}
