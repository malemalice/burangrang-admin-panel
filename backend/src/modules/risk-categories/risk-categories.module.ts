import { Module } from '@nestjs/common';
import { RiskCategoriesService } from './risk-categories.service';
import { RiskCategoriesController } from './risk-categories.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [RiskCategoriesController],
  providers: [RiskCategoriesService],
  exports: [RiskCategoriesService],
})
export class RiskCategoriesModule {} 