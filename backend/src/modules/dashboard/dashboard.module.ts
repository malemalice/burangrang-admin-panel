import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { PrismaService } from '../../core/services/prisma.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
})
export class DashboardModule {} 