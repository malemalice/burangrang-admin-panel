import { Module } from '@nestjs/common';
import { MasterApprovalsService } from './master-approvals.service';
import { MasterApprovalsController } from './master-approvals.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [PrismaModule],
  controllers: [MasterApprovalsController],
  providers: [MasterApprovalsService, ConfigService],
  exports: [MasterApprovalsService],
})
export class MasterApprovalsModule {}