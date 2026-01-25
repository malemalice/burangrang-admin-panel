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
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IncidentsService } from '../services/incidents.service';
import { CreateIncidentDto, UpdateIncidentDto, IncidentDto, FindIncidentsDto } from '../dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';

// Define interface for request with user property
interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Incidents')
@ApiBearerAuth()
@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiResponse({ status: 201, type: IncidentDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() createIncidentDto: CreateIncidentDto,
  ): Promise<IncidentDto> {
    return this.incidentsService.create(createIncidentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all incidents with pagination and filtering' })
  @ApiResponse({ status: 200, type: [IncidentDto] })
  async findAll(@Query() query: FindIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an incident by id' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async findOne(@Param('id') id: string): Promise<IncidentDto> {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an incident' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async update(
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ): Promise<IncidentDto> {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an incident (set isActive to false)' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async remove(@Param('id') id: string): Promise<IncidentDto> {
    return this.incidentsService.remove(id);
  }
}
