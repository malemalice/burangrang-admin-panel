import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OfficesService } from './offices.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { OfficeDto } from './dto/office.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Prisma } from '@prisma/client';
import { Role } from '../../shared/types/role.enum';

@Controller('offices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Post()
  create(@Body() createOfficeDto: CreateOfficeDto): Promise<OfficeDto> {
    return this.officesService.create(createOfficeDto);
  }

  @Get()
  findAll(): Promise<OfficeDto[]> {
    return this.officesService.findAll();
  }

  @Get('hierarchy')
  getHierarchy(): Promise<OfficeDto[]> {
    return this.officesService.getOfficeHierarchy();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<OfficeDto> {
    return this.officesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOfficeDto: UpdateOfficeDto,
  ): Promise<OfficeDto> {
    return this.officesService.update(id, updateOfficeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.officesService.remove(id);
  }
} 