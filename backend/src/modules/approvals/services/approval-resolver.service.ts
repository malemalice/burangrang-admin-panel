import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  APPROVAL_ENTITY_TO_TABLE,
} from '../../../shared/constants/approval-entities';
import { APPROVAL_FIELD_MARKERS } from '../constants/approval-field-markers';
import { Prisma } from '@prisma/client';

interface MasterApprovalItem {
  departmentId: string;
  jobPositionId: string;
}

interface ResolvedApprovalItem {
  departmentId: string;
  jobPositionId: string;
}

@Injectable()
export class ApprovalResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve approval item fields, replacing sentinel values with actual entity data
   * 
   * @param item - Master approval item that may contain sentinel values
   * @param entityId - ID of the entity being approved
   * @param entityName - Name of the entity (e.g., 'PURCHASE_REQUEST')
   * @returns Resolved approval item with actual department and job position IDs
   */
  async resolveApprovalItem(
    item: MasterApprovalItem,
    entityId: string,
    entityName: string,
  ): Promise<ResolvedApprovalItem> {
    let departmentId: string;
    let jobPositionId: string;

    // Resolve department
    if (item.departmentId === APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT) {
      const entity = await this.getEntityData(entityId, entityName);
      if (!entity.departmentId) {
        throw new NotFoundException(
          `Entity ${entityId} does not have a departmentId field`,
        );
      }
      departmentId = entity.departmentId;
    } else {
      departmentId = item.departmentId; // Use fixed value
    }

    // Resolve job position
    if (item.jobPositionId === APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION) {
      // Get entity if not already retrieved (need department for finding head)
      let entityDepartmentId: string;
      if (item.departmentId === APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT) {
        // Already have departmentId from above
        entityDepartmentId = departmentId;
      } else {
        // Need to get entity to find its department
        const entity = await this.getEntityData(entityId, entityName);
        entityDepartmentId = entity.departmentId;
      }

      if (!entityDepartmentId) {
        throw new NotFoundException(
          `Cannot resolve department head: entity ${entityId} does not have a departmentId`,
        );
      }

      // Find department head in that department
      const deptHead = await this.findDepartmentHead(entityDepartmentId);
      jobPositionId = deptHead.jobPositionId;
    } else {
      jobPositionId = item.jobPositionId; // Use fixed value
    }

    return { departmentId, jobPositionId };
  }

  /**
   * Retrieve entity data (specifically departmentId) from the database
   *
   * @param entityId - ID of the entity
   * @param entityName - Name of the entity (e.g., 'PURCHASE_REQUEST')
   * @returns Entity data containing departmentId
   */
  private async getEntityData(
    entityId: string,
    entityName: string,
  ): Promise<{ departmentId: string }> {
    const tableName =
      APPROVAL_ENTITY_TO_TABLE[entityName as keyof typeof APPROVAL_ENTITY_TO_TABLE];

    if (!tableName) {
      throw new BadRequestException(
        `Entity ${entityName} not found in approval entity mapping`,
      );
    }

    // Query entity to get departmentId
    // Using raw query since we need to query dynamic table names
    const result = await this.prisma.$queryRaw<
      Array<{ departmentId: string }>
    >`
      SELECT "departmentId"
      FROM ${Prisma.raw(`"${tableName}"`)}
      WHERE id = ${entityId}
      LIMIT 1
    `;

    if (!result || result.length === 0 || !result[0]?.departmentId) {
      throw new NotFoundException(
        `Entity ${entityId} not found or missing departmentId in table ${tableName}`,
      );
    }

    return { departmentId: result[0].departmentId };
  }

  /**
   * Find the department head user in a given department
   * Looks for job positions with codes that indicate department head role
   * Uses 'HEAD' as the default job position code, with fallbacks to other common codes
   * 
   * @param departmentId - ID of the department
   * @returns User with department head job position
   */
  private async findDepartmentHead(departmentId: string): Promise<{
    id: string;
    jobPositionId: string;
  }> {
    // First, try to find job position with code 'HEAD' (default for department head)
    const defaultHeadPosition = await this.prisma.jobPosition.findFirst({
      where: {
        code: 'HEAD',
        isActive: true,
      },
    });

    // Build list of job position codes to search (HEAD is primary)
    const headJobPositionCodes = defaultHeadPosition
      ? ['HEAD', 'DEPARTMENT_HEAD', 'DEPT_HEAD', 'MANAGER']
      : ['DEPARTMENT_HEAD', 'DEPT_HEAD', 'MANAGER', 'HEAD'];

    // Find all job positions with head-related codes
    const headJobPositions = await this.prisma.jobPosition.findMany({
      where: {
        code: {
          in: headJobPositionCodes,
        },
        isActive: true,
      },
    });

    if (headJobPositions.length === 0) {
      throw new NotFoundException(
        'Department head job position not configured. Expected job position codes: HEAD (default), DEPARTMENT_HEAD, DEPT_HEAD, or MANAGER',
      );
    }

    // Prefer 'HEAD' code if available, otherwise use any found head position
    const preferredJobPositionId = defaultHeadPosition
      ? defaultHeadPosition.id
      : headJobPositions[0].id;

    // Find user in department with head job position (prefer 'HEAD' code)
    const deptHead = await this.prisma.user.findFirst({
      where: {
        departmentId,
        jobPositionId: preferredJobPositionId,
        isActive: true,
      },
      select: {
        id: true,
        jobPositionId: true,
      },
    });

    // If no user with preferred position, try other head positions
    if (!deptHead) {
      const fallbackDeptHead = await this.prisma.user.findFirst({
        where: {
          departmentId,
          jobPositionId: { in: headJobPositions.map((p) => p.id) },
          isActive: true,
        },
        select: {
          id: true,
          jobPositionId: true,
        },
      });

      if (!fallbackDeptHead) {
        throw new NotFoundException(
          `No department head found for department: ${departmentId}. Ensure there is an active user with a head job position (preferably code 'HEAD') in this department.`,
        );
      }

      if (!fallbackDeptHead.jobPositionId) {
        throw new NotFoundException(
          `Department head user (${fallbackDeptHead.id}) does not have a job position assigned.`,
        );
      }

      return {
        id: fallbackDeptHead.id,
        jobPositionId: fallbackDeptHead.jobPositionId,
      };
    }

    if (!deptHead.jobPositionId) {
      throw new NotFoundException(
        `Department head user (${deptHead.id}) does not have a job position assigned.`,
      );
    }

    return {
      id: deptHead.id,
      jobPositionId: deptHead.jobPositionId,
    };
  }
}
