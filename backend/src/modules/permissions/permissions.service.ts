import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PermissionDto } from './dto/permission.dto';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

@Injectable()
export class PermissionsService {
  private permissionMapper: (permission: any) => PermissionDto;
  private permissionArrayMapper: (permissions: any[]) => PermissionDto[];

  constructor(
    private prisma: PrismaService,
    private dtoMapper: DtoMapperService,
  ) {
    // Initialize mappers
    this.permissionMapper = this.dtoMapper.createSimpleMapper(PermissionDto);
    this.permissionArrayMapper = this.dtoMapper.createSimpleArrayMapper(PermissionDto);
  }

  async findAll(): Promise<PermissionDto[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return this.permissionArrayMapper(permissions);
  }
}
