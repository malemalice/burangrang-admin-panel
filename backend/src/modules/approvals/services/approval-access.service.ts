import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { UserContext } from '../../../shared/types/user-context';
import {
  ApprovalEntityName,
  ENTITY_APPROVAL_PENDING_STATUSES,
} from '../../../shared/constants/approval-entities';

/**
 * Determines whether a user is a configured approver for a given entity type,
 * enabling them to read records that are currently in an approval-pending state.
 *
 * Authorization rule (applied per data-scoped entity that uses master approvals):
 *   read = dataScope OR approvalLineMatch
 *
 * This service queries master_approval_items directly — no t_approvals writes are
 * needed and there is no N+1 on list queries. Sentinel marker items (@ENTITY_DEPARTMENT,
 * @ENTITY_JOB_POSITION) are stored as string literals that never match a real UUID, so
 * the departmentId/jobPositionId filter naturally excludes them.
 */
@Injectable()
export class ApprovalAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns whether the user's department + job position matches any step in the
   * master approval configuration for the given entity type, plus the statuses that
   * indicate a record of that type is currently pending approval.
   *
   * Use this for list queries: if isApprover is true, add an OR branch
   * { status: { in: pendingStatuses } } to the base where clause.
   */
  async isApproverForEntityType(
    entityName: ApprovalEntityName,
    userCtx: UserContext | undefined,
  ): Promise<{ isApprover: boolean; pendingStatuses: string[] }> {
    const pendingStatuses = ENTITY_APPROVAL_PENDING_STATUSES[entityName] ?? [];

    if (!userCtx || !userCtx.departmentId || !userCtx.jobPositionId) {
      return { isApprover: false, pendingStatuses };
    }

    const count = await this.prisma.masterApprovalItem.count({
      where: {
        mApproval: { entity: entityName, isActive: true },
        departmentId: userCtx.departmentId,
        jobPositionId: userCtx.jobPositionId,
      },
    });

    return { isApprover: count > 0, pendingStatuses };
  }

  /**
   * Returns true if the user is a configured approver for the entity type AND the
   * specific record is currently in an approval-pending status.
   *
   * Use this for single-record detail access gates as a fallback after the normal
   * data-scope ownership check fails.
   */
  async canViewAsApprover(
    entityName: ApprovalEntityName,
    entityId: string,
    userCtx: UserContext | undefined,
    recordStatus: string | undefined,
  ): Promise<boolean> {
    const { isApprover, pendingStatuses } = await this.isApproverForEntityType(
      entityName,
      userCtx,
    );

    if (!isApprover) return false;

    const status = recordStatus;
    return pendingStatuses.length > 0 && pendingStatuses.includes(status ?? '');
  }
}
