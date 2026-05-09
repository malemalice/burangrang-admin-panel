import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalResolverService } from './services/approval-resolver.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ApprovalsService, ApprovalResolverService],
  exports: [ApprovalsService, ApprovalResolverService],
})
export class ApprovalsModule {} 