import { Module } from '@nestjs/common';
import { MasterApprovalsService } from './master-approvals.service';
import { MasterApprovalsController } from './master-approvals.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [MasterApprovalsController],
  providers: [MasterApprovalsService],
  exports: [MasterApprovalsService],
})
export class MasterApprovalsModule {}
