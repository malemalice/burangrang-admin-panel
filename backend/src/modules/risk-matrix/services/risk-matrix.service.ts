import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { RiskLevel, RiskRating, RiskMatrixConfig } from '../interfaces/risk-matrix.interface';
import { LikelihoodDto } from '../dto/likelihood.dto';
import { CreateLikelihoodDto } from '../dto/create-likelihood.dto';
import { UpdateLikelihoodDto } from '../dto/update-likelihood.dto';
import { ConsequenceDto } from '../dto/consequence.dto';
import { CreateConsequenceDto } from '../dto/create-consequence.dto';
import { UpdateConsequenceDto } from '../dto/update-consequence.dto';
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

  private likelihoodMapper: (entity: any) => LikelihoodDto;
  private consequenceMapper: (entity: any) => ConsequenceDto;
  private riskMatrixMapper: (entity: any) => RiskMatrixDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.likelihoodMapper = this.dtoMapper.createSimpleMapper(LikelihoodDto);
    this.consequenceMapper = this.dtoMapper.createSimpleMapper(ConsequenceDto);
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

  // Likelihood CRUD operations
  async createLikelihood(createLikelihoodDto: CreateLikelihoodDto): Promise<LikelihoodDto> {
    const likelihood = await this.prisma.likelihood.create({
      data: createLikelihoodDto,
    });
    return this.likelihoodMapper(likelihood);
  }

  async findAllLikelihoods(options?: FindAllOptions): Promise<{ data: LikelihoodDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'level',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { desc: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [likelihoods, total] = await Promise.all([
      this.prisma.likelihood.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.likelihood.count({ where }),
    ]);

    return {
      data: likelihoods.map(likelihood => this.likelihoodMapper(likelihood)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneLikelihood(id: string): Promise<LikelihoodDto> {
    const likelihood = await this.prisma.likelihood.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Likelihood', id, likelihood);
    return this.likelihoodMapper(likelihood);
  }

  async updateLikelihood(id: string, updateLikelihoodDto: UpdateLikelihoodDto): Promise<LikelihoodDto> {
    const existing = await this.prisma.likelihood.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Likelihood', id, existing);

    const updated = await this.prisma.likelihood.update({
      where: { id },
      data: updateLikelihoodDto,
    });
    return this.likelihoodMapper(updated);
  }

  async removeLikelihood(id: string): Promise<void> {
    const likelihood = await this.prisma.likelihood.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Likelihood', id, likelihood);
    await this.prisma.likelihood.delete({
      where: { id },
    });
  }

  // Consequence CRUD operations
  async createConsequence(createConsequenceDto: CreateConsequenceDto): Promise<ConsequenceDto> {
    const consequence = await this.prisma.consequence.create({
      data: createConsequenceDto,
    });
    return this.consequenceMapper(consequence);
  }

  async findAllConsequences(options?: FindAllOptions): Promise<{ data: ConsequenceDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'level',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { desc: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [consequences, total] = await Promise.all([
      this.prisma.consequence.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.consequence.count({ where }),
    ]);

    return {
      data: consequences.map(consequence => this.consequenceMapper(consequence)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneConsequence(id: string): Promise<ConsequenceDto> {
    const consequence = await this.prisma.consequence.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Consequence', id, consequence);
    return this.consequenceMapper(consequence);
  }

  async updateConsequence(id: string, updateConsequenceDto: UpdateConsequenceDto): Promise<ConsequenceDto> {
    const existing = await this.prisma.consequence.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Consequence', id, existing);

    const updated = await this.prisma.consequence.update({
      where: { id },
      data: updateConsequenceDto,
    });
    return this.consequenceMapper(updated);
  }

  async removeConsequence(id: string): Promise<void> {
    const consequence = await this.prisma.consequence.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Consequence', id, consequence);
    await this.prisma.consequence.delete({
      where: { id },
    });
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