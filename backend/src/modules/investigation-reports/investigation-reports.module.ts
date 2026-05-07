import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { InvestigationReportsController } from './controllers/investigation-reports.controller';
import { InvestigationReportsService } from './services/investigation-reports.service';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [InvestigationReportsController],
  providers: [InvestigationReportsService],
  exports: [InvestigationReportsService],
})
export class InvestigationReportsModule {}
