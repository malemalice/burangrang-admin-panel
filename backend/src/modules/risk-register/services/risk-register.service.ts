/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { RiskRegisterDto } from '../dto/risk-register.dto';
import { FindRiskRegisterDto } from '../dto/find-risk-register.dto';
import {
  RiskRegisterSourceRiskAssessmentDto,
  RiskRegisterSourceInspectionDto,
} from '../dto/risk-register-source.dto';
import { Prisma, GeneralStatusEnum } from '@prisma/client';
import { endOfDay } from 'date-fns';

const RISK_ASSESSMENT_ITEM_ENTITY = 'RISK_ASSESSMENT_ITEM';
const INSPECTION_ITEM_ENTITY = 'INSPECTION_ITEM';

@Injectable()
export class RiskRegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {}

  async findAll(options?: FindRiskRegisterDto): Promise<{
    data: RiskRegisterDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      entityType,
      departmentId,
      riskId,
      riskCategoryId,
      status,
      isActive,
      search,
      createdAtFrom,
      createdAtTo,
    } = options || {};

    const hasSearchOrFilters =
      !!search || !!departmentId || !!riskId || !!riskCategoryId || status !== undefined;

    let matchingRiskAssessmentItemIds: string[] = [];
    let matchingInspectionItemIds: string[] = [];

    // Pre-filter: when search or filters are applied, find matching entity IDs first
    // so pagination and total count reflect the filtered result set (RR-016, RR-017)
    if (hasSearchOrFilters) {
      const shouldIncludeRiskAssessment =
        !entityType || entityType === RISK_ASSESSMENT_ITEM_ENTITY;
      const shouldIncludeInspection =
        !entityType || entityType === INSPECTION_ITEM_ENTITY;

      if (shouldIncludeRiskAssessment) {
        const riskAssessmentWhere: Prisma.RiskAssessmentItemWhereInput = {
          ...(riskId && { mRiskId: riskId }),
          ...(riskCategoryId && { mRiskCategoryId: riskCategoryId }),
          ...(status && {
            riskAssessment: { status: status as GeneralStatusEnum },
          }),
          ...(departmentId && {
            riskAssessment: { departmentId },
          }),
          ...(search && {
            OR: [
              { riskAssessment: { code: { contains: search, mode: 'insensitive' } } },
              { mRisk: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }),
        };
        const items = await this.prisma.riskAssessmentItem.findMany({
          where: riskAssessmentWhere,
          select: { id: true },
        });
        matchingRiskAssessmentItemIds = items.map((i) => i.id);
      }

      if (shouldIncludeInspection) {
        const inspectionWhere: Prisma.InspectionItemWhereInput = {
          ...(riskId && { riskId }),
          ...(riskCategoryId && { riskCategoryId }),
          ...(status && { status }),
          ...(departmentId && { assignedDepartmentId: departmentId }),
          ...(search && {
            OR: [
              { inspection: { code: { contains: search, mode: 'insensitive' } } },
              { risk: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }),
        };
        const items = await this.prisma.inspectionItem.findMany({
          where: inspectionWhere,
          select: { id: true },
        });
        matchingInspectionItemIds = items.map((i) => i.id);
      }
    }

    // Build where clause for RiskMitigationRecord
    const where: Prisma.RiskMitigationRecordWhereInput = {};

    if (entityType) {
      where.entity = entityType;
    } else {
      where.OR = [
        { entity: RISK_ASSESSMENT_ITEM_ENTITY },
        { entity: INSPECTION_ITEM_ENTITY },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (createdAtFrom || createdAtTo) {
      where.createdAt = {};
      if (createdAtFrom) {
        (where.createdAt as Prisma.DateTimeFilter).gte = new Date(createdAtFrom);
      }
      if (createdAtTo) {
        (where.createdAt as Prisma.DateTimeFilter).lte = endOfDay(new Date(createdAtTo));
      }
    }

    // Restrict to matching entity IDs when search/filters applied
    if (hasSearchOrFilters) {
      const entityIdConditions: Prisma.RiskMitigationRecordWhereInput[] = [];
      if (matchingRiskAssessmentItemIds.length > 0) {
        entityIdConditions.push({
          entity: RISK_ASSESSMENT_ITEM_ENTITY,
          entityId: { in: matchingRiskAssessmentItemIds },
        });
      }
      if (matchingInspectionItemIds.length > 0) {
        entityIdConditions.push({
          entity: INSPECTION_ITEM_ENTITY,
          entityId: { in: matchingInspectionItemIds },
        });
      }
      if (entityIdConditions.length === 0) {
        return {
          data: [],
          meta: { total: 0, page, limit },
        };
      }
      where.AND = [
        ...(where.AND as Prisma.RiskMitigationRecordWhereInput[] || []),
        { OR: entityIdConditions },
      ];
    }

    // Get mitigation records with correct pagination and total
    const [mitigationRecords, total] = await Promise.all([
      this.prisma.riskMitigationRecord.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.riskMitigationRecord.count({ where }),
    ]);

    const riskAssessmentItemIds: string[] = [];
    const inspectionItemIds: string[] = [];

    mitigationRecords.forEach((record) => {
      if (record.entity === RISK_ASSESSMENT_ITEM_ENTITY) {
        riskAssessmentItemIds.push(record.entityId);
      } else if (record.entity === INSPECTION_ITEM_ENTITY) {
        inspectionItemIds.push(record.entityId);
      }
    });

    // Fetch Risk Assessment Items with relations (no need to re-apply filters here;
    // records are already pre-filtered)
    const riskAssessmentItems =
      riskAssessmentItemIds.length > 0
        ? await this.prisma.riskAssessmentItem.findMany({
            where: { id: { in: riskAssessmentItemIds } },
            include: {
              riskAssessment: {
                include: {
                  department: true,
                  creator: true,
                  assignee: true,
                },
              },
              mRisk: true,
              mRiskCategory: true,
            },
          })
        : [];

    // Fetch Inspection Items with relations
    const inspectionItems =
      inspectionItemIds.length > 0
        ? await this.prisma.inspectionItem.findMany({
            where: { id: { in: inspectionItemIds } },
            include: {
              inspection: {
                include: {
                  creator: true,
                },
              },
              area: true,
              riskCategory: true,
              risk: true,
              assignedDepartment: true,
              assignee: true,
            },
          })
        : [];

    // Create maps for quick lookup
    const riskAssessmentItemMap = new Map(
      riskAssessmentItems.map((item) => [item.id, item]),
    );
    const inspectionItemMap = new Map(
      inspectionItems.map((item) => [item.id, item]),
    );

    // Build RiskRegisterDto array
    const data: RiskRegisterDto[] = mitigationRecords
      .map((record) => {
        let source: RiskRegisterSourceRiskAssessmentDto | RiskRegisterSourceInspectionDto | null = null;

        if (record.entity === RISK_ASSESSMENT_ITEM_ENTITY) {
          const item = riskAssessmentItemMap.get(record.entityId);
          if (item && item.riskAssessment) {
            source = {
              riskAssessmentId: item.riskAssessment.id,
              code: item.riskAssessment.code,
              description: item.riskAssessment.description || undefined,
              assessmentDate: item.riskAssessment.assessmentDate,
              status: item.riskAssessment.status,
              riskAssessmentItem: {
                id: item.id,
                mRiskId: (item as any).mRiskId,
                mRisk: item.mRisk,
                mRiskCategoryId: item.mRiskCategoryId,
                mRiskCategory: item.mRiskCategory,
                likelihoodLevel: item.likelihoodLevel as string,
                consequenceLevel: item.consequenceLevel,
                riskMatrixRating: item.riskMatrixRating,
                interpretation: item.interpretation,
                postLikelihoodLevel: item.postLikelihoodLevel as string,
                postConsequenceLevel: item.postConsequenceLevel,
                postRiskMatrixRating: item.postRiskMatrixRating,
                postInterpretation: item.postInterpretation,
              },
              department: item.riskAssessment.department,
              creator: item.riskAssessment.creator || undefined,
              assignee: item.riskAssessment.assignee || undefined,
            } as RiskRegisterSourceRiskAssessmentDto;
          }
        } else if (record.entity === INSPECTION_ITEM_ENTITY) {
          const item = inspectionItemMap.get(record.entityId);
          if (item && item.inspection) {
            source = {
              code: item.inspection.code,
              inspectionDate: item.inspection.inspectionDate,
              inspectionItem: {
                id: item.id,
                riskId: item.riskId,
                risk: item.risk,
                riskCategoryId: item.riskCategoryId,
                riskCategory: item.riskCategory,
                findings: item.findings || undefined,
                description: item.description || undefined,
                status: item.status,
              },
              area: item.area,
              department: item.assignedDepartment,
              assignee: item.assignee || undefined,
            } as RiskRegisterSourceInspectionDto;
          }
        }

        // Only include records that have valid source context
        if (!source) {
          return null;
        }

        return {
          id: record.id,
          code: record.code,
          entity: record.entity,
          entityId: record.entityId,
          eliminate: record.eliminate || undefined,
          transfer: record.transfer || undefined,
          reduce: record.reduce || undefined,
          accept: record.accept || undefined,
          legalAspect: record.legalAspect || undefined,
          isActive: record.isActive,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          source,
        } as RiskRegisterDto;
      })
      .filter((item): item is RiskRegisterDto => item !== null);

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<RiskRegisterDto> {
    const record = await this.prisma.riskMitigationRecord.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Risk Mitigation Record', id, record);

    let source: RiskRegisterSourceRiskAssessmentDto | RiskRegisterSourceInspectionDto | null = null;

    if (record.entity === RISK_ASSESSMENT_ITEM_ENTITY) {
      const item = await this.prisma.riskAssessmentItem.findUnique({
        where: { id: record.entityId },
        include: {
          riskAssessment: {
            include: {
              department: true,
              creator: true,
              assignee: true,
            },
          },
          mRisk: true,
          mRiskCategory: true,
        },
      });

      if (item && item.riskAssessment) {
        source = {
          riskAssessmentId: item.riskAssessment.id,
          code: item.riskAssessment.code,
          description: item.riskAssessment.description || undefined,
          assessmentDate: item.riskAssessment.assessmentDate,
          status: item.riskAssessment.status,
          riskAssessmentItem: {
            id: item.id,
            mRiskId: (item as any).mRiskId,
            mRisk: item.mRisk,
            mRiskCategoryId: item.mRiskCategoryId,
            mRiskCategory: item.mRiskCategory,
            likelihoodLevel: item.likelihoodLevel as string,
            consequenceLevel: item.consequenceLevel,
            riskMatrixRating: item.riskMatrixRating,
            interpretation: item.interpretation,
            postLikelihoodLevel: item.postLikelihoodLevel as string,
            postConsequenceLevel: item.postConsequenceLevel,
            postRiskMatrixRating: item.postRiskMatrixRating,
            postInterpretation: item.postInterpretation,
          },
          department: item.riskAssessment.department,
          creator: item.riskAssessment.creator || undefined,
          assignee: item.riskAssessment.assignee || undefined,
        } as RiskRegisterSourceRiskAssessmentDto;
      }
    } else if (record.entity === INSPECTION_ITEM_ENTITY) {
      const item = await this.prisma.inspectionItem.findUnique({
        where: { id: record.entityId },
        include: {
          inspection: {
            include: {
              creator: true,
            },
          },
          area: true,
          riskCategory: true,
          risk: true,
          assignedDepartment: true,
          assignee: true,
          images: { orderBy: { order: 'asc' } },
        },
      });

      if (item && item.inspection) {
        source = {
          code: item.inspection.code,
          inspectionDate: item.inspection.inspectionDate,
          inspectionItem: {
            id: item.id,
            riskId: item.riskId,
            risk: item.risk,
            riskCategoryId: item.riskCategoryId,
            riskCategory: item.riskCategory,
            findings: item.findings || undefined,
            description: item.description || undefined,
            followUpNotes: item.followUpNotes || undefined,
            status: item.status,
            images: (item.images || []).map((img) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              caption: img.caption || undefined,
              type: img.type,
              order: img.order,
            })),
          },
          area: item.area,
          department: item.assignedDepartment,
          assignee: item.assignee || undefined,
        } as RiskRegisterSourceInspectionDto;
      }
    }

    if (!source) {
      throw new Error(
        `Source context not found for ${record.entity} with ID ${record.entityId}`,
      );
    }

    return {
      id: record.id,
      code: record.code,
      entity: record.entity,
      entityId: record.entityId,
      eliminate: record.eliminate || undefined,
      transfer: record.transfer || undefined,
      reduce: record.reduce || undefined,
      accept: record.accept || undefined,
      legalAspect: record.legalAspect || undefined,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      source,
    } as RiskRegisterDto;
  }
}
