import { Module } from '@nestjs/common';
import { MasterApprovalsService } from './master-approvals.service';
import { MasterApprovalsController } from './master-approvals.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MasterApprovalsController],
  providers: [MasterApprovalsService],
  exports: [MasterApprovalsService],
})
export class MasterApprovalsModule {} 