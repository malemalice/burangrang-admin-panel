import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { OfficeDto } from './dto/office.dto';
import { Prisma } from '@prisma/client';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

@Injectable()
export class OfficesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOfficeDto: CreateOfficeDto): Promise<OfficeDto> {
    const { parentId, ...data } = createOfficeDto;
    const office = await this.prisma.office.create({
      data: {
        ...data,
        ...(parentId && {
          parent: {
            connect: { id: parentId },
          },
        }),
      },
      include: {
        children: true,
        parent: true,
      },
    });

    return this.mapToDto(office);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: OfficeDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
    } = options || {};

    const where: Prisma.OfficeWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [offices, total] = await Promise.all([
      this.prisma.office.findMany({
        where,
        include: {
          children: true,
          parent: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.office.count({ where }),
    ]);

    return {
      data: offices.map((office) => this.mapToDto(office)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<OfficeDto> {
    const office = await this.prisma.office.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!office) {
      throw new NotFoundException(`Office with ID ${id} not found`);
    }

    return this.mapToDto(office);
  }

  async update(
    id: string,
    updateOfficeDto: UpdateOfficeDto,
  ): Promise<OfficeDto> {
    const existingOffice = await this.prisma.office.findUnique({
      where: { id },
    });

    if (!existingOffice) {
      throw new NotFoundException(`Office with ID ${id} not found`);
    }

    const { parentId, ...data } = updateOfficeDto;
    const office = await this.prisma.office.update({
      where: { id },
      data: {
        ...data,
        ...(parentId !== undefined && {
          parent: parentId
            ? { connect: { id: parentId } }
            : { disconnect: true },
        }),
      },
      include: {
        children: true,
        parent: true,
      },
    });

    return this.mapToDto(office);
  }

  async remove(id: string): Promise<void> {
    const office = await this.prisma.office.findUnique({
      where: { id },
    });

    if (!office) {
      throw new NotFoundException(`Office with ID ${id} not found`);
    }

    await this.prisma.office.delete({
      where: { id },
    });
  }

  async getOfficeHierarchy(): Promise<OfficeDto[]> {
    const offices = await this.prisma.office.findMany({
      where: {
        parentId: null,
      },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
    });

    return offices.map((office) => this.mapToDto(office));
  }

  private mapToDto(office: any): OfficeDto {
    const off = office as {
      id: string;
      name: string;
      code: string;
      description: string | null;
      address: string | null;
      phone: string | null;
      email: string | null;
      parentId: string | null;
      isActive: boolean;
      children?: any[];
      parent?: any;
      createdAt: Date;
      updatedAt: Date;
    };

    return {
      id: off.id,
      name: off.name,
      code: off.code,
      description: off.description || undefined,
      address: off.address || undefined,
      phone: off.phone || undefined,
      email: off.email || undefined,
      parentId: off.parentId || undefined,
      isActive: off.isActive,
      children: off.children?.map((child) => this.mapToDto(child)),
      parent: off.parent ? this.mapToDto(off.parent) : undefined,
      createdAt: off.createdAt,
      updatedAt: off.updatedAt,
    };
  }
}
