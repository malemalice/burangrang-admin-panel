import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateApprovalDto, ApprovalStatus } from './dto/create-approval.dto';

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Get user data to get department and job position
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        jobPositionId: true,
      },
    });

    // Create approval record
    await this.prisma.approval.create({
      data: {
        mApprovalId: masterApproval.id,
        entityId,
        status: ApprovalStatus.REQUESTED,
        departmentId: user?.departmentId || '',
        jobPositionId: user?.jobPositionId || '',
        createdBy: userId,
        notes: '', // Required field in schema
      },
    });
  }
} 