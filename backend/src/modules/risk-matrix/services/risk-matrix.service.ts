import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { RiskLevel, RiskRating, RiskMatrixConfig } from '../interfaces/risk-matrix.interface';
import { RiskMatrixDto } from '../dto/risk-matrix.dto';
import { CreateRiskMatrixDto } from '../dto/create-risk-matrix.dto';
import { UpdateRiskMatrixDto } from '../dto/update-risk-matrix.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class RiskMatrixService {
  private readonly riskMatrixConfig: RiskMatrixConfig = {
    // 5x5 Risk Matrix Configuration
    matrix: [
      [1, 2, 3, 4, 5],
      [2, 4, 6, 8, 10],
      [3, 6, 9, 12, 15],
      [4, 8, 12, 16, 20],
      [5, 10, 15, 20, 25],
    ],
    levels: [
      { level: 1, description: 'Low Risk', color: 'green' },
      { level: 2, description: 'Medium Risk', color: 'yellow' },
      { level: 3, description: 'High Risk', color: 'orange' },
      { level: 4, description: 'Critical Risk', color: 'red' },
      { level: 5, description: 'Extreme Risk', color: 'darkred' },
    ],
  };

  private riskMatrixMapper: (entity: any) => RiskMatrixDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.riskMatrixMapper = this.dtoMapper.createSimpleMapper(RiskMatrixDto);
  }

  calculateRiskRating(likelihoodLevel: number, consequenceLevel: number): RiskRating {
    // Adjust indices for 0-based array
    const row = likelihoodLevel - 1;
    const col = consequenceLevel - 1;

    // Calculate risk score from matrix
    const score = this.riskMatrixConfig.matrix[row][col];

    // Determine risk level based on score
    const riskLevel = this.determineRiskLevel(score);

    return {
      riskLevel,
      score,
      description: `${riskLevel.description} (Score: ${score})`,
    };
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score <= 4) return this.riskMatrixConfig.levels[0]; // Low Risk
    if (score <= 8) return this.riskMatrixConfig.levels[1]; // Medium Risk
    if (score <= 12) return this.riskMatrixConfig.levels[2]; // High Risk
    if (score <= 16) return this.riskMatrixConfig.levels[3]; // Critical Risk
    return this.riskMatrixConfig.levels[4]; // Extreme Risk
  }

  // RiskMatrix CRUD operations
  async createRiskMatrix(createRiskMatrixDto: CreateRiskMatrixDto): Promise<RiskMatrixDto> {
    const riskMatrix = await this.prisma.riskMatrix.create({
      data: createRiskMatrixDto,
    });
    return this.riskMatrixMapper(riskMatrix);
  }

  async findAllRiskMatrices(options?: FindAllOptions): Promise<{ data: RiskMatrixDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'likelihoodLevel',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { likelihoodName: { contains: search, mode: 'insensitive' } },
        { likelihoodDesc: { contains: search, mode: 'insensitive' } },
        { consequenceName: { contains: search, mode: 'insensitive' } },
        { consequenceDesc: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [riskMatrices, total] = await Promise.all([
      this.prisma.riskMatrix.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.riskMatrix.count({ where }),
    ]);

    return {
      data: riskMatrices.map(riskMatrix => this.riskMatrixMapper(riskMatrix)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneRiskMatrix(id: string): Promise<RiskMatrixDto> {
    const riskMatrix = await this.prisma.riskMatrix.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('RiskMatrix', id, riskMatrix);
    return this.riskMatrixMapper(riskMatrix);
  }

  async updateRiskMatrix(id: string, updateRiskMatrixDto: UpdateRiskMatrixDto): Promise<RiskMatrixDto> {
    const existing = await this.prisma.riskMatrix.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('RiskMatrix', id, existing);

    const updated = await this.prisma.riskMatrix.update({
      where: { id },
      data: updateRiskMatrixDto,
    });
    return this.riskMatrixMapper(updated);
  }

  async removeRiskMatrix(id: string): Promise<void> {
    const riskMatrix = await this.prisma.riskMatrix.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('RiskMatrix', id, riskMatrix);
    await this.prisma.riskMatrix.delete({
      where: { id },
    });
  }
} 