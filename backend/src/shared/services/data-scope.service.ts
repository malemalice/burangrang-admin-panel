import { Injectable } from '@nestjs/common';
import { UserContext } from '../types/user-context';

/** Entity names supported for data-level scoping. Only these four are filtered. */
export const DATA_SCOPED_ENTITIES = [
  'Enrollment',
  'Certificate',
  'WorkPermit',
  'PPEWithdrawal',
] as const;

export type DataScopedEntityName = (typeof DATA_SCOPED_ENTITIES)[number];

/**
 * Central service for data-level (SELF / DEPARTMENT / SUPER) access.
 * Knows only the four entities: Enrollment, Certificate, WorkPermit, PPEWithdrawal.
 * For any other entity, returns no extra filter / can access (so other modules are unaffected).
 *
 * Edge case: User with departmentId === null and dataLevel === DEPARTMENT is treated as
 * empty scope (no department rows) so list returns no rows and single-record access is denied.
 */
@Injectable()
export class DataScopeService {
  /**
   * Returns a Prisma where fragment to merge with list queries for the given entity.
   * Merge with: where = { ...existingWhere, ...scopeWhere } or AND with scopeWhere.
   * For unknown entity, returns {} (no extra filter).
   */
  buildWhereForList(
    userContext: UserContext | undefined,
    entityName: string,
    existingWhere?: object,
  ): object {
    if (!userContext) {
      return {};
    }

    const { dataLevel, userId, departmentId } = userContext;

    if (dataLevel === 'SUPER') {
      return {};
    }

    switch (entityName) {
      case 'Enrollment':
        return this.enrollmentScopeWhere(userContext);
      case 'Certificate':
        return this.certificateScopeWhere(userContext);
      case 'WorkPermit':
        return this.workPermitScopeWhere(userContext);
      case 'PPEWithdrawal':
        return this.ppeWithdrawalScopeWhere(userContext);
      default:
        return {};
    }
  }

  /**
   * Returns true if the user can access the given record for single-record operations
   * (findOne, update, remove). For unknown entity, returns true.
   */
  canAccessRecord(
    userContext: UserContext | undefined,
    entityName: string,
    record: Record<string, unknown>,
  ): boolean {
    if (!userContext) {
      return true;
    }

    const { dataLevel, userId, departmentId } = userContext;

    if (dataLevel === 'SUPER') {
      return true;
    }

    switch (entityName) {
      case 'Enrollment':
        return this.enrollmentCanAccess(userContext, record);
      case 'Certificate':
        return this.certificateCanAccess(userContext, record);
      case 'WorkPermit':
        return this.workPermitCanAccess(userContext, record);
      case 'PPEWithdrawal':
        return this.ppeWithdrawalCanAccess(userContext, record);
      default:
        return true;
    }
  }

  private enrollmentScopeWhere(ctx: UserContext): object {
    if (ctx.dataLevel === 'SELF') {
      return { userId: ctx.userId };
    }
    if (ctx.dataLevel === 'DEPARTMENT') {
      if (ctx.departmentId == null) {
        return { id: { in: [] } };
      }
      return { user: { departmentId: ctx.departmentId } };
    }
    return {};
  }

  private enrollmentCanAccess(ctx: UserContext, record: Record<string, unknown>): boolean {
    if (ctx.dataLevel === 'SELF') {
      return record.userId === ctx.userId;
    }
    if (ctx.dataLevel === 'DEPARTMENT') {
      if (ctx.departmentId == null) return false;
      const user = record.user as Record<string, unknown> | undefined;
      return user?.departmentId === ctx.departmentId;
    }
    return true;
  }

  private certificateScopeWhere(ctx: UserContext): object {
    if (ctx.dataLevel === 'SELF') {
      return {
        OR: [
          { createdBy: ctx.userId },
          { personnelId: ctx.userId },
        ],
      };
    }
    if (ctx.dataLevel === 'DEPARTMENT') {
      if (ctx.departmentId == null) {
        return { id: { in: [] } };
      }
      return { departmentId: ctx.departmentId };
    }
    return {};
  }

  private certificateCanAccess(ctx: UserContext, record: Record<string, unknown>): boolean {
    if (ctx.dataLevel === 'SELF') {
      return (
        record.createdBy === ctx.userId || record.personnelId === ctx.userId
      );
    }
    if (ctx.dataLevel === 'DEPARTMENT') {
      if (ctx.departmentId == null) return false;
      return record.departmentId === ctx.departmentId;
    }
    return true;
  }

  private workPermitScopeWhere(ctx: UserContext): object {
    if (ctx.dataLevel === 'SELF') {
      return { createdBy: ctx.userId };
    }
    if (ctx.dataLevel === 'DEPARTMENT') {
      if (ctx.departmentId == null) {
        return { id: { in: [] } };
      }
      return { creator: { departmentId: ctx.departmentId } };
    }
    return {};
  }

  private workPermitCanAccess(ctx: UserContext, record: Record<string, unknown>): boolean {
    if (ctx.dataLevel === 'SELF') {
      return record.createdBy === ctx.userId;
    }
    if (ctx.dataLevel === 'DEPARTMENT') {
      if (ctx.departmentId == null) return false;
      const creator = record.creator as Record<string, unknown> | undefined;
      return creator?.departmentId === ctx.departmentId;
    }
    return true;
  }

  private ppeWithdrawalScopeWhere(ctx: UserContext): object {
    if (ctx.dataLevel === 'SELF') {
      return {
        OR: [
          { requestedBy: ctx.userId },
          { requestedFor: ctx.userId },
          { createdBy: ctx.userId },
        ],
      };
    }
    if (ctx.dataLevel === 'DEPARTMENT') {
      if (ctx.departmentId == null) {
        return { id: { in: [] } };
      }
      return { departmentId: ctx.departmentId };
    }
    return {};
  }

  private ppeWithdrawalCanAccess(ctx: UserContext, record: Record<string, unknown>): boolean {
    if (ctx.dataLevel === 'SELF') {
      return (
        record.requestedBy === ctx.userId ||
        record.requestedFor === ctx.userId ||
        record.createdBy === ctx.userId
      );
    }
    if (ctx.dataLevel === 'DEPARTMENT') {
      if (ctx.departmentId == null) return false;
      return record.departmentId === ctx.departmentId;
    }
    return true;
  }
}
