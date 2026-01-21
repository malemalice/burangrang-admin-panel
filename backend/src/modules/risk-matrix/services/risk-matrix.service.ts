import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  RiskLevel,
  RiskRating,
  RiskMatrixConfig,
} from '../interfaces/risk-matrix.interface';
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

  async calculateRiskRating(
    likelihoodLevel: string,
    consequenceLevel: number,
  ): Promise<RiskRating> {
    // Query RiskMatrix table to find matching risk rating
    // Database stores: likelihoodLevel as String (A, B, C, D, E, etc.), consequenceLevel as Int (1, 2, 3, 4, 5, etc.)
    const riskMatrix = await this.prisma.riskMatrix.findFirst({
      where: {
        likelihoodLevel: likelihoodLevel,
        consequenceLevel: consequenceLevel,
        isActive: true,
      },
    });

    // Throw error if no matching risk matrix found
    this.errorHandler.throwIfNotFound(
      'RiskMatrix',
      `likelihoodLevel ${likelihoodLevel} and consequenceLevel ${consequenceLevel}`,
      riskMatrix,
    );

    // Calculate risk score (likelihoodLevel number * consequenceLevel)
    // Convert likelihood letter to number for score calculation: A=1, B=2, C=3, D=4, E=5, etc.
    const likelihoodLevelNum = likelihoodLevel.charCodeAt(0) - 64; // 'A'.charCodeAt(0) = 65, so A becomes 1
    const score = likelihoodLevelNum * consequenceLevel;

    // Map RiskRatingEnum to RiskLevel
    const riskLevel = this.mapRiskRatingToRiskLevel(riskMatrix.risk_rating);

    return {
      riskLevel,
      score,
      description: `${riskLevel.description} (Score: ${score})`,
    };
  }

  private mapRiskRatingToRiskLevel(riskRating: string): RiskLevel {
    // Map RiskRatingEnum to RiskLevel interface
    const ratingMap: Record<string, RiskLevel> = {
      LOW: { level: 1, description: 'Low Risk', color: 'green' },
      MEDIUM: { level: 2, description: 'Medium Risk', color: 'yellow' },
      HIGH: { level: 3, description: 'High Risk', color: 'orange' },
      EXTREME: { level: 4, description: 'Extreme Risk', color: 'red' },
    };

    return (
      ratingMap[riskRating] || {
        level: 0,
        description: 'Unknown Risk',
        color: 'gray',
      }
    );
  }

  // RiskMatrix CRUD operations
  async createRiskMatrix(
    createRiskMatrixDto: CreateRiskMatrixDto,
  ): Promise<RiskMatrixDto> {
    const riskMatrix = await this.prisma.riskMatrix.create({
      data: createRiskMatrixDto,
    });
    return this.riskMatrixMapper(riskMatrix);
  }

  async findAllRiskMatrices(options?: FindAllOptions): Promise<{
    data: RiskMatrixDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'likelihoodLevel',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};

    const where: {
      OR?: Array<{
        likelihoodName?: { contains: string; mode: 'insensitive' };
        likelihoodDesc?: { contains: string; mode: 'insensitive' };
        consequenceName?: { contains: string; mode: 'insensitive' };
        consequenceDesc?: { contains: string; mode: 'insensitive' };
      }>;
      isActive?: boolean;
    } = {};

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
      data: riskMatrices.map((riskMatrix) => this.riskMatrixMapper(riskMatrix)),
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

  async updateRiskMatrix(
    id: string,
    updateRiskMatrixDto: UpdateRiskMatrixDto,
  ): Promise<RiskMatrixDto> {
    const existing = await this.prisma.riskMatrix.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('RiskMatrix', id, existing);

    // Build update data with only defined fields so risk_rating and other optional fields are persisted correctly
    const data = Object.fromEntries(
      Object.entries(updateRiskMatrixDto).filter(([_, v]) => v !== undefined),
    );

    const updated = await this.prisma.riskMatrix.update({
      where: { id },
      data,
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
