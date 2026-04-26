import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildSoftDeleteDataWithInactive } from '../../shared/utils/soft-delete.util';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyDto } from './dto/company.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class CompaniesService {
  private companyMapper: (company: any) => CompanyDto;
  private companyPaginatedMapper: (data: { data: any[]; meta: any }) => { data: CompanyDto[]; meta: any };

  constructor(
    private readonly prisma: PrismaService,
    private readonly dtoMapper: DtoMapperService,
    private readonly errorHandler: ErrorHandlingService,
  ) {
    this.companyMapper = this.dtoMapper.createSimpleMapper(CompanyDto);
    this.companyPaginatedMapper = this.dtoMapper.createPaginatedMapper(CompanyDto);
  }

  async create(createCompanyDto: CreateCompanyDto): Promise<CompanyDto> {
    const company = await this.prisma.company.create({
      data: createCompanyDto,
    });

    return this.companyMapper(company);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: CompanyDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};

    const where: Prisma.CompanyWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    return this.companyPaginatedMapper({
      data: companies,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<CompanyDto> {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Company', id, company);

    return this.companyMapper(company);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<CompanyDto> {
    const existingCompany = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Company', id, existingCompany);

    const company = await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });

    return this.companyMapper(company);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        workPermits: {
          where: { deletedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Company', id, company);

    if (company.workPermits.length > 0) {
      this.errorHandler.throwConflictCustom(
        `Cannot delete company with ID ${id} because it has associated work permits`,
      );
    }

    await this.prisma.company.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }
}
