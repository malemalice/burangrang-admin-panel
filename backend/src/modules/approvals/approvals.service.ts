import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateApprovalDto, ApprovalStatus } from './dto/create-approval.dto';
import { ApprovalResolverService } from './services/approval-resolver.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalResolver: ApprovalResolverService,
  ) {}

  async createApproval(
    entityName: string,
    entityId: string,
    userId: string,
  ): Promise<void> {
    // Find master approval for the entity
    const masterApproval = await this.prisma.masterApproval.findFirst({
      where: {
        entity: entityName,
        isActive: true,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!masterApproval) {
      throw new NotFoundException(`No active master approval found for entity: ${entityName}`);
    }

    // Create approval records for all items in order
    for (const item of masterApproval.items) {
      // Resolve dynamic fields (handle sentinel values)
      const { departmentId, jobPositionId } =
        await this.approvalResolver.resolveApprovalItem(
          item,
          entityId,
          entityName,
        );

      // Create approval record with resolved values
      await this.prisma.approval.create({
        data: {
          mApprovalId: masterApproval.id,
          entityId,
          status: ApprovalStatus.REQUESTED,
          departmentId,
          jobPositionId,
          createdBy: userId,
          notes: '', // Required field in schema
        },
      });
    }
  }
} 